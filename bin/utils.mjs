import fs from 'node:fs/promises';
import path from 'path'; // See https://nodejs.org/api/path.html
// Get the modified date of the file. Or zero if the file doesn't exist, or is not a file.
export async function getFileModified(pathname) {
    try {
        let stat = await fs.stat(pathname);
        if (stat.isFile()) {
            return stat.mtime;
        }
    }
    catch {
    }
    return new Date(0);
}
// Return true of the file exists
export async function isFile(pathname) {
    const modified = await getFileModified(pathname);
    return modified.valueOf() != 0;
}
// Set the filename extension.
export function setExtension(pathname, extension) {
    return path.format({ ...path.parse(pathname), base: '', ext: extension });
}
//# sourceMappingURL=utils.mjs.map