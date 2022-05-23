// Dependencies
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const bcrypt = require('bcrypt');

const config = require('../configs/config');

const helpers = {}

// Returns a random string of the specified length
helpers.randomString = function (length) {
    var string = '';
    for (var i = 0; i < length; i++) {
        string += config.codes.characters.charAt(Math.floor(Math.random() * config.codes.characters.length));
    }
    return string;
}

// Returns a complete filepath for a new file
helpers.filePath = function (fileName) {
    return path.join(
        "data",
        config.files.directory,
        mime.lookup(fileName).split("/")[0],
        fileName
    );
}

// Checks if a directory exists, and creates it if it doesn't
helpers.ensureDirectory = function (dir) {
    if (!fs.existsSync(dir)) return fs.mkdirSync(dir, { recursive: true });
    return dir;
}

// Validates a string against the stored password hash
helpers.validatePassword = async function (password) {
    return await bcrypt.compare(password, process.env.PASSWORD_HASH);
}

module.exports = helpers;