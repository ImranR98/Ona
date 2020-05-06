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
if (process.env.LOGDIR) {
    if (fs.existsSync(process.env.LOGDIR)) {
        if (fs.statSync(process.env.LOGDIR).isDirectory()) {
            logDirExists = true
        }
    }
}

// Write to log file if possible, optionally, write to console
const log = (object, collection, consoleToo = true) => {
    try {
        if (typeof object != 'string') object = '\n' + JSON.stringify(object, null, '\t')
        object = `${new Date().toString()}: ${collection}: ${object}`
        if (consoleToo) console.log(object)
        const logFilePath = `${process.env.LOGDIR}/scanner-${collection}.txt`
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
    if (files.length > 0) log(`Calculating hashes for ${files.length} files...`, collection)
    // Calculate hashes for all the files in the current directory
    let hashes = []
    try {
        hashes = await functions.calculateFileArrayMD5(dir, JSON.parse(JSON.stringify(files)))
    } catch (err) {
        log(err, collection)
        process.exit(-4)
    }
    if (files.length != hashes.length) {
        log('Error hashing files.', collection)
        process.exit(-5)
    }
    files = files.map((file, index) => {
        return {
            file: file,
            hash: hashes[index]
        }
    })
    files = files.filter(file => {
        if (!file.hash) {
            log(`A hash for ${file} could not be calculated and it will be ignored.`, collection)
            return false
        }
        return true
    })
    process.send('calculating-files')
    // Get any ids for files already in the collection
    let idsInDB = []
    try {
        idsInDB = await functions.getIdsFromMongo(variables.constants.url, variables.constants.db, collection)
    } catch (err) {
        log(err, collection)
        process.exit(-6)
    }
    // At this point, you have all ids already in the DB, and all ids for files in the actual dir
    // Figure out what files to add/delete from to/from the DB
    let filesToAddHashes = files.filter(file => {
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
    if (filesToAddHashes.length > 0) log(`Getting metadata for ${filesToAddHashes.length} files...`, collection)
    let filesToAdd = await functions.exiftoolRead(dir, filesToAddHashes.map(file => file.file))
    if (filesToAddHashes.length != filesToAdd.length) {
        log('Error getting metadata.', collection)
        process.exit(-7)
    }
    filesToAdd = filesToAdd.map((fileToAdd, index) => {
        fileToAdd._id = filesToAddHashes[index].hash
        return fileToAdd
    })
    let originalFilesLength = filesToAdd.length
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
            if (file.CreateDate) {
                file.DateTimeOriginal = file.CreateDate
                file.DateUsed = 'CreateDate'
            }
            else {
                file.DateTimeOriginal = file.MediaCreateDate
                file.DateUsed = 'MediaCreateDate'
            }
        } else {
            file.DateUsed = 'DateTimeOriginal'
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
            process.exit(-8)
        }
        log(`Will scan again in ${variables.config.scanInterval} seconds...`, collection, false)
        await functions.sleep(variables.config.scanInterval) // Pause between scans
    }
}

process.send('started') // Set status to started

// Start scanning
scanSyncLoop()