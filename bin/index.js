// npm i --save-dev @types/minimist
import minimist from 'minimist';
import fs from 'node:fs/promises';
//import fs from 'fs';
import { awsToIcLines } from "@incharge/transcript-core";
// : Error | undefined
async function AwsFileToIcFile(inFile, outFile) {
    //let error: Error | undefined;
    // Create the transcript object
    const icTranscript = {
        url: "",
        speakers: [],
        lines: [],
    };
    // Load the input file
    let awsTranscript;
    try {
        let textTranscript;
        let error;
        try {
            textTranscript = await fs.readFile(inFile, { encoding: 'utf8' });
        }
        catch (e) {
            error = new Error(`Failed to read ${inFile}: ${e.message}`);
        }
        //console.log(s);
        //const s = fs.readFile(inFile,{ encoding: 'utf8' } )
        //const s = fs.readFile(inFile, (err, data) => { } )
        //const s: string = fs.readFile(inFile, "utf-8" )
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
    }
    catch (e) {
        switch (e.name) {
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
    let result = await awsToIcLines(awsTranscript);
    if (result instanceof Error) {
        result.message = `Invalid json input file '${inFile}': ${result.message}`;
        return result;
    }
    else {
        icTranscript.lines = result;
        await fs.writeFile(outFile, JSON.stringify(icTranscript, null, '\t'));
        //await fs.writeFile(outFile, JSON.stringify(icTranscript, null, '\t'));
    }
}
// await function AwsFileToIcFile(inFile: string, outFile: string): Error | undefined {
// fs.writeFile(outFile, JSON.stringify(icTranscript, null, '\t'), (err: any) => {
//         if (err) {
//     console.error(err);
//     } else {
//     // file written successfully
//     }
// });
//let inputfile: string;
//inputfile = "./test/non-existant.json";
//inputfile = "./test/test-not-json.txt";
//inputfile = "./test/empty.json";
//inputfile = "./test/missing-items.json";
//inputfile = "./test/empty-items.json"
// inputfile = "./test/missing-speaker.json";
//inputfile = "./test/missing-alternatives.json";
//inputfile = "./test/missing-item-type-property.json";
// inputfile = "./test/missing-end_time.json";
//inputfile = "./test/missing-content.json";
// inputfile = "./test/punctuation-consecutively.json";
// inputfile = "./test/punctuation-at-start.json";
// Recoverable warnings
// inputfile = "./test/missing-confidence-property.json"; //- Warning but not an error
//inputfile = "./test/924-aws-pretty.json";
// inputfile = "./test/aws-item-1-OK.json";
async function awsToIc() {
    // Before
    const argv = minimist(process.argv.slice(2));
    let filenames = argv["_"];
    if (filenames.length < 2) {
        console.error(`input and output file name parameters are required`);
        return;
    }
    // During
    let error = await AwsFileToIcFile(filenames[0], filenames[1]);
    // After
    if (error) {
        console.error(`Error: ${error.message}`);
    }
}
awsToIc();
// function replacer(match, p1, p2, p3, offset, string) {
//     // p1 is non-digits, p2 digits, and p3 non-alphanumerics
//     return [p1, p2, p3].join(" - ");
//   }
// const result = "Hello {ha} and welcome".replace(/{\s*(\w+?)\s*}/g, replacer);
// console.log(result);
// function replaceMe(template, data) {
//     const pattern = /{\s*(\w+?)\s*}/g; // {property}
//     return template.replace(pattern, (_, token) => data[token] || '');
// }
// interface TranscriptTextLine {
//     start_time: string | undefined;
//     speaker: string;
//     line: string;
// }
// Given an ic transcript, return an aray of TranscriptTextLine
// function icToTextLines(transcript: TranscriptSchema) {
//     const textLines: Array<TranscriptTextLine> = [];
//     const icLines = transcript.lines;
//     for (let icLineNo = 0; icLineNo < icLines.length; icLineNo++) {
//         const icLine = icLines[icLineNo];
//         const icWords = icLine.words;
//         let textWords: string = "";
//         for (let icWordNo = 0; icWordNo < icWords.length; icWordNo++) {
//             const icWord: TranscriptWord = icWords[icWordNo];
//             textWords += (icWordNo > 0 && icWord.start_time ? " " : '') + icWord.content;
//         };
//         textLines.push({
//             start_time: secondsToHms(icWords[0].start_time),
//             speaker: transcript.speakers[icLine.speaker],
//             line: textWords
//         });
//     }
//     return textLines;
// }
// export async function icFIleToTextLines() {
//     //const inFile = "public/transcript/test.json";
//     const inFile = "test/924-ic-pretty.json";
//     return icToTextLines(JSON.parse(await fs.readFile(inFile, 'utf-8')));
// }
//console.log(icFIleToTextLines());
export function poc() {
    return "It works!";
}
//# sourceMappingURL=index.js.map