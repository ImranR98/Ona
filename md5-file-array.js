// md5-file-array.js
// Takes a directory name and an (stringified) array of strings of file names for files in that directory as arguments
// Returns an array of MD5 hashes for the files
// Returns null for all cases where MD5 could not be calculated
// Used by calculateFileArrayMD5 in functions.js

const md5 = require('md5-file') // For calculating MD5 hashes for files

try {
    let files = JSON.parse(process.argv[3])
    let final = []
    files.forEach(file => {
        try {
            final.push(md5.sync(`${process.argv[2]}/${file}`))
        } catch (err) {
            console.log(err)
            final.push(null)
        }
    })
    process.send({ md5Array: final, pid: process.pid })
    process.exit(0)
} catch (err) {
    console.log(err)
    process.exit(-1)
}