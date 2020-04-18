// Constants used accross the application

// Don't change these unless you know what you're doing
module.exports.url = 'mongodb://localhost:27017/' // Database URL (Mongo DB)
module.exports.db = 'gallery' // Database name
module.exports.configdb = 'gallery-config' // Database name for configuration
module.exports.dirsCollection = 'directories' // Collection in which collection/dir pairs are stored

// Change these as needed
module.exports.logDir = '/home/imranr/Desktop/logs' // Where to store log files
module.exports.scanInterval = 300 // How long to wait between scans