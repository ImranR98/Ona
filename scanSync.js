// scanSync.js
// Continuously scan a directory for photos and videos and sync data about those files with the database (logs are saved)
// This process accepts a directory path and a collection name as command line arguments
// MAKE SURE not to start two scanners for the same collection but different directories

// Required modules
const fs = require('fs') // For interacting with the file system
const functions = require('./functions') // Import the functions file
const variables = require('./variables') // Import the variables file
const chokidar = require('chokidar')

// Takes a directory path and an array of file names of files in that dir, and returns an array of objects of the form
// { file: file name, hash: file MD5 hash }
const calculateHashes = async (dir, files) => {
    let hashes = []
    hashes = await functions.calculateFileArrayMD5(dir, JSON.parse(JSON.stringify(files)))
    if (files.length != hashes.length) {
        throw 'Error hashing files.'
    }
    files = files.map((file, index) => {
        return {
            file: file,
            hash: hashes[index]
        }
    })
    return files
}

// Takes an array of objects of the form { file: file name, hash: file MD5 hash } describing files in directory dir
// Gets exiftool metadata for the files, validates them for Ona, sets any ignored flags, filters duplicates, and generates thumbnails
// Returns an array of objects ready to add to the database
// base64ErrorThumbnail is a base64 encoded image to be used if a thumbnail can't be generated
const prepareFiles = async (dir, files) => {
    // Get the metadata for every file to add
    let finalFiles = await functions.exiftoolRead(dir, files.map(file => file.file))
    if (files.length != finalFiles.length) {
        throw 'Error getting metadata.'
    }
    // Add the hashes from the original array
    finalFiles = finalFiles.map((fileToAdd, index) => {
        fileToAdd._id = files[index].hash
        return fileToAdd
    })
    // Remove empty entries
    finalFiles = finalFiles.filter(file => !(!file || file == {}))
    // Set the ignore flag on invalid files
    finalFiles = finalFiles.map(file => {
        file.ignored = false
        file.ignoredReason = ''
        // Ignore if no MIMEType or if the MIMEType is invalid
        if (!file.MIMEType) {
            file.ignored = true
            file.ignoredReason += 'No MIMEType '
        } else if (!(file.MIMEType.startsWith('image/') || file.MIMEType.startsWith('video/'))) {
            file.ignored = true
            file.ignoredReason += 'Not an image or video '
        }
        // Make sure the DateTimeOriginal (or CreateDate or MediaCreateDate as fallback options) have the rawValue attribute
        if (file.DateTimeOriginal) if (!file.DateTimeOriginal.rawValue) delete file.DateTimeOriginal
        if (file.CreateDate) if (!file.CreateDate.rawValue) delete file.CreateDate
        if (file.MediaCreateDate) if (!file.MediaCreateDate.rawValue) delete file.MediaCreateDate
        // Ignore if no usable Date (if there is one, copy it to DateTimeOriginal (if needed) and set DateUsed)
        if (!file.DateTimeOriginal) {
            if (file.CreateDate) {
                file.DateTimeOriginal = file.CreateDate
                file.DateUsed = 'CreateDate'
            }
            else if (file.MediaCreateDate) {
                file.DateTimeOriginal = file.MediaCreateDate
                file.DateUsed = 'MediaCreateDate'
            } else {
                file.ignored = true
                file.ignoredReason += 'No DateTimeOriginal or CreateDate or MediaCreateDate '
            }
        } else {
            file.DateUsed = 'DateTimeOriginal'
        }
        return file
    })
    // Generate thumbnails
    for (let i = 0; i < finalFiles.length; i++) {
        try {
            finalFiles[i].thumbnail = await functions.getBase64Thumbnail(finalFiles[i].SourceFile, finalFiles[i].FileName, 200, 200, finalFiles[i].MIMEType.startsWith('video'))
            finalFiles[i].validThumbnail = true
        } catch (err) {
            finalFiles[i].thumbnail = variables.constants.base64ErrorThumbnail
            finalFiles[i].validThumbnail = false
        }
    }
    // Filter out duplicate file ids...
    let ids = Array.from(new Set(finalFiles.map(file => file._id)))
    finalFiles = ids.map(id => {
        let items = finalFiles.filter(file => file._id == id)
        if (items.length > 0) return items[0]
        else return null
    }).filter(file => !!file)

    return finalFiles
}

