// functions.js
// Provides various functions that are used across the program
// Includes functions to interact with MongoDB and exiftool

// Required modules
const tmp = require('tmp') // For temp. directories when generating thumbnails
const ExifTool = require('exiftool-vendored').ExifTool // For interacting with exiftool
const sharp = require('sharp') // For generating thumbnails
const ffmpeg = require('ffmpeg-static') // For generating vieo thumbnails 
const mongodb = require('mongodb') // For interacting with the database
const fork = require('child_process').fork // For running child Node processes
const cpus = require('os').cpus().length // Number of CPU cores available
const fs = require('fs') // For interacting with the file system
const cmd = require('child_process').execSync // For executing OS terminal commands

// Pause the process for a specified number of seconds
module.exports.sleep = (s) => new Promise((resolve) => { setTimeout(resolve, s * 1000) })
// Create a temparary directory and return it's path - MAKE SURE it is empty before the process exists
module.exports.tempDir = () => tmp.dirSync().name
// Resize an image and save at a new path
module.exports.resizeImage = async (path, destDir, destName, width, height) => await sharp(path).resize(width, height).toFile(`${destDir}/${destName}`)
// Extract the first frame froma video and save it
module.exports.getVideoFrame = async (path, destDir, destName) => cmd(`${ffmpeg} -i '${path}' -frames:v 1 '${destDir}/${destName}' -y`, { stdio: 'pipe' }).toString()
// Read a file's metadata with exiftool
module.exports.exiftoolRead = async (dir, files) => {
    let exiftool = new ExifTool({ maxProcs: cpus })
    let promises = []
    files.forEach(file => {
        promises.push(exiftool.read(`${dir}/${file}`))
    })
    let results = await Promise.all(promises)
    exiftool.end()
    return results
}
// Insert an array of objects into a MongoDB database collection
module.exports.insertArrayIntoMongo = async (url, db, collection, array) => {
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = await conn.db(db).collection(collection).insertMany(array)
    await conn.close()
    return result
}
// Insert an array of objects into a MongoDB database collection
module.exports.updateItemAttributeById = async (url, db, collection, id, attribute, value) => {
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let setObj = {}
    setObj[attribute] = value
    let result = await conn.db(db).collection(collection).updateOne({ _id: id }, { $set: setObj })
    await conn.close()
    return result
}
// Get an array of ids for all objects in a MongoDB database collection
module.exports.getIdsFromMongo = async (url, db, collection) => {
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = (await conn.db(db).collection(collection).find({}, { projection: { _id: 1 } }).toArray()).map(el => el._id)
    await conn.close()
    return result
}
// Get an array of items by their ids in a MongoDB database collection
module.exports.getItemsByIdFromMongo = async (url, db, collection, ids) => {
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = (await conn.db(db).collection(collection).find({ _id: { $in: ids } }).toArray())
    await conn.close()
    return result
}
// Get an array of all objects in a MongoDB database collection, returning only specified tags (if specified, else all tags returned)
module.exports.getDataFromMongo = async (url, db, collection, tags) => {
    let projection = {}
    if (tags) tags.forEach(tag => projection[tag] = 1)
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = null
    if (projection != {}) result = (await conn.db(db).collection(collection).find({}, { projection: projection }).toArray())
    else result = (await conn.db(db).collection(collection).find({}).toArray())
    await conn.close()
    return result
}
// Get an item with a specific id in a MongoDB database collection
module.exports.getSingleItemByIdFromMongo = async (url, db, collection, id) => {
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = null
    result = (await conn.db(db).collection(collection).find({ _id: id }).toArray())
    await conn.close()
    return result.length > 0 ? result[0] : null
}
// Remove objects using an array of their specific tags from a MongoDB database collection
module.exports.removeByTagArrayFromMongo = async (url, db, collection, tag, tagArray) => {
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let opts = {}
    opts[tag] = {
        $in: tagArray
    }
    let result = (await conn.db(db).collection(collection).deleteMany(opts)).result
    await conn.close()
    return result
}
// Remove a collection from a MongoDB database
module.exports.removeCollectionFromMongo = async (url, db, collection) => {
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = null
    result = await conn.db(db).dropCollection(collection)
    await conn.close()
    return result
}
// Delete a MongoDB database and everything in it
module.exports.dropDB = async (url, db) => {
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = null
    result = await conn.db(db).dropDatabase()
    await conn.close()
    return result
}
// Generate a thumbnail for an image/video and return it in a base64 encoded string
module.exports.getBase64Thumbnail = async (pathToFile, fileName, width, height, video = false) => {
    let result = null
    let tempDir = tmp.dirSync().name
    if (video) {
        await this.getVideoFrame(pathToFile, tempDir, `${fileName}_1.jpg`)
        await this.resizeImage(`${tempDir}/${fileName}_1.jpg`, tempDir, `${fileName}.jpg`, width, height)
        result = new Buffer.from(fs.readFileSync(`${tempDir}/${fileName}.jpg`)).toString('base64')
        fs.unlinkSync(`${tempDir}/${fileName}_1.jpg`)
        fs.unlinkSync(`${tempDir}/${fileName}.jpg`)
    } else {
        await this.resizeImage(pathToFile, tempDir, fileName, width, height)
        result = new Buffer.from(fs.readFileSync(`${tempDir}/${fileName}`)).toString('base64')
        fs.unlinkSync(`${tempDir}/${fileName}`)
    }
    return result
}

// Takes a directory name and an array of strings of file names for files in that directory
// Returns an array of MD5 hashes for the files
// Uses multi-threading for efficiency
// Returns null for all cases where MD5 could not be calculated
// Uses md5-array.js for the actual calculations
module.exports.calculateFileArrayMD5 = async (dir, files) => {
    // Split the array into chunks based on the number of CPUs
    let chunkLength = Math.ceil(files.length / cpus)
    let fileGroups = []
    while (files.length) {
        fileGroups.push(files.splice(0, chunkLength))
    }

    // Start a new md5-file-array.js process for each chunk
    const promises = []
    fileGroups.forEach(fileGroup => {
        if (fileGroup.length > 0) {
            promises.push(new Promise((resolve, reject) => {
                fork('./md5-file-array.js', [dir, JSON.stringify(fileGroup)], { stdio: 'inherit' }).on('message', ({ md5Array, pid }) => {
                    resolve(md5Array)
                }).on('exit', code => {
                    if (code != 0) reject()
                })
            }))
        }
    })

    // Wait for all chunks to be processes
    let md5Arrays = await Promise.all(promises)

    // Concatenate all the MD5 results into one array
    let finalArray = []
    md5Arrays.forEach(md5Array => {
        finalArray = finalArray.concat(md5Array)
    })

    return finalArray
}