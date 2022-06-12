// dependencies
const fs = require('fs');
const path = require('path');
const { Helpers, Database } = require('../utils');

const fileUploadHandler = async (req, res) => {
    if (!req.headers.password /* || Helpers.checkPassword(req.headers.password, "xx") */) {
        return res.status(403).json({ error: 'invalid password' });
    }
    if (!req.files.file) return res.status(400).json({ error: 'no file provided' });

    const filePath = Helpers.getFilePath(req.files.file.name);

    // save the recieved file to the uploads directory
    try {
        Helpers.ensureDirectory(path.dirname(filePath));
        req.files.file.mv(path.resolve(filePath), (err) => {
            if (err) console.log(err);
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'failed to save file to disk' });
    }

    const [fileType, fileFormat] = req.files.file.mimetype.split('/');

    // insert a new file record into the database, creating a new access code
    let fileRecord;
    try {
        fileRecord = await Database.addFileRecord(req.files.file.name, fileType, fileFormat);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'failed to add file record to database' });
    }

    // return file identifier
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ URL: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${fileRecord.accessCode}` }));

    // add resolution of image/video file to database
    if (Helpers.getTemplate(fileFormat) != 'default') {
        try {
            Helpers.getResolution(req.files.file.name, (width, height) => {
                Database.updateResolution(fileRecord.accessCode, width, height);
            });
        } catch (err) { console.error(err); }
    }

    // create a thumbnail for the uploaded file if it is a supported video format
    if (Helpers.getTemplate(fileFormat) === 'video') {
        Helpers.createThumbnail(req.files.file.name, path.join(path.dirname(filePath), 'thumbnails'), (err) => {
            if (err) {
                console.error(`Failed to create a thumbnail for ${req.files.file.name}\n{${err}}`);
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