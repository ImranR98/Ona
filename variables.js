// variables.js
// Defines constant variables used across the application

// Don't change these unless you know what you're doing
module.exports.constants = {
    url: 'mongodb://localhost:27017/', // Database URL (Mongo DB)
    db: 'gallery', // Database name
    configdb: 'gallery-config', // Database name for configuration
    dirsCollection: 'directories', // Collection in which collection/dir pairs are stored
    authCollection: 'authentication', // Collection in which the password is stored
}

// Change these as needed
module.exports.config = {
    logDir: '/home/imranr/Desktop/logs', // Where to store log files
    scanInterval: 300 // How long to wait between scans
}