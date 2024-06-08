import fs from 'node:fs/promises';
import path from 'path'; // See https://nodejs.org/api/path.html
import { icStringToTextLines } from "@incharge/transcript-core";
async function getFileModified(path) {
    try {
        let stat = await fs.stat(path);
        if (stat.isFile()) {
            return stat.mtime;
        }
    }
    catch {
    }
    return new Date(0);
}
// : Array<TranscriptTextLine> | Error
async function icFileToTextLines(inFile) {
    let icTextLines;
    try {
        icTextLines = icStringToTextLines(await fs.readFile(inFile, 'utf-8'));
    }
    catch (e) {
        icTextLines = Error(e.message);
    }
    return icTextLines;
}
async function generatePage(episodePath, config) {
    const dataDict = JSON.parse(await fs.readFile(episodePath, 'utf-8'));
    // Does the page need to be created or updated?
    const pagePath = path.join(config['page-folder'], dataDict['filename'] + '.md');
    const transcriptPath = path.join(config['episode-folder'], dataDict['episodeid'], 'transcript.ic.json');
    //const vttPath = path.join(config['vtt-folder'], dataDict['episodeid'] + '.vtt');
    let writePage;
    const pageModified = await getFileModified(pagePath);
    let transcriptModified = new Date(0);
    if (pageModified.valueOf()) {
        // The page exists. Does it need to be updated?
        // If either the episode data or transcript data has changed?
        transcriptModified = await getFileModified(transcriptPath);
        const episodeModified = await getFileModified(episodePath); // The file must exist because it was just read
        const dataModified = episodeModified > transcriptModified ? episodeModified : transcriptModified;
        if (dataModified > pageModified) {
            writePage = 1; // The episode data has changed, so the page needs to be updated
        }
        else {
            writePage = 0; // The episode data has not changed
        }
    }
    else {
        writePage = -1; // The episode data is new, so the page needs to be created
        //transcriptModified = new Date(0);
    }
    if (writePage) {
        // Write the vtt
        // if (transcriptModified.valueOf()) {
        //     console.log(`Writing captions to ${vttPath}`)
        //     # tscribe.write(transcriptPath, format="vtt", save_as=vttPath)
        //     webvttUtils.writeTranscriptToWebVTT(transcriptPath, 'en', vttPath)
        //     dataDict["vtt"] = dataDict['episodeid'] + '.vtt'
        // }
        if ('published' in dataDict && dataDict.published) {
            // Convert datetime to date
            // dataDict['publishDate'] = datetime.datetime.strptime(dataDict['published'], "%Y-%m-%d")
            dataDict.publishDate = dataDict.published;
        }
        if ("spotifyAudioUrl" in dataDict) {
            dataDict.audiourl = dataDict.spotifyAudioUrl;
        }
        console.log(`${writePage < 0 ? 'Creating' : 'Updating'} ${pagePath}`);
        // Select fields to write to the FrontMatter section, if they exist for this episode
        const copyProperties = [
            'audiourl',
            'draft',
            'episodeid',
            'excerpt',
            'image',
            'itunesEpisodeUrl',
            'publishDate',
            'spotifyEpisodeUrl',
            'tags',
            'title',
            'vtt',
            'youtubeid',
            'transcript',
        ];
        const episodeDict = {};
        for (let key of copyProperties) {
            if (key in dataDict) {
                episodeDict[key] = dataDict[key];
            }
            else
                switch (key) {
                    case 'transcript':
                        if (transcriptModified.valueOf()) {
                            const transcriptLines = await icFileToTextLines(transcriptPath);
                            if (transcriptLines instanceof Error) {
                                console.error(transcriptLines.message);
                            }
                            else {
                                episodeDict.transcript = transcriptLines;
                            }
                        }
                        break;
                    case 'draft':
                        episodeDict.draft = false;
                        break;
                    default:
                        console.log(`Missing property: ${key}`);
                }
        }
        let frontMatter = JSON.stringify(episodeDict, undefined, '\t');
        frontMatter = frontMatter.replace(/^(\t*"publishDate": )"([^"]*)",$/m, "$1$2,");
        // Yes: frontMatter = frontMatter.replace(/("publishDate": )"([^"]*)",/g, "$1$2,");
        //frontMatter.replace(/^(\\t)(\1+"publishDate": )"([^"]*)",$/, "$1$2$3,");
        // '\\t\\t\\t"publishDate": "2024-04-04",'.replace(/^(\\t)(\1+"publishDate": )"([^"]*)",$/, "$1$2$3,,");
        try {
            const pageFile = await fs.open(pagePath, "w");
            await pageFile.write('---\n', undefined, 'utf-8');
            await pageFile.write(frontMatter, undefined, 'utf-8');
            await pageFile.write('\n---\n', undefined, 'utf-8');
            if (dataDict.shownotes && (typeof dataDict.shownotes == "string"))
                await pageFile.write(dataDict.shownotes, undefined, 'utf-8');
            await pageFile.close();
        }
        catch (e) {
            console.log(e);
            return 0;
        }
    }
    return writePage;
}
export async function createPages(config) {
    let createdCount = 0;
    let updatedCount = 0;
    console.log(`Generating pages from ${config['episode-folder']} to ${config['page-folder']}`);
    try {
        const files = await fs.readdir(config['episode-folder']);
        for (const file of files) {
            console.log(`Processing episode folder: ${file}`);
            const episodePath = path.join(config['episode-folder'], file, 'episode.json');
            try {
                const writePage = await generatePage(episodePath, config);
                if (writePage < 0)
                    createdCount += 1;
                else if (writePage > 0)
                    updatedCount += 1;
                // else: Unchanged
            }
            catch {
                console.log(`WARNING: Episode file is missing or unreadable: ${episodePath}`);
            }
        }
    }
    catch (err) {
        console.error(err);
    }
    if (createdCount > 0)
        console.log(`${createdCount} pages created`);
    if (updatedCount > 0)
        console.log(`${updatedCount} pages updated`);
    if (createdCount == 0 && updatedCount == 0)
        console.log('No pages needed to be created or updated');
}
//# sourceMappingURL=createpages.mjs.map