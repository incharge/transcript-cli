//import fs from 'node:fs/promises';
// console.log( "test stuff here" );
// async function testModified() {
//     async function getFileModified(path: string): Promise<Date | undefined>{
//         try {
//             let stat = await fs.stat(path);
//             if ( stat.isFile() ) {
//                 return stat.mtime;
//             }
//         }
//         catch {
//         }
//         return undefined;
//     }
//     let path = "ha";
//     let modified = await getFileModified(path);
//     if (modified == undefined) {
//         console.log(`Not a file: ${path}`);
//     }
//     else {
//         console.log(`${path} last modified ${modified}`);
//     }
//     path = "package.json";
//     modified = await getFileModified(path);
//     if (modified == undefined) {
//         console.log(`Not a file: ${path}`);
//     }
//     else {
//         console.log(`${path} last modified ${modified}`);
//     }
//     path = "bin";
//     modified = await getFileModified(path);
//     if (modified == undefined) {
//         console.log(`Not a file: ${path}`);
//     }
//     else {
//         console.log(`${path} last modified ${modified}`);
//     }
// }
// testModified()
// async function testMax() {
//     const date1: Date = new Date();
//     const date2: Date = new Date(0);
//     // const date2: Date = new Date(0);
//     // console.log(`The max date is: ${Math.max(date1, date2.getSeconds())}`)
//     console.log(`The max date is: ${date1 > date2 ? date1 : date2}`);
//     console.log(`date2: ${date2 ? "true" : "false"}`);
//     console.log(`date1.valueOf(): ${date1.valueOf() ? "true" : "false"}`);
//     console.log(`date2.valueOf(): ${date2.valueOf() ? "true" : "false"}`);
//     console.log(`date2.valueOf() == 0 is: ${date2.valueOf() == 0 ? "true" : "false"}`);
// }
// testMax();
var copyProperties = ['title', 'episodeid', 'publishDate', 'excerpt', 'youtubeid', 'audiourl', 'image', 'tags', 'itunesEpisodeUrl', 'spotifyEpisodeUrl', 'transcript', 'vtt'];
var dataDict = { episodeid: 'ha' };
var episodeDict = {};
console.log("of:");
for (var _i = 0, copyProperties_1 = copyProperties; _i < copyProperties_1.length; _i++) {
    var x = copyProperties_1[_i];
    console.log(x);
    // episodeDict[x] = dataDict[x];
}
console.log("in:");
for (var x in copyProperties) {
    console.log(x);
    // episodeDict[x] = dataDict[x];
}

// Setup a watch for this
// npx tsc src/harness.ts --outfile bin/harness.js && node bin/harness.js