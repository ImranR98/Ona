const tmp = require('tmp') // For temp. directories when generating thumbnails
const exiftool = new (require('exiftool-vendored').ExifTool)({ maxProcs: 16 })
const sharp = require('sharp') // For generating thumbnails
const ffmpeg = require('ffmpeg') // For generating vieo thumbnails 
const mongodb = require('mongodb') // For interacting with the database
const fs = require('fs')

module.exports.sleep = (s) => new Promise((resolve) => { setTimeout(resolve, s * 1000) }) // Pause the process for a specified number of seconds
module.exports.tempDir = () => tmp.dirSync().name // Create a temparary directory and return it's path - MAKE SURE it is empty before the process exists
module.exports.resizeImage = async (path, destDir, destName, width, height) => await sharp(path).resize(width, height).toFile(`${destDir}/${destName}`) // Resize an image and save at a new path
module.exports.getVideoFrame = async (path, destDir, destName) => (await new ffmpeg(path)).fnExtractFrameToJPG(destDir, { file_name: destName, number: 1 }) // Extract the first frame froma video and save it
module.exports.exiftoolRead = async (dir, files) => {
    let promises = []
    files.forEach(file => {
        promises.push(exiftool.read(`${dir}/${file}`))
    })
    return Promise.all(promises)
}
module.exports.insertArrayIntoMongo = async (url, db, collection, array) => { // Insert an array of objects into a MongoDB database collection
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = await conn.db(db).collection(collection).insertMany(array)
    await conn.close()
    return result
}
module.exports.getIdsFromMongo = async (url, db, collection) => { // Get an array of ids for all objects in a MongoDB database collection
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = (await conn.db(db).collection(collection).find({}, { projection: { _id: 1 } }).toArray()).map(el => el._id);
    await conn.close()
    return result
}
module.exports.removeByTagArrayFromMongo = async (url, db, collection, tag, tagArray) => { // Remove objects using an array of their specific tags from a MongoDB database collection
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let opts = {}
    opts[tag] = {
        $in: tagArray
    }
    let result = (await conn.db(db).collection(collection).deleteMany(opts)).result
    await conn.close()
    return result
}
module.exports.getDataFromMongo = async (url, db, collection, tags) => { // Get an array of all objects in a MongoDB database collection, returning only specified tags (if specified, else all tags returned)
    let projection = {}
    if (tags) tags.forEach(tag => projection[tag] = 1)
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = null
    if (projection != {}) result = (await conn.db(db).collection(collection).find({}, { projection: projection }).toArray())
    else result = (await conn.db(db).collection(collection).find({}).toArray())
    await conn.close()
    return result
}
module.exports.getSingleItemByIdFromMongo = async (url, db, collection, id) => { // Get an item with a specific id in a MongoDB database collection
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = null
    result = (await conn.db(db).collection(collection).find({ _id: id }).toArray())
    await conn.close()
    return result.length > 0 ? result[0] : null
}
module.exports.getBase64Thumbnail = async (pathToFile, fileName, width, height, video = false) => { // Generate a thumbnail for an image/video and return it in a base64 encoded string
    let result = null
    let tempDir = tmp.dirSync().name
    if (video) {
        await this.getVideoFrame(pathToFile, tempDir, `${fileName}.tmp`)
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
module.exports.removeCollectionFromMongo = async (url, db, collection) => { // Remove a collection from a MongoDB database
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = null
    result = await conn.db(db).dropCollection(collection)
    await conn.close()
    return result
}