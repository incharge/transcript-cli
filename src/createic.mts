import fs from 'node:fs/promises';
import path from 'path'; // See https://nodejs.org/api/path.html
import { awsToIcLines, type AwsTranscript, type TranscriptSchema } from "@incharge/transcript-core"
import { config, episode } from './types.mjs';
//import { awsToIcLines, type AwsTranscript, type TranscriptSchema } from "@incharge/transcript-core"

// : Error | undefined
async function  AwsFileToIcFile(inFile: string, episodeFile: string, outFile: string, config: config) {
   
    // Create the transcript object
    const icTranscript: TranscriptSchema = {
        url: "",
        speakers: [],
        lines: [],
    };
    let awsTranscript: AwsTranscript | undefined;
    let episode: episode | undefined;
    let error: Error | undefined;

    // Load the input transcript file
    try {
        let textTranscript: string |  undefined;
    
        try {
            textTranscript = await fs.readFile(inFile, { encoding: 'utf8' } );
        }
        catch (e: any) {
            error = new Error(`Failed to read ${inFile}: ${e.message}`);
        }

        if (textTranscript) {
            awsTranscript = JSON.parse(textTranscript);
        }
        else {
            return error;
        }
        
        if (!awsTranscript) {
            return new Error(`Failed to load json input file '${inFile}'`);
        }

        // (error, data) => {
        //     if (error) {
        //         console.error(error);
        //     } else {
        //         // file written successfully
        //     }
        // }));
        // 'utf-8', 
        // await

    } catch (e: any) {
        switch(e.name) {
            case "SyntaxError":
                e.message = `Syntax error in json input file '${inFile}' - ${e.message}`;
                break;
            default:
                e.message = `Failed to load json input file '${inFile}' - ${e.message}`;
        }
        return e;
    }

    // Load additional data from the episode file
    try {
        let textEpisode: string |  undefined;
    
        try {
            textEpisode = await fs.readFile(episodeFile, { encoding: 'utf8' } );
        }
        catch (e: any) {
            error = new Error(`Failed to read ${episodeFile}: ${e.message}`);
        }

        if (textEpisode) {
            episode = JSON.parse(textEpisode);
        }
        else {
            return error;
        }
        
        if (!episode) {
            return new Error(`Failed to load json episode file '${episodeFile}'`);
        }

        // (error, data) => {
        //     if (error) {
        //         console.error(error);
        //     } else {
        //         // file written successfully
        //     }
        // }));
        // 'utf-8', 
        // await

    } catch (e: any) {
        switch(e.name) {
            case "SyntaxError":
                e.message = `Syntax error in json episode file '${inFile}' - ${e.message}`;
                break;
            default:
                e.message = `Failed to load json episode file '${inFile}' - ${e.message}`;
        }
        return e;
    }

    icTranscript.url = episode.spotifyAudioUrl;
    icTranscript.speakers.push(config.defaults.interviewer[0]);
    icTranscript.speakers.push(...episode.interviewee);

    let result =  await awsToIcLines(awsTranscript);
    if ( result instanceof Error) {
        result.message = `Invalid json input file '${inFile}': ${result.message}`;
        return result;
    }
    else {
        icTranscript.lines = result;
        await fs.writeFile(outFile, JSON.stringify(icTranscript, null, '\t'));
    }
}

export async function createIc(config: config) {

    let createdCount: number = 0;
    let updatedCount: number = 0;
    console.log(`Generating transcripts from ${config['episode-folder']} to ${config['page-folder']}`);

    try {
        const files = await fs.readdir(config['episode-folder']);
        for (const file of files) {
            console.log(`Processing episode folder: ${file}`);

            const awsPath = path.join(config['episode-folder'], file, 'transcript.json');
            const episodePath = path.join(config['episode-folder'], file, 'episode.json');
            const icPath = path.join(config['episode-folder'], file, 'transcript.ic.json');
            AwsFileToIcFile(awsPath, episodePath, icPath, config);

            // const episodePath = path.join(config['episode-folder'], file, 'episode.json')
            // try {
            //     const writePage = await generatePage(episodePath, config)
            //     if (writePage < 0)
            //         createdCount += 1
            //     else if (writePage > 0)
            //         updatedCount += 1
            //     // else: Unchanged
            // } catch {
            //     console.log(`WARNING: Episode file is missing or unreadable: ${episodePath}`);
            // }
        }
    } catch (err) {
        console.error(err);
    } 

    if (createdCount > 0)
        console.log(`${createdCount} pages created`);
    if (updatedCount > 0)
        console.log(`${updatedCount} pages updated`);
    if (createdCount == 0 && updatedCount == 0)
        console.log('No pages needed to be created or updated' );
}
