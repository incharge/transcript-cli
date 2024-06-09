import fs from 'node:fs/promises';
import { awsToIcLines, type AwsTranscript, type TranscriptSchema } from "@incharge/transcript-core"

// : Error | undefined
async function  AwsFileToIcFile(inFile: string, outFile: string) {
   
    // Create the transcript object
    const icTranscript: TranscriptSchema = {
        url: "",
        speakers: [],
        lines: [],
    };

    let awsTranscript: AwsTranscript | undefined;

    try {
        let textTranscript: string |  undefined;
        let error: Error | undefined;
    
        // Load the input file
        try {
            textTranscript = await fs.readFile(inFile, 'utf-8' );
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

    icTranscript.url = "https://anchor.fm/s/822ba20/podcast/play/73641195/https%3A%2F%2Fd3ctxlq1ktw2nl.cloudfront.net%2Fstaging%2F2023-6-20%2Fad141192-5496-f8de-8e74-498202e89456.m4a";
    icTranscript.speakers = [
            "Ricardo Lopes",
            "Dr. Stephanie Hare"
    ];

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

export async function awsToIc(argv: any) {
    // Before
    let filenames: Array<string> = argv["_"];
    if (filenames.length <3) {
        console.error(`Input and output file name parameters are required` );
        return;
    }

    // During
    let error = await AwsFileToIcFile(filenames[1], filenames[2]);

    // After
    if (error) {
        console.error(`Error: ${error.message}` );
    }
}
