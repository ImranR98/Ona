// auth.js
// Provides functions for saving, updating, and checking the password

// Required modules
const bcrypt = require('bcrypt') // For password hashing
const functions = require('./functions') // Import the functions file
const variables = require('./variables') // Import the variables file

// Get the password from the database
module.exports.getPassword = async () => {
    let password = await functions.getSingleItemByIdFromMongo(variables.constants.url, variables.constants.configdb, variables.constants.authCollection, 'password')
    if (password) password = password.password // Quality readable code
    return password
}

// Check if the provided password matches the one in the database
module.exports.authenticate = async (password) => bcrypt.compareSync(password, await this.getPassword())

// Update the password or add it if one doesn't exist (if set to true, onlyNew rejects the password if one exists)
module.exports.updateAuth = async (password, onlyNew = true) => {
    let encryptedPassword = bcrypt.hashSync(password, 10)
    let result = null
    if (!(await this.getPassword())) {
        result = await functions.insertArrayIntoMongo(variables.constants.url, variables.constants.configdb, variables.constants.authCollection, [{ _id: 'password', password: encryptedPassword }])
    } else {
        if (!onlyNew) {
            result = await functions.updateItemAttributeById(variables.constants.url, variables.constants.configdb, variables.constants.authCollection, 'password', 'password', encryptedPassword)
        } else {
            throw 'Not Authorized.'
        }
    }
    return result
}