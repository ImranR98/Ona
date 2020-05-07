// app.js
// Main application process
// Acts as a server and keeps track of scanners
// NOTE: The RSA_PUBLIC_KEY, RSA_PRIVATE_KEY, and EXPIRES_IN environment variables must exist in process.env - a .env file can be used for this

// Required modules
const express = require('express') // For server functions
const app = express() // For server functions
const bodyparser = require('body-parser') // For parsing the payload from POST requests
const fs = require('fs') // For interacting with the file system
const jwt = require('jsonwebtoken') // For working with JSON web tokens
const expressJwt = require('express-jwt') // For working with JSON web tokens
const functions = require('./functions') // Import the functions file
const variables = require('./variables') // Import the variables file
const auth = require('./auth') // Import the auth file
const port = process.env.PORT || 8080 // Set the port to listen for requests from
const node = require('child_process').fork // For starting child Node processes
require('dotenv').config() // Load the contents of a .env file into process.env (used for JWT secrets)

// Use the middleware to accept POST request bodies
app.use(bodyparser.json())

// Ensure client app is accessible
app.use(express.static(__dirname + '/client/dist/client')) //Set folder where compiled client App is located

//Enables client to access the server from localhost, only needed in local development
let allowCrossDomain = function (req, res, next) {
	let valid = false
	if (req.header('origin')) {
		if (req.header('origin').indexOf('localhost') !== -1) {
			valid = true
		}
	}
	if (valid) {
		res.header('Access-Control-Allow-Origin', req.header('origin'))
		res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS')
		res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
		res.header('Access-Control-Allow-Credentials', 'true')
	}
	next()
}
app.use(allowCrossDomain)

// Custom String function used in JWT functions below
String.prototype.replaceAll = function (search, replacement) {
	var target = this
	return target.split(search).join(replacement)
}

// Check if a request if from an authenticated user
checkIfAuthenticated = expressJwt({
	secret: process.env.RSA_PUBLIC_KEY.replaceAll('\\n', '\n'),
	requestProperty: 'jwt'
})

// An array of all scanSync.js processes
let scanners = []

// Check if the log directory exists and warn if it couldn't be created
let logDirExists = false
if (process.env.LOGDIR) {
	if (fs.existsSync(process.env.LOGDIR)) {
		if (fs.statSync(process.env.LOGDIR).isDirectory()) {
			logDirExists = true
		}
	}
	if (!logDirExists) {
		try {
			fs.mkdirSync(process.env.LOGDIR)
		} catch (err) {
			console.log('WARNING: Log directory could not be created, so logs will not be saved.')
		}
	}
}

// Write to log file if possible, optionally, write to console
const log = (object, consoleToo = true) => {
	try {
		if (typeof object != 'string') object = '\n' + JSON.stringify(object, null, '\t')
		object = `${new Date().toString()}: ${object}`
		if (consoleToo) console.log(object)
		const logFilePath = `${process.env.LOGDIR}/app.txt`
		try {
			if (logDirExists) fs.appendFileSync(logFilePath, object + '\n')
		} catch (err) {
			console.log(err)
		}
	} catch (err) {
		console.log(err)
	}
}

// Kill all scanners when this process exits
process.on('exit', () => {
	scanners.forEach(scanner => {
		if (!scanner.killed) scanner.processObj.kill()
	})
	log(`Exiting process.`)
})

// Start a scanner
const startScanner = async (collection, dir, newScanner = false) => {
	try {
		if (!fs.existsSync(dir)) throw 'Directory does not exist.'
		if (!fs.statSync(dir).isDirectory()) throw 'Not a directory.'
	} catch (err) {
		if (newScanner) throw err
		else await stopScanner(collection)
	}
	if (scanners.filter(scanner => scanner.collection == collection).length == 0) {
		scanners.push({
			collection,
			dir,
			processObj: node('./scanSync.js', [collection, dir]).on('exit', () => {
				log(`The scanner for ${collection} has stopped.`)
				setScannerStatus(collection, 'stopped')
			}).on('message', (message) => {
				setScannerStatus(collection, message)
			}),
			status: 'started'
		})
		if (newScanner) await functions.insertArrayIntoMongo(variables.constants.url, variables.constants.configdb, variables.constants.dirsCollection, [{ _id: collection, dir }])
	} else {
		'Already exists.'
	}
}

