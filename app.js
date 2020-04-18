const express = require('express')
const app = express()
const bodyparser = require('body-parser')
const fs = require('fs')
const functions = require('./functions')
const variables = require('./variables')
const port = process.env.PORT || 8080

app.use(bodyparser.json())

const node = require('child_process').fork

// An array of all scanSync.js processes
let scanners = []

// Write to log file
const log = (object, consoleToo = true) => {
    try {
        if (typeof object != 'string') object = '\n' + JSON.stringify(object, null, '\t')
        object = `${new Date().toString()}: ${object}`
        if (consoleToo) console.log(object)
        const logFilePath = `${variables.logDir}/app.txt`
        fs.appendFileSync(logFilePath, object + '\n')
    } catch (err) {
        console.log(err)
    }
}

// Clean the scanners array to remove any dead scanners
const cleanScanners = () => scanners.filter(scanner => scanner.processObj.exitCode != null)

// Start a scanner
const startScanner = async (collection, dir, newScanner = false) => {
	scanners.push({
		collection,
		dir,
		processObj: node('./scanSync.js', [collection, dir]).on('exit', cleanScanners)
	})
	if (newScanner) await functions.insertArrayIntoMongo(variables.url, variables.configdb, variables.dirsCollection, [{ _id: collection, dir }])
}

// Stop a scanner by its collection
const stopScanner = async (collection) => {
	await functions.removeByTagArrayFromMongo(variables.url, variables.configdb, variables.dirsCollection, '_id', [collection])
	await functions.removeCollectionFromMongo(variables.url, variables.db, collection)
	let target = scanners.find(scanner => scanner.collection == collection)
	if (target) target.processObj.kill()
	log(`Scanner for ${collection} was stopped and deleted.`)
	cleanScanners()
}

// Add a new scanner
app.post('/add', (req, res) => {
	if (req.body.collection && req.body.dir) {
		startScanner(req.body.collection, req.body.dir, true).then(() => {
			res.send()
		}).catch((err) => {
			log(err)
			res.status(500).send()
		})
	} else {
		res.status(500).send()
	}
})

// Remove a new scanner by its collection name
app.post('/remove', (req, res) => {
	if (req.body.collection) {
		stopScanner(req.body.collection).then(() => {
			res.send()
		}).catch((err) => {
			log(err)
			res.status(500).send()
		})
	} else {
		res.status(500).send()
	}
})

// Get the file name and date for all items in a collection if it is being tracked
app.get('/media/list/:collection', (req, res) => {
	if (!scanners.find(scanner => scanner.collection == req.params.collection)) {
		log('Invalid collection.')
		res.status(500).send()
	} else {
		functions.getDataFromMongo(variables.url, variables.db, req.params.collection, ['_id', 'DateTimeOriginal.rawValue']).then(result => {
			res.send(result)
		}).catch(err => {
			log(err)
			res.status(500).send()
		})
	}
})

// Get the all file metadata and thumbnail for a specific item in a collection if it exists
app.get('/media/single/:collection/:item', (req, res) => {
	if (!scanners.find(scanner => scanner.collection == req.params.collection)) {
		log('Invalid collection.')
		res.status(500).send()
	} else {
		functions.getSingleItemByIdFromMongo(variables.url, variables.db, req.params.collection, req.params.item).then(result => {
			if (result) {
				functions.getBase64Thumbnail(result.SourceFile, result.FileName, 200, 200, result.MIMEType.startsWith('video')).then(base64Thumbnail => {
					result.thumbnail = base64Thumbnail
					res.send(result)
				}).catch(err => {
					log(err)
					res.status(500).send()
				})
			} else res.send(result)
		}).catch(err => {
			log(err)
			res.status(500).send()
		})
	}
})

// Get the all file metadata and thumbnails for specific items in a collection if it exists
app.post('/media/many/:collection', (req, res) => {
	if (!scanners.find(scanner => scanner.collection == req.params.collection)) {
		log('Invalid collection.')
		res.status(500).send()
	} else {
		functions.getItemsByIdFromMongo(variables.url, variables.db, req.params.collection, req.body.ids).then(results => {
			if (results) {
				let promises = []
				results.forEach(result => promises.push(functions.getBase64Thumbnail(result.SourceFile, result.FileName, 200, 200, result.MIMEType.startsWith('video'))))
				Promise.all(promises).then((thumbnails) => {
					results = results.map((result, index) => {
						result.thumbnail = thumbnails[index]
						return result
					})
					res.send(results)
				}).catch(err => {
					log(err)
					res.status(500).send()
				})
			} else res.send(results)
		}).catch(err => {
			log(err)
			res.status(500).send()
		})
	}
})

// Get the actual file for a specific item in a collection if it exists
app.get('/media/content/:collection/:item', (req, res) => {
	if (!scanners.find(scanner => scanner.collection == req.params.collection)) {
		log('Invalid collection.')
		res.status(500).send()
	} else {
		functions.getSingleItemByIdFromMongo(variables.url, variables.db, req.params.collection, req.params.item).then(result => {
			if (result) {
				res.sendFile(result.SourceFile)
			} else res.send(result)
		}).catch(err => {
			log(err)
			res.status(500).send()
		})
	}
})

// Get the list of tracked collections
app.get('/dirs', (req, res) => {
	res.send(scanners.map(scanner => { return { collection: scanner.collection, dir: scanner.dir } }))
})


// Load existing directory/collection pairs from the DB, then start the server
functions.getDataFromMongo(variables.url, variables.configdb, variables.dirsCollection).then(results => {
	let promises = []
	results.forEach(({ _id, dir }) => promises.push(startScanner(_id, dir)))
	Promise.all(promises).then(() => {
		app.listen(port, () => {
			log(`Started on port ${port}.`)
		})
	}).catch(err => {
		log(err)
	})
})