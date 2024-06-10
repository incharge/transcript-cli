import fs from 'node:fs/promises';
import path from 'path'; // See https://nodejs.org/api/path.html
import { exec } from 'child_process';
import { config } from './types.mjs';
import { setExtension, getFileModified } from './utils.mjs';
import YAML from 'yaml';

export interface episodeOut {
    episodeid: string;
    id?: string;
}

export async function gitMvYamlJson(config: config) {
    try {
        console.log('Renaming yaml as json');
        const files = await fs.readdir(config['episode-folder']);
        let isError = false;
        for (const file of files) {
            console.log(`Processing episode folder: ${file}`);
            const yamlPath = path.join(config['episode-folder'], file, 'episode.yaml');
            const yamlModified = await getFileModified(yamlPath);
            const jsonPath = setExtension(yamlPath, "json");
            const jsonModified = await getFileModified(jsonPath);
            if (jsonModified.valueOf() && yamlModified.valueOf()) {
                console.error(`Both ${yamlPath} and ${jsonPath} exist`)
            }
            else if (yamlModified.valueOf()) {
                exec(`mv ${yamlPath} ${jsonPath}`, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`exec error: ${error}`);
                        isError = true;
                        return;
                    }
                    if (stdout) {
                        console.log(`stdout: ${stdout}`);
                    }

                    if (stderr) {
                        console.error(`stderr: ${stderr}`);
                        isError = true;
                    }
                });
            }
            if (isError)
                break;
        }
    } catch (err) {
        console.error(err);
    } 
}

export async function idToEpisodeId(config: config) {
    try {
        console.log('Converting yaml to json');
        const files = await fs.readdir(config['episode-folder']);
        //let isError = false;
        for (const file of files) {
            console.log(`Processing episode folder: ${file}`);
            const jsonPath = path.join(config['episode-folder'], file, 'episode.json');
            const modified = await getFileModified(jsonPath);
            if (modified.valueOf()) {
                console.log(`loading yaml ${jsonPath}`);
                let episode: episodeOut = YAML.parse(await fs.readFile(jsonPath, 'utf-8'));
                if (episode.id) {
                    episode.episodeid = episode.id;
                    delete episode.id;
                    console.log(`rewriting as json ${jsonPath}`);
                    await fs.writeFile(jsonPath, JSON.stringify(episode, null, '\t'));
                }
                else {
                    console.log('No id property: ${jsonPath}');
                }
            }
            else {
                console.log('Not found: ${jsonPath}');
            }
        }
    } catch (err) {
        console.error(err);
    } 
}
