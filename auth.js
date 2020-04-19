// auth.js
// Provides functions for saving, updating, and checking the password

// Required modules
const bcrypt = require('bcrypt') // For password hashing
const functions = require('./functions') // Import the functions file
const variables = require('./variables') // Import the variables file

// Get the password from the database
module.exports.getPassword = async () => await functions.getSingleItemByIdFromMongo(variables.url, variables.configdb, variables.authCollection, 'password')
// Check if the provided password matches the one in the database
module.exports.authenticate = async (password) => bcrypt.compareSync(password, await this.getPassword())
// Update the password or add it if one doesn't exist
module.exports.updateAuth = async (password) => {
    let encryptedPassword = bcrypt.hashSync(password, 10)
    let result = null
    if (!(await this.getPassword())) {
        result = await functions.insertArrayIntoMongo(variables.url, variables.configdb, variables.authCollection, [{ _id: 'password', password: encryptedPassword }])
    } else {
        result = await functions.updateItemAttributeById(variables.url, variables.configdb, variables.authCollection, 'password', '_id', encryptedPassword)
    }
    return result
}