// npm i --save-dev @types/minimist
//import minimist from 'minimist'; // See https://github.com/minimistjs/minimist
import fs from 'node:fs/promises';
import path from 'path'; // See https://nodejs.org/api/path.html
import minimist from 'minimist';
import { createPages } from './createpages.mjs';
import { awsToIc } from './awstoic.mjs';
import { createIc } from './createic.mjs';
function usage() {
    console.log("Usage is: cli [command]");
}
async function loadConfig() {
    // parser = argparse.ArgumentParser()
    // parser.add_argument('-f', '--configfile')
    // parser.add_argument('-x', '--ignore')
    // args = parser.parse_args()
    let config;
    const configpath = 'incharge-podcaster.json'; // args.configfile if args.configfile else 
    try {
        config = JSON.parse(await fs.readFile(configpath, 'utf-8'));
    }
    catch {
        console.log(`Failed to open config file: ${configpath}`);
        return undefined;
    }
    // Assign defaults if no folder settings are provided and convert relative to absolute paths
    config['episode-folder'] = path.resolve(config['episode-folder'] || 'episode');
    try {
        await fs.access(config['episode-folder'], fs.constants.R_OK);
    }
    catch {
        console.log(`The episode folder cannot be accessed: ${config['episode-folder']}`);
        return undefined;
    }
    let isNotExist = false;
    config['page-folder'] = path.resolve(config['page-folder'] || 'page');
    try {
        await fs.access(config['page-folder'], fs.constants.W_OK);
    }
    catch {
        isNotExist = true;
    }
    if (isNotExist) {
        try {
            await fs.mkdir(config['page-folder']);
        }
        catch {
            console.log(`The page folder cannot be accessed or created: ${config['page-folder']}`);
            return undefined;
        }
    }
    config['vtt-folder'] = path.resolve(config['vtt-folder'] || 'vtt');
    try {
        await fs.access(config['vtt-folder'], fs.constants.W_OK);
    }
    catch {
        isNotExist = true;
    }
    if (isNotExist) {
        try {
            await fs.mkdir(config['vtt-folder']);
        }
        catch {
            console.log(`The vtt folder cannot be accessed or created: ${config['vtt-folder']}`);
            return undefined;
        }
    }
    return config;
}
async function main() {
    const argv = minimist(process.argv.slice(2));
    if (argv['_'].length == 0) {
        usage();
        return;
    }
    let config = await loadConfig();
    if (!config)
        return;
    switch (argv['_'][0]) {
        case 'createpages':
            createPages(config);
            break;
        case 'createic':
            createIc(config);
            break;
        case 'awstoic':
            awsToIc(argv);
            break;
        default:
            usage();
    }
}
main();
//# sourceMappingURL=cli.mjs.map