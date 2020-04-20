// variables.js
// Defines constant variables used across the application

// Don't change these unless you know what you're doing
module.exports.constants = {
    url: 'mongodb://localhost:27017/', // Database URL (Mongo DB)
    db: 'gallery15-dirs', // Database name
    configdb: 'gallery15-config', // Database name for configuration
    dirsCollection: 'directories', // Collection in which collection/dir pairs are stored
    authCollection: 'authentication', // Collection in which the password is stored
}

// Change these as needed
module.exports.config = {
    logDir: null, // Where to store log files (can be left empty/null)
    scanInterval: 300 // How long to wait between scans
}