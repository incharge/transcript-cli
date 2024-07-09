import fs from 'node:fs/promises';
import path from 'path'; // See https://nodejs.org/api/path.html
import { awsToIcLines, icTranscriptToTextLines, icToVtt } from "@incharge/transcript-core";
import { isFile, setExtension } from './utils.mjs';
async function fileToObject(transcriptPath) {
    return JSON.parse(await fs.readFile(transcriptPath, 'utf-8'));
}
async function AwsFileToIcFile(inFile, episodeFile, outFile, config) {
    // Create the transcript object
    const icTranscript = {
        url: "",
        speakers: [],
        lines: [],
    };
    let awsTranscript;
    let episode;
    // Load the aws transcript file
    let textTranscript;
    try {
        textTranscript = await fs.readFile(inFile, 'utf-8');
    }
    catch (e) {
        throw new Error(`Failed to read transcript ${inFile}: ${e.message}`);
    }
    // Parse the transcript json
    try {
        awsTranscript = JSON.parse(textTranscript);
    }
    catch (e) {
        throw new Error(`Failed to parse json input file '${inFile}' - ${e.message}`);
    }
    // Load additional data from the episode file
    let textEpisode;
    try {
        textEpisode = await fs.readFile(episodeFile, 'utf-8');
    }
    catch (e) {
        throw new Error(`Failed to read ${episodeFile}: ${e.message}`);
    }
    // Parse the episode json
    try {
        episode = JSON.parse(textEpisode);
    }
    catch (e) {
        throw new Error(`Failed to parse episode file '${episodeFile}' - ${e.message}`);
    }
    if (!episode || !awsTranscript) {
        throw new Error(`Failed to load episode file '${episodeFile}'`);
    }
    icTranscript.url = episode.spotifyAudioUrl;
    icTranscript.speakers.push(config.defaults.interviewer[0]);
    icTranscript.speakers.push(...episode.interviewee);
    let result = await awsToIcLines(awsTranscript);
    if (result instanceof Error) {
        throw new Error(`Invalid json input file '${inFile}': ${result.message}`);
    }
    icTranscript.lines = result;
    await fs.writeFile(outFile, JSON.stringify(icTranscript, null, '\t'));
    return icTranscript;
}
async function writeIc(file, config) {
    let fromPath = path.join(config['episode-folder'], file, 'transcript.json');
    let fromExists = await isFile(fromPath);
    const episodePath = path.join(config['episode-folder'], file, 'episode.json');
    const episodeExists = await isFile(episodePath);
    let isForce = false; // Force derrived files to be recreated, even if they already exist
    if (episodeExists && fromExists) {
        let transcript;
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
                transcript = await fileToObject(fromPath);
            }
            let icTextLines;
            icTextLines = await icTranscriptToTextLines(transcript);
            console.log(`Writing ${toPath}`);
            await fs.writeFile(toPath, JSON.stringify(icTextLines, null, '\t'));
        }
        toPath = path.join(config['transcript-folder'], setExtension(file, 'vtt'));
        if (isForce || !await isFile(toPath)) {
            if (!transcript) {
                transcript = await fileToObject(fromPath);
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
export async function createIc(config) {
    console.log(`Generating transcripts from ${config['episode-folder']} to ${config['transcript-folder']}`);
    try {
        const files = await fs.readdir(config['episode-folder']);
        for (const file of files) {
            try {
                writeIc(file, config);
            }
            catch (err) {
                console.error(err.message);
            }
        }
    }
    catch (err) {
        console.error(err);
    }
}
//# sourceMappingURL=createic.mjs.map