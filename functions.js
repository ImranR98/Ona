const tmp = require('tmp') // For temp. directories when generating thumbnails
const exiftool = new (require('exiftool-vendored').ExifTool)({ maxProcs: 16 })
const sharp = require('sharp') // For generating thumbnails
const ffmpeg = require('ffmpeg') // For generating vieo thumbnails 
const mongodb = require('mongodb') // For interacting with the database

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
module.exports.removeByIdArrayFromMongo = async (url, db, collection, idArray) => { // Remove objects using an array of their ids from a MongoDB database collection
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = (await conn.db(db).collection(collection).deleteMany({
        _id: {
            $in: idArray
        }
    })).result
    await conn.close()
    return result
}
module.exports.getDataFromMongo = async (url, db, collection) => { // Get an arry of ids for all objects in a MongoDB database collection
    let conn = await new mongodb.MongoClient(url, { useUnifiedTopology: true }).connect()
    let result = (await conn.db(db).collection(collection).find({}, { projection: { _id: 1 } }).toArray()).map(el => el._id);
    await conn.close()
    return result
}