import fs from 'node:fs/promises';
import path from 'path'; // See https://nodejs.org/api/path.html
import { awsToIcLines, icTranscriptToTextLines, icToVtt, type TranscriptTextLine, type AwsTranscript, type TranscriptSchema } from "@incharge/transcript-core"
import { isFile, setExtension } from './utils.mjs';
import { config, episode } from './types.mjs';

async function fileToObject(transcriptPath: string) {
    return JSON.parse(await fs.readFile(transcriptPath, 'utf-8'));
}

async function AwsFileToIcFile(inFile: string, episodeFile: string, outFile: string, config: config): Promise<TranscriptSchema> {
    // Create the transcript object
    const icTranscript: TranscriptSchema = {
        url: "",
        speakers: [],
        lines: [],
    };
    let awsTranscript: AwsTranscript | undefined;
    let episode: episode | undefined;

    // Load the aws transcript file
    let textTranscript: string |  undefined;
    try {
        textTranscript = await fs.readFile(inFile, 'utf-8' );
    }
    catch (e: any) {
        throw new Error(`Failed to read transcript ${inFile}: ${e.message}`);
    }

    // Parse the transcript json
    try {
        awsTranscript = JSON.parse(textTranscript);
    } catch (e: any) {
            throw new Error(`Failed to parse json input file '${inFile}' - ${e.message}`);
    }

    // Load additional data from the episode file
    let textEpisode: string |  undefined;
    try {
        textEpisode = await fs.readFile(episodeFile, 'utf-8' );
    }
    catch (e: any) {
        throw new Error(`Failed to read ${episodeFile}: ${e.message}`);
    }

    // Parse the episode json
    try {
        episode = JSON.parse(textEpisode);
    } catch (e: any) {
        throw new Error(`Failed to parse episode file '${episodeFile}' - ${e.message}`);
    }
    
    if (!episode || !awsTranscript) {
        throw new Error(`Failed to load episode file '${episodeFile}'`);
    }

    icTranscript.url = episode.spotifyAudioUrl;
    icTranscript.speakers.push(config.defaults.interviewer[0]);
    icTranscript.speakers.push(...episode.interviewee);

    let result =  await awsToIcLines(awsTranscript);
    if ( result instanceof Error) {
        throw new Error(`Invalid json input file '${inFile}': ${result.message}`);
    }

    icTranscript.lines = result;
    await fs.writeFile(outFile, JSON.stringify(icTranscript, null, '\t'));

    return icTranscript;
}

async function writeIc(file: string, config: config) {
    let fromPath = path.join(config['episode-folder'], file, 'transcript.json');
    let fromExists = await isFile(fromPath);
    const episodePath = path.join(config['episode-folder'], file, 'episode.json');
    const episodeExists = await isFile(episodePath);
    let isForce: boolean = false; // Force derrived files to be recreated, even if they already exist
    if ( episodeExists && fromExists ) {
        let transcript: TranscriptSchema | undefined;

        // There is an episode file and an AWS transcript, so there should be derived files too
        let toPath = path.join(config['episode-folder'], file, 'transcript.ic.json');
        if (!await isFile(toPath)) {
            // Create IC transcript
            console.log(`Writing ${toPath}`);
            transcript = await AwsFileToIcFile(fromPath, episodePath, toPath, config);
            isForce = true;
        }
        fromPath = toPath;

        toPath = path.join(config['transcript-folder'], setExtension(file, 'lines.json'));
        if (isForce || !await isFile(toPath)) {
            if (!transcript) {
                transcript = await fileToObject(fromPath) as TranscriptSchema;
            }
            let icTextLines: Array<TranscriptTextLine> | Error;
            icTextLines = await icTranscriptToTextLines(transcript);
            console.log(`Writing ${toPath}`);
            await fs.writeFile(toPath, JSON.stringify(icTextLines, null, '\t'));
        }

        toPath = path.join(config['transcript-folder'], setExtension(file, 'vtt'));
        if (isForce || !await isFile(toPath)) {
            if (!transcript) {
                transcript = await fileToObject(fromPath) as TranscriptSchema;
            }
            const vtt = icToVtt(transcript, true);
            console.log(`Writing ${toPath}`);
            await fs.writeFile(toPath, vtt);
        }
    }
}

/*
aws
	ic
		lines
		vtt
*/
export async function createIc(config: config) {
    console.log(`Generating transcripts from ${config['episode-folder']} to ${config['transcript-folder']}`);

    try {
        const files = await fs.readdir(config['episode-folder']);
        for (const file of files) {
            try {
                writeIc(file, config);
            } catch (err: any) {
                console.error(err.message);
            }
        }
    } catch (err) {
        console.error(err);
    } 
}
