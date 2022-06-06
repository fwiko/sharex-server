// dependencies
const fs = require('fs');
const path = require('path');
const { Helpers, Database } = require('../utils');

const fileUploadHandler = async (req, res) => {
    if (!req.headers.password /* || Helpers.checkPassword(req.headers.password, "xx") */) {
        return res.status(403).json({ error: 'invalid password' });
    }
    if (!req.files.file) return res.status(400).json({ error: 'no file provided' });

    // get full path to file
    const filePath = Helpers.getFilePath(req.files.file.name);

    // save file to disk
    try {
        Helpers.ensureDirectory(path.dirname(filePath));
        req.files.file.mv(path.resolve(filePath), (err) => {
            if (err) console.log(err);
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }

    // create file record in database
    const fileRecord = await Database.addFileRecord(req.files.file.name, req.files.file.mimetype);

    // return file identifier
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ URL: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${fileRecord.accessCode}` }));

    // add resolution of image/video file to database
    if (req.files.file.mimetype.includes('video') || req.files.file.mimetype.includes('image')) {
        Helpers.getResolution(req.files.file.name, (err, width, height) => {
            if (err) console.log(err);
            Database.updateFileResolution(fileRecord.accessCode, height, width);
        });
    }

    // check if file is a video and create a thumbnail
    if (req.files.file.mimetype.includes('video')) {
        Helpers.createThumbnail(req.files.file.name, path.join(path.dirname(filePath), 'thumbnails'), (res, err) => {
            if (err) {
                console.log(`Failed to create a thumbnail for ${req.files.file.name}`);
            } else console.log(`Created a thumbnail for ${req.files.file.name}`);
        });
    }
}

const fileRetreiveHandler = async (req, res) => {
    const fileRecord = await Database.getFileRecord(req.params.identifier);

    if (!fileRecord) {
        return res.status(404).json({ error: 'file not found' });
    }
    if (!fs.existsSync(Helpers.getFilePath(fileRecord.FileName))) {
        await Database.removeFileRecord(fileRecord.AccessCode);
        return res.status(404).json({ error: 'file not found' });
    }

    // TODO: Ensure the image/video is of an embeddable format (png, jpg, gif, webm, mp4, ogg/v, etc.)
    var template;
    if (fileRecord.FileType.includes('image') || fileRecord.FileType.includes('video')) {
        template = fileRecord.FileType.split('/')[0];
    }


    // TODO: split into three helper functions depending on whether the file is embeddable (image or video) or not
    res.status(200).render(template, {
        fileName: fileRecord.FileName,
        fileType: fileRecord.FileType.split('/')[0],
        fileSubtype: fileRecord.FileType.split('/')[1],
        fileUrl: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${path.join('uploads', fileRecord.FileName)}`,
        thumbnailUrl: `${req.secure ? 'https' : 'http'}://${req.headers.host}/` + Helpers.getThumbnailPath(fileRecord.FileName),
        width: fileRecord.Width,
        height: fileRecord.Height,
    })

}



module.exports = {
    fileUploadHandler,
    fileRetreiveHandler
}