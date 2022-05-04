// dependencies
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const config = require('../data/config');

const utility = {}

// returns a random string of the specified length
utility.randomString = function (length) {
    var string = '';
    for (var i = 0; i < length; i++) {
        string += config.codes.characters.charAt(Math.floor(Math.random() * config.codes.characters.length));
    }
    return string;
}

// returns a complete filepath for a new file
utility.filePath = function (fileName) {
    return path.join(
        "data",
        config.files.directory,
        mime.lookup(fileName).split("/")[0],
        fileName
    );
}

// checks if a directory exists, and creates it if it doesn't
utility.ensureDirectory = function (dir) {
    if (!fs.existsSync(dir)) return fs.mkdirSync(dir, { recursive: true });
    return dir;
}

module.exports = utility;