// Set the status of a specific scanner to a string
const setScannerStatus = (collection, status) => {
	scanners = scanners.map(scanner => {
		if (scanner.collection == collection) {
			scanner.status = status
		}
		return scanner
	})
}

// Stop a scanner by its collection
const stopScanner = async (collection) => {
	if ((await functions.getItemsByIdFromMongo(variables.constants.url, variables.constants.configdb, variables.constants.dirsCollection, [collection])).length > 0) {
		await functions.removeByTagArrayFromMongo(variables.constants.url, variables.constants.configdb, variables.constants.dirsCollection, '_id', [collection])
	}
	if (await functions.ifCollectionExists(variables.constants.url, variables.constants.db, collection)) {
		await functions.removeCollectionFromMongo(variables.constants.url, variables.constants.db, collection)
	}
	let target = scanners.find(scanner => scanner.collection == collection)
	if (target) target.processObj.kill()
	scanners = scanners.filter(scanner => scanner.collection != collection)
	log(`Scanner for ${collection} was stopped and deleted.`)
}

// ROUTES START HERE

// Authenticate
app.post('/auth', (req, res) => {
	log('Attempting auth...')
	auth.authenticate(req.body.password).then(isValid => {
		if (isValid) {
			log('Logged in.')
			res.json({
				jwtToken: jwt.sign({}, process.env.RSA_PRIVATE_KEY.replaceAll('\\n', '\n'), {
					algorithm: 'RS256',
					expiresIn: parseInt(process.env.EXPIRES_IN)
				})
			})
		} else {
			log('Login failed.')
			res.status(401).send()
		}
	}).catch((err) => {
		log(err)
		res.status(500).send(err)
	})
})

// Set up password (for first time use)
app.post('/setup', (req, res) => {
	log('Attempting to set first time password...')
	auth.updateAuth(req.body.password).then(result => {
		log('First time password set.')
		res.send()
	}).catch((err) => {
		log(err)
		res.status(500).send(err)
	})
})

// Check if a password exists
app.get('/isFirstTime', (req, res) => {
	auth.getPassword().then(password => {
		res.send(!password)
	}).catch((err) => {
		log(err)
		res.status(500).send(err)
	})
})

// Change password
app.post('/newAuth', checkIfAuthenticated, (req, res) => {
	log('Attempting to change password...')
	auth.updateAuth(req.body.password, false).then(result => {
		log('Password changed.')
		res.send()
	}).catch((err) => {
		log(err)
		res.status(500).send(err)
	})
})

// Delete everything in the database and exit
app.post('/reset', checkIfAuthenticated, (req, res) => {
	log('Attempting to reset app...')
	let promises = []
	scanners.forEach(scanner => promises.push(stopScanner(scanner.collection)))
	Promise.all(promises).then(result3 => {
		functions.dropDB(variables.constants.url, variables.constants.db).then(result => {
			functions.dropDB(variables.constants.url, variables.constants.configdb).then(result2 => {
				log('App was reset and will now exit.')
				process.exit(0)
			}).catch((err) => {
				log(err)
				res.status(500).send(err)
			})
		}).catch((err) => {
			log(err)
			res.status(500).send(err)
		})
	}).catch(err => {
		log('Could not stop all scanners - please stop them manually.')
		functions.dropDB(variables.constants.url, variables.constants.db).then(result => {
			functions.dropDB(variables.constants.url, variables.constants.configdb).then(result2 => {
				log('App was reset and will now exit.')
				process.exit(0)
			}).catch((err) => {
				log(err)
				res.status(500).send(err)
			})
		}).catch((err) => {
			log(err)
			res.status(500).send(err)
		})
	})
})

