import fs from 'node:fs/promises';
import path from 'path'; // See https://nodejs.org/api/path.html
import { awsToIcLines, icTranscriptToTextLines, icToVtt, type TranscriptTextLine, type AwsTranscript, type TranscriptSchema } from "@incharge/transcript-core"
import { getFileModified, setExtension } from './utils.mjs';
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
    // If episode exists and aws transcript exists and ic transcript doesn't
    let fromPath = path.join(config['episode-folder'], file, 'transcript.json');
    let fromModified = await getFileModified(fromPath);
    let toPath = path.join(config['episode-folder'], file, 'transcript.ic.json');
    let toModified = await getFileModified(toPath);
    const episodePath = path.join(config['episode-folder'], file, 'episode.json');
    const episodeModified = await getFileModified(episodePath);
    if ( episodeModified.valueOf() && fromModified.valueOf() ) {
        let transcript: TranscriptSchema | undefined;

        // There is an episode file and an AWS transcript, so there should be derived files too
        if (toModified.valueOf()) {
            if (toModified < fromModified ) {
                // The aws transcript has been changed/regenerated since the ic transcript was first generated
                // But don't overwrite it, because it might contain corrections
                console.log(`WARNING: ${toPath} is older than ${fromPath} by ${fromModified.valueOf()-toModified.valueOf()} ticks. ${toModified.toISOString()} vs ${fromModified.toISOString()}`)
            }
            //else if  (toModified < episodeModified )
            //    console.log(`WARNING: ${icPath} is older than ${episodeModified}`)
        }
        else {
            // Create IC transcript
            console.log(`Writing ${toPath}`);
            transcript = await AwsFileToIcFile(fromPath, episodePath, toPath, config);
            toModified = new Date();
        }
        fromPath = toPath;
        fromModified = toModified;

        toPath = path.join(config['transcript-folder'], setExtension(file, 'lines.json'));
        toModified = await getFileModified(toPath);
        if (fromModified > toModified) {
            if (!transcript) {
                transcript = await fileToObject(fromPath) as TranscriptSchema;
            }
            let icTextLines: Array<TranscriptTextLine> | Error;
            icTextLines = await icTranscriptToTextLines(transcript);
            console.log(`Writing ${toPath}`);
            await fs.writeFile(toPath, JSON.stringify(icTextLines, null, '\t'));
        }

        toPath = path.join(config['transcript-folder'], setExtension(file, 'vtt'));
        toModified = await getFileModified(toPath);
        if (fromModified > toModified) {
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
