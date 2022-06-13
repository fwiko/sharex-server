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

const checkPathExists = async (path) => {
    return !!(await fs.promises.stat(path).catch(() => null));
}

// check that a directory exists, if not create it
const ensureDirectory = async (dir) => {
    if (!await checkPathExists(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
    }
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

// const getThumbnailPath = (fileName) => {
//     return path.join('uploads', 'thumbnails', fileName.split('.')[0] + '.png');
// }

// get the name of the template file to be used depending on the file type
const getTemplate = (fileType, fileFormat) => {
    if (/(gif|jpg|jpeg|png|webp|mp4|webm|ogg)$/i.test(fileFormat) && (fileType === 'image' || fileType === 'video')) {
        return fileType
    } else { return 'default'; }
}

// get the human readable file size paired with the closest unit of data (e.g. 1.5 MB)
const getFileSize = async (fileName) => {
    const fileSize = (await fs.promises.stat(getFilePath(fileName))).size;
    if (-1000 < fileSize && fileSize < 1000) {
        return `${fileSize} B`
    }
    const dataUnits = ['k', 'M', 'G'];
    let c = 0;
    while (fileSize <= -999950 || fileSize >= 999950) {
        fileSize /= 1000;
        c++;
    }
    return `${(fileSize / 1000.0).toFixed(1)} ${dataUnits[c]}B`
}
module.exports = {
    randomString,
    getFilePath,
    ensureDirectory,
    checkPassword,
    createThumbnail,
    getResolution,
    getFileSize,
    getTemplate,
    checkPathExists
}