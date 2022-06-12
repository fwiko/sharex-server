// dependencies
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const bcrypt = require('bcrypt');

// returns a random string of specified length
const randomString = function (length) {
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var string = '';
    for (var i = 0; i < length; i++) {
        string += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return string;
}

// return a complete file path e.g. /public/uploads/file.png
const getFilePath = (fileName) => {
    return path.join('public', 'uploads', fileName);
}

// check that a directory exists, if not create it
const ensureDirectory = (dir) => {
    if (!fs.existsSync(dir)) return fs.mkdirSync(dir, { recursive: true });
    return dir;
}

// compares a plain text string to a hash, returns true if match
const checkPassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
}

// create thumbnail image for a video file
const createThumbnail = (fileName, thumbDir, callback) => {
    ensureDirectory(thumbDir);
    ffmpeg(getFilePath(fileName))
        .screenshots({
            count: 1,
            folder: thumbDir,
            filename: '%b.png'
        })
        .on('error', function (err) { callback(err); })
        .on('end', function () { callback(null); })
}

// get resolution of an image/video file
const getResolution = (fileName, callback) => {
    ffmpeg(getFilePath(fileName))
        .ffprobe(0, function (err, data) {
            if (err) throw err;
            callback(data.streams[0].width, data.streams[0].height);
        })
}

const getThumbnailPath = (fileName) => {
    return path.join('uploads', 'thumbnails', fileName.split('.')[0] + '.png');
}

// get the name of the template file to be used depending on the file type
const getTemplate = (fileType, fileFormat) => {

    console.log(/(gif|jpg|jpeg|png|webp|mp4|webm|ogg)$/i.test(fileFormat) && (fileType === 'image' || fileType === 'video'))
    return /(gif|jpg|jpeg|png|webp|mp4|webm|ogg)$/i.test(fileFormat) && (fileType === 'image' || fileType === 'video') ? fileType : 'default';
}

module.exports = {
    randomString,
    getFilePath,
    ensureDirectory,
    checkPassword,
    createThumbnail,
    getResolution,
    getThumbnailPath,
    getTemplate
}