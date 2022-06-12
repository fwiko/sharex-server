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
    const [fileType, fileFormat] = req.files.file.mimetype.split('/');
    const fileRecord = await Database.addFileRecord(req.files.file.name, fileType, fileFormat);

    // return file identifier
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ URL: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${fileRecord.accessCode}` }));

    // add resolution of image/video file to database
    if (Helpers.getTemplate(fileFormat) != 'default') {
        Helpers.getResolution(req.files.file.name, (err, width, height) => {
            if (!err) {
                Database.updateResolution(fileRecord.accessCode, width, height);
            }
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
    // get file record from database using the specified access code
    const fileRecord = await Database.getFileRecord(req.params.identifier);

    // request validation - check if file exists
    if (!fileRecord) {
        return res.status(404).json({ error: 'file not found' });
    }
    if (!fs.existsSync(Helpers.getFilePath(fileRecord.FileName))) {
        await Database.removeFileRecord(fileRecord.AccessCode);
        return res.status(404).json({ error: 'file not found' });
    }

    // get the template relative to the file type and whether it is embeddable (supported by HTML)
    const template = Helpers.getTemplate(fileRecord.FileFormat);

    // create new object containing all relevant file information
    let data = {
        fileName: fileRecord.FileName,
        fileType: fileRecord.FileType,
        fileFormat: fileRecord.FileFormat,
        fileSize: 0,
        fileUrl: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${path.join('uploads', fileRecord.FileName)}`
    };

    // check if the file is an image or video and add resolution to the data object
    if (template != 'default') {
        data.Width = fileRecord.Width;
        data.Height = fileRecord.Height;
    }

    // render the template
    res.status(200).render(template, data);
}



module.exports = {
    fileUploadHandler,
    fileRetreiveHandler
}