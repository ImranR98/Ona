// scanSync.js
// Continuously scan a directory for photos and videos and sync data about those files with the database (logs are saved)
// This process accepts a directory path and a collection name as command line arguments
// MAKE SURE not to start two scanners for the same collection but different directories

// Required modules
const fs = require('fs') // For interacting with the file system
const functions = require('./functions') // Import the functions file
const variables = require('./variables') // Import the variables file
const md5File = require('md5-file') // To calculate file hashes

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
    process.send('scanning')
    // Ensure the argument is a valid directory, then get all file names in it
    let files = []
    try {
        files = fs.readdirSync(dir).filter(file => !fs.statSync(`${dir}/${file}`).isDirectory())
    } catch (err) {
        log(err, collection)
        process.exit(-3)
    }
    process.send('hashing-files')
    // Calculate hashes for all the files in the current directory
    if (filesToAdd.length > 0) log(`Calculating hashes for ${files.length} files...`, collection)
    try {
        files = files.map(file => {
            return {
                file: file,
                hash: md5File.sync(`${dir}/${file}`)
            }
        })
    } catch (err) {
        log(err, collection)
        process.exit(-10)
    }
    process.send('calculating-files')
    // Get any ids for files already in the collection
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
            if (file.hash == idsInDB[i]) found = true
        }
        return !found
    })

    let idsToRemove = idsInDB.filter(idInDB => {
        let found = false
        for (let i = 0; i < files.length; i++) {
            if (idInDB == files[i].hash) found = true
        }
        return !found
    })
    process.send('getting-metadata')
    // Get the metadata for every file to add
    if (filesToAdd.length > 0) log(`Getting metadata for ${filesToAdd.length} files...`, collection)
    filesToAdd = await functions.exiftoolRead(dir, filesToAdd.map(file => file.file))
    let originalFilesLength = filesToAdd.length
    process.send('rehashing-files')
    // Recalculate hashes for files to be added // TODO: Redundant - re-use previously calculated hashes
    if (filesToAdd.length > 0) log(`Re-calculating hashes for ${filesToAdd.length} files...`, collection)
    filesToAdd = filesToAdd.map(file => {
        file._id = md5File.sync(file.SourceFile)
        return file
    })
    process.send('processing-files')
    // Filter out invalid files
    filesToAdd = filesToAdd.filter(file => {
        if (!file || file == {}) return false
        if (!file.MIMEType) {
            log('A file has no MIMEType and will be ignored.', collection)
            if (file.FileName) log(file.FileName, collection)
            else {
                log('FileName does not exist. Check full logs for the file object', collection)
                log(file, collection, false)
            }
            return false
        }
        // Make sure the DateTimeOriginal (or CreateDate or MediaCreateDate as fallback options) have the rawValue attribute
        if (file.DateTimeOriginal) if (!file.DateTimeOriginal.rawValue) delete file.DateTimeOriginal
        if (file.CreateDate) if (!file.CreateDate.rawValue) delete file.CreateDate
        if (file.MediaCreateDate) if (!file.MediaCreateDate.rawValue) delete file.MediaCreateDate
        if (!file.DateTimeOriginal && !file.CreateDate && !file.MediaCreateDate) {
            log('File has no DateTimeOriginal or CreateDate or MediaCreateDate and will be ignored.', collection)
            if (file.FileName) log(file.FileName, collection)
            else {
                log('FileName does not exist. Check full logs for the file object', collection)
                log(file, collection, false)
            }
            return false
        }
        return (file.MIMEType.startsWith('image/') || file.MIMEType.startsWith('video/')) && (file.DateTimeOriginal || file.CreateDate || file.MediaCreateDate) // Must be an image/video and have the DateTimeOriginal or CreateDate or MediaCreateDate tags
    })
    // For files that have no DateTimeOriginal (but have CreateDate or MediaCreateDate), CreateDate or MediaCreateDate is saved as DateTimeOriginal
    filesToAdd = filesToAdd.map(file => {
        if (!file.DateTimeOriginal) {
            if (file.CreateDate) file.DateTimeOriginal = file.CreateDate
            else file.DateTimeOriginal = file.MediaCreateDate
        }
        return file
    })
    if (originalFilesLength > filesToAdd.length) log(`${filesToAdd.length == 0 ? 'No new files added. ' : ''}${originalFilesLength - filesToAdd.length} invalid files were ignored.`, collection)
    // Generate thumbnails
    if (filesToAdd.length > 0) {
        log(`Generating thumbnails for ${filesToAdd.length} files...`, collection)
        for (let i = 0; i < filesToAdd.length; i++) {
            try {
                filesToAdd[i].thumbnail = await functions.getBase64Thumbnail(filesToAdd[i].SourceFile, filesToAdd[i].FileName, 200, 200, filesToAdd[i].MIMEType.startsWith('video'))
            } catch (err) {
                filesToAdd[i].thumbnail = variables.constants.bas64ErrorThumbnail
                log('Error generating thumbnail for file.', collection)
                if (filesToAdd[i].FileName) log(filesToAdd[i].FileName, collection)
                else {
                    log('FileName does not exist. Check full logs for the file object', collection)
                    log(filesToAdd[i], collection, false)
                }
                log(err, collection)
            }
        }
    }
    // Filter out duplicate file ids...
    process.send('filtering-duplicates')
    log(`Filtering out duplicate files...`, collection)
    let ids = Array.from(new Set(filesToAdd.map(file => file._id)))
    filesToAdd = ids.map(id => {
        let items = filesToAdd.filter(file => file._id == id)
        if (items.length > 0) return items[0]
        else return null
    }).filter(file => !!file)
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
    process.send('ready')
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
        log(`Will scan again in ${variables.config.scanInterval} seconds...`, collection, false)
        await functions.sleep(variables.config.scanInterval) // Pause between scans
    }
}

process.send('started') // Set status to started

// Start scanning
scanSyncLoop()