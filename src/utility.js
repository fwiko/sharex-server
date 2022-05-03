// dependencies
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const config = require('../config');

const utility = {}

utility.randomString = function (length) {
    var string = '';
    for (var i = 0; i < length; i++) {
        string += config.codes.characters.charAt(Math.floor(Math.random() * config.codes.characters.length));
    }
    return string;
}

utility.filePath = function (fileName) {
    return path.join(
        config.files.directory,
        mime.lookup(fileName).split("/")[0],
        fileName
    );
}

utility.ensureDirectory = function (dir) {
    if (!fs.existsSync(dir)) return fs.mkdirSync(dir, { recursive: true });
    return dir;
}

module.exports = utility;