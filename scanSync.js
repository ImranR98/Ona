// scanSync.js
// This process accepts a directory path and a collection name as command line arguments
// It scans the directory for photos and videos, then syncs data about those files with the database (logs are saved)
// MAKE SURE not to start two scanners for the same collection but different directories

// Required modules
const fs = require('fs')
const functions = require('./functions')
const variables = require('./variables')

// Write to log file
const log = (object, collection, consoleToo = false) => {
    try {
        if (consoleToo) console.log(object)
        const logFilePath = `${variables.logDir}/scanner-${collection}.txt`
        fs.appendFileSync(logFilePath, `\n\n${new Date().toString()} - ${process.pid}:\n`)
        fs.appendFileSync(logFilePath, JSON.stringify(object, null, '\t'))
    } catch (err) {
        console.log(err)
    }
}

const scanSync = async (collection, dir) => {
    // Ensure the argument is a valid directory, then get all file names in it
    let files = []
    try {
        files = fs.readdirSync(dir).filter(file => !fs.statSync(`${dir}/${file}`).isDirectory())
    } catch (err) {
        log(err, collection, true)
        process.exit(-3)
    }
    // Get any ids (file names) for files already in the collection
    let idsInDB = []
    try {
        idsInDB = await functions.getIdsFromMongo(variables.url, variables.db, collection)
    } catch (err) {
        log(err, collection, true)
        process.exit(-4)
    }
    // At this point, you have all ids already in the DB, and all ids for files in the actual dir
    // Figure out what files to add/delete from to/from the DB
    let filesToAdd = files.filter(file => {
        let found = false
        for (let i = 0; i < idsInDB.length; i++) {
            if (file == idsInDB[i]) found = true
        }
        return !found
    })

    let idsToRemove = idsInDB.filter(idInDB => {
        let found = false
        for (let i = 0; i < files.length; i++) {
            if (idInDB == files[i]) found = true
        }
        return !found
    })
    // Get the metadata for every file to add
    if (filesToAdd.length > 0) log(`Getting metadata for ${filesToAdd.length}...`, collection)
    filesToAdd = await functions.exiftoolRead(dir, filesToAdd)

    filesToAdd.map(file => file._id = file.FileName)
    // Filter out invalid files
    filesToAdd = filesToAdd.filter(file => {
        if (!file) return false
        return (file.MIMEType.startsWith('image/') || file.MIMEType.startsWith('video/')) && !!file.DateTimeOriginal // Must be an image/video and have the DateTimeOriginal tag
    })

    // Add and remove based on the results of above
    if (filesToAdd.length > 0) {
        log(`${filesToAdd.length} files to add...`, collection)
        await functions.insertArrayIntoMongo(variables.url, variables.db, collection, filesToAdd)
    }

    if (idsToRemove.length > 0) {
        log(`${idsToRemove.length} files to remove...`, collection)
        await functions.removeByTagArrayFromMongo(variables.url, variables.db, collection, '_id', idsToRemove)
    }

}

const scanSyncLoop = async () => {
    // Ensure both arguments were given
    const collection = process.argv[2]
    const dir = process.argv[3]
    if (!collection) process.exit(-1)
    if (!dir) process.exit(-2)
    log(`Scanner for ${collection} started on PID ${process.pid}`, collection, true)
    // Run forever
    while (true) {
        try {
            await scanSync(collection, dir)
        } catch (err) {
            log(err, collection, true)
            process.exit(-9)
        }
        log(`Will pause for ${variables.scanInterval} seconds...`, collection)
        await functions.sleep(variables.scanInterval) // Pause between scans
    }
}

scanSyncLoop()