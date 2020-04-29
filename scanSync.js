// scanSync.js
// Continuously scan a directory for photos and videos and sync data about those files with the database (logs are saved)
// This process accepts a directory path and a collection name as command line arguments
// MAKE SURE not to start two scanners for the same collection but different directories

// Required modules
const fs = require('fs') // For interacting with the file system
const functions = require('./functions') // Import the functions file
const variables = require('./variables') // Import the variables file

// Check if the log directory exists
let logDirExists = false
if (variables.config.logDir) {
    if (fs.existsSync(variables.config.logDir)) {
        if (fs.statSync(variables.config.logDir).isDirectory()) {
            logDirExists = true
        }
    }
}

// Write to log file if possible, optionally, write to console
const log = (object, collection, consoleToo = true) => {
    try {
        if (typeof object != 'string') object = '\n' + JSON.stringify(object, null, '\t')
        object = `${new Date().toString()}: ${collection}: ${object}`
        if (consoleToo || variables.config.consoleLogEverything) console.log(object)
        const logFilePath = `${variables.config.logDir}/scanner-${collection}.txt`
        try {
            if (logDirExists) fs.appendFileSync(logFilePath, object + '\n')
        } catch (err) {
            console.log(err)
        }
    } catch (err) {
        console.log(err)
    }
}

// Runs a single scan
const scanSync = async (collection, dir) => {
    // Ensure the argument is a valid directory, then get all file names in it
    let files = []
    try {
        files = fs.readdirSync(dir).filter(file => !fs.statSync(`${dir}/${file}`).isDirectory())
    } catch (err) {
        log(err, collection)
        process.exit(-3)
    }
    // Get any ids (file names) for files already in the collection
    let idsInDB = []
    try {
        idsInDB = await functions.getIdsFromMongo(variables.constants.url, variables.constants.db, collection)
    } catch (err) {
        log(err, collection)
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
    if (filesToAdd.length > 0) log(`Getting metadata for ${filesToAdd.length} files...`, collection)
    filesToAdd = await functions.exiftoolRead(dir, filesToAdd)
    let originalFilesLength = filesToAdd.length
    filesToAdd.map(file => file._id = file.FileName)
    // Filter out invalid files
    filesToAdd = filesToAdd.filter(file => {
        if (!file || file == {}) return false
        if (!file.MIMEType) {
            log('File has no MIMEType and will be ignored.', collection, false)
            log(file, collection, false)
            return false
        }
        // Make sure the DateTimeOriginal (or CreateDate or MediaCreateDate as fallback options) have the rawValue attribute
        if (file.DateTimeOriginal) if (!file.DateTimeOriginal.rawValue) delete file.DateTimeOriginal
        if (file.CreateDate) if (!file.CreateDate.rawValue) delete file.CreateDate
        if (file.MediaCreateDate) if (!file.MediaCreateDate.rawValue) delete file.MediaCreateDate
        if (!file.DateTimeOriginal && !file.CreateDate && !file.MediaCreateDate) {
            log('File has no DateTimeOriginal or CreateDate or MediaCreateDate and will be ignored.', collection, false)
            log(file, collection, false)
            return false
        }
        return (file.MIMEType.startsWith('image/') || file.MIMEType.startsWith('video/')) && (file.DateTimeOriginal || file.CreateDate || file.MediaCreateDate) // Must be an image/video and have the DateTimeOriginal or CreateDate or MediaCreateDate tags
    })
    // For files that have no DateTimeOriginal (but have CreateDate or MediaCreateDate), CreateDate or MediaCreateDate is saved as DateTimeOriginal
    filesToAdd = filesToAdd.map(file => {
        if (!file.DateTimeOriginal) {
            if (file.CreateDate) file.DateTimeOriginal = file.CreateDate
            else file.DateTimeOriginal = file.MediaCreateDate
            log('File has no DateTimeOriginal so CreateDate or MediaCreateDate will be used.', collection, false)
            log(file, collection, false)
        }
        return file
    })
    if (originalFilesLength > filesToAdd.length) log(`${filesToAdd.length == 0 ? 'No new files added. ' : ''}${originalFilesLength - filesToAdd.length} invalid files were ignored.`, collection)
    // Add and remove based on the results of above
    if (filesToAdd.length > 0) {
        log(`${filesToAdd.length} files to add...`, collection)
        await functions.insertArrayIntoMongo(variables.constants.url, variables.constants.db, collection, filesToAdd)
        log(`Added ${filesToAdd.length} files.`, collection)
    }

    if (idsToRemove.length > 0) {
        log(`${idsToRemove.length} files to remove...`, collection)
        await functions.removeByTagArrayFromMongo(variables.constants.url, variables.constants.db, collection, '_id', idsToRemove)
        log(`Removed ${idsToRemove.length} files.`, collection)
    }

}

// Runs scans on a loop forever (until the process is killed or an error occurs)
const scanSyncLoop = async () => {
    // Ensure both arguments were given
    const collection = process.argv[2]
    const dir = process.argv[3]
    if (!collection) process.exit(-1)
    if (!dir) process.exit(-2)
    log(`Scanner started on PID ${process.pid}`, collection)
    // Run forever
    while (true) {
        try {
            await scanSync(collection, dir)
        } catch (err) {
            log(err, collection)
            process.exit(-9)
        }
        log(`Will pause for ${variables.config.scanInterval} seconds...`, collection, false)
        await functions.sleep(variables.config.scanInterval) // Pause between scans
    }
}

// Start scanning
scanSyncLoop()