// Handle scanning a directory once and adding/removing files from the DB as needed
// base64ErrorThumbnail is a base64 encoded image to be used if a thumbnail can't be generated
const initialScan = async (collection, dir) => {
    functions.log(`Hashing files in ${dir}...`, collection)
    let files = await calculateHashes(dir, fs.readdirSync(dir).filter(file => !fs.statSync(`${dir}/${file}`).isDirectory()))
    files = files.filter(file => {
        if (!file.hash) {
            functions.log(`A hash for ${file} could not be calculated and it will be skipped.`, collection)
            return false
        }
        return true
    })
    functions.log(`Found and hashed ${files.length} files.`, collection)
    let idsInDB = await functions.getIdsFromMongo(variables.constants.url, variables.constants.db, collection)
    let filesToAddHashes = files.filter(file => idsInDB.indexOf(file.hash) < 0)
    let idsToRemove = idsInDB.filter(idInDB => !(files.find(file => file.hash == idInDB)))
    functions.log(`${filesToAddHashes.length > 0 ? `Preparing ${filesToAddHashes.length} files...` : 'No new files to add.'}`, collection)
    let filesToAdd = await prepareFiles(dir, filesToAddHashes)
    if (filesToAdd.length > 0) {
        await functions.insertArrayIntoMongo(variables.constants.url, variables.constants.db, collection, filesToAdd)
        functions.log(`Added ${filesToAdd.length} files.`, collection)
    }
    if (idsToRemove.length > 0) {
        await functions.removeByTagArrayFromMongo(variables.constants.url, variables.constants.db, collection, '_id', idsToRemove)
        functions.log(`Removed ${idsToRemove.length} files.`, collection)
    }
}

// Handle adding/removing files from the DB based on events from a chokidar file system watcher
const handleChokidarEvent = async (collection, event, path, dir) => {
    if (event == 'add' || event == 'change') {
        if (fs.existsSync(path)) {
            if (!fs.statSync(path).isDirectory()) {
                let files = await calculateHashes(dir, [path.split('/').pop()])
                if (!files[0].hash) functions.log(`A hash for ${files[0].file} could not be calculated and it will be skipped.`, collection)
                let filesToAdd = await prepareFiles(dir, files)
                if (await functions.getSingleItemByIdFromMongo(variables.constants.url, variables.constants.db, collection, filesToAdd[0]._id)) {
                    await functions.removeByTagArrayFromMongo(variables.constants.url, variables.constants.db, collection, '_id', [filesToAdd[0]._id])
                }
                await functions.insertArrayIntoMongo(variables.constants.url, variables.constants.db, collection, filesToAdd)
                functions.log(`Added or updated a file - ${filesToAdd[0].FileName}.`, collection)
            }
        }
    }
    if (event == 'unlink') {
        await functions.removeByTagArrayFromMongo(variables.constants.url, variables.constants.db, collection, 'SourceFile', [path.split('/').pop()])
        functions.log(`Removed a file - ${path.split('/').pop()}.`, collection)
    }
}

// Main function
const runScanSync = async () => {
    functions.log(`Scanner started on PID ${process.pid}.`, process.argv[2])

    // Ensure both arguments were given
    const collection = process.argv[2]
    const dir = process.argv[3]
    if (!collection) throw 'No collection argument.'
    if (!dir) throw 'No dir argument.'

    // Initial scan
    process.send('scanning')
    await initialScan(collection, dir)
    functions.log(`Initial scan ended.`, collection)

    // Watch for changes
    chokidar.watch(dir, { ignoreInitial: true, ignored: `${dir}/*/*` }).on('all', (event, path) => {
        handleChokidarEvent(collection, event, path, dir).catch(err => {
            functions.log(err, collection)
            process.exit(-2)
        })
    })
    functions.log(`Continuing to watch for changes...`, collection)

    process.send('ready')
}

// Start
runScanSync().catch(err => {
    functions.log(err)
    process.exit(-1)
})