// Add a new scanner
app.post('/add', checkIfAuthenticated, (req, res) => {
	log('Attempting to add a scanner...')
	if (req.body.collection && req.body.dir) {
		if (req.body.dir.startsWith('/')) {
			startScanner(req.body.collection, req.body.dir, true).then(() => {
				log('Scanner added.')
				res.send()
			}).catch((err) => {
				log(err)
				res.status(500).send(err)
			})
		} else {
			log('Directory path must be absolute.')
		}
	} else {
		log('Invaid add scanner request - collection and dir properties must exist in POST request body.')
		res.status(400).send()
	}
})

// Remove a new scanner by its collection name
app.post('/remove', checkIfAuthenticated, (req, res) => {
	log('Attempting to remove a scanner...')
	if (req.body.collection) {
		stopScanner(req.body.collection).then(() => {
			res.send()
		}).catch((err) => {
			log(err)
			res.status(500).send(err)
		})
	} else {
		log('Invaid remove scanner request - collection property must exist in POST request body.')
		res.status(400).send()
	}
})

// Get the file name and date for all items in a collection if it is being tracked
app.get('/list/:collection', checkIfAuthenticated, (req, res) => {
	if (!scanners.find(scanner => scanner.collection == req.params.collection)) {
		log('Invalid collection.')
		res.status(400).send()
	} else {
		functions.getDataFromMongo(variables.constants.url, variables.constants.db, req.params.collection, ['_id', 'DateTimeOriginal.rawValue', 'FileName']).then(result => {
			res.send(result)
		}).catch(err => {
			log(err)
			res.status(500).send(err)
		})
	}
})

// Get the all file metadata and thumbnail for a specific item in a collection if it exists
app.get('/single/:collection/:item', checkIfAuthenticated, (req, res) => {
	if (!scanners.find(scanner => scanner.collection == req.params.collection)) {
		log('Invalid collection.')
		res.status(400).send()
	} else {
		functions.getSingleItemByIdFromMongo(variables.constants.url, variables.constants.db, req.params.collection, req.params.item).then(result => {
			if (result) {
				res.send(result)
			} else res.send(result)
		}).catch(err => {
			log(err)
			res.status(500).send(err)
		})
	}
})

// Get the all file metadata and thumbnails for specific items in a collection if it exists
app.post('/many/:collection', checkIfAuthenticated, (req, res) => {
	if (!scanners.find(scanner => scanner.collection == req.params.collection)) {
		log('Invalid collection.')
		res.status(400).send()
	} else {
		functions.getItemsByIdFromMongo(variables.constants.url, variables.constants.db, req.params.collection, req.body.ids).then(results => {
			res.send(results)
		}).catch(err => {
			log(err)
			res.status(500).send(err)
		})
	}
})

// Get the actual file for a specific item in a collection if it exists
app.get('/content/:collection/:item', checkIfAuthenticated, (req, res) => {
	if (!scanners.find(scanner => scanner.collection == req.params.collection)) {
		log('Invalid collection.')
		res.status(400).send()
	} else {
		functions.getSingleItemByIdFromMongo(variables.constants.url, variables.constants.db, req.params.collection, req.params.item).then(result => {
			if (result) {
				res.sendFile(result.SourceFile)
			} else res.send(result)
		}).catch(err => {
			log(err)
			res.status(500).send(err)
		})
	}
})

// Get the list of tracked collections
app.get('/dirs', checkIfAuthenticated, (req, res) => {
	res.send(scanners.map(scanner => { return { collection: scanner.collection, dir: scanner.dir, status: scanner.status } }))
})

//All other routes are handled by the Angular App which is served here
app.get('*', (req, res) => {
	res.sendFile(__dirname + '/client/dist/client/index.html')
})

// Load existing directory/collection pairs from the DB, then start the server
functions.getDataFromMongo(variables.constants.url, variables.constants.configdb, variables.constants.dirsCollection).then(results => {
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

/*
TODO:
	ASAP:
		Folder view:
			Show what files are ignored or don't have thumbnails.
			Make the slider show dates/letters instead of page numbers.
			Add manual forward/back buttons instead of just the slider.
			Hide items when page is being switched.

		Item view:
			Provide more metadata about the item.
			Say whether the DateTimeOriginal, CreateDate, or MediaCreateDate is being used.

	Later:
		Overhaul UI - currently looks ugly.
*/