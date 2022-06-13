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

    // return a URL pointing to the uploaded file in the format https://<domain name>/<access code>
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ URL: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${fileRecord.accessCode}` }));

    // get the 'type' of the file, determining whether it is a HTML supported media format or not
    const template = Helpers.getTemplate(fileType, fileFormat)

    // add resolution of image/video file to database if said file format is HTML supported
    if (template != 'default') {
        try {
            Helpers.getResolution(req.files.file.name, (width, height) => {
                Database.updateResolution(fileRecord.accessCode, width, height);
            });
        } catch (err) { console.error(err); }
    }

    // create a thumbnail for the uploaded file if it is a supported video format
    if (template === 'video') {
        Helpers.createThumbnail(req.files.file.name, path.join(path.dirname(filePath), 'thumbnails'), (err) => {
            if (err) {
                console.error(`Failed to create a thumbnail for ${req.files.file.name}\n{${err}}`);
            } else console.log(`Created a thumbnail for ${req.files.file.name}`);
        });
    }
}

const fileRetreiveHandler = async (req, res) => {
    // get file record from database using the specified access code
    let fileRecord;
    try {
        fileRecord = await Database.getFileRecord(req.params.identifier);
    } catch (err) {
        console.error(err);
        return res.status(500).send({ error: 'internal server error, please try again later.' });
    }

    // request validation - check if file exists
    if (!fileRecord) {
        return res.status(404).json({ error: `could not find file with identifier ${req.params.identifier}` });
    }
    // TODO: make asynchronous, convert to fs.promise
    if (!fs.existsSync(Helpers.getFilePath(fileRecord.FileName))) {
        // TODO: add a try block here
        await Database.removeFileRecord(fileRecord.AccessCode);
        return res.status(404).json({ error: `file with identifier ${req.params.identifier} no longer exists` });
    }

    // get the 'type' of the file, determining whether it is a HTML supported media format or not
    const template = Helpers.getTemplate(fileRecord.FileType, fileRecord.FileFormat);

    // create new object containing all relevant file information
    let data = {
        fileName: fileRecord.FileName,
        fileType: fileRecord.FileType,
        fileFormat: fileRecord.FileFormat,
        fileSize: await Helpers.getFileSize(fileRecord.FileName),
        fileUrl: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${path.join('uploads', fileRecord.FileName)}`
    };

    // check if the file is an image or video and add resolution to the data object
    if (template != 'default') {
        data.Width = fileRecord.Width;
        data.Height = fileRecord.Height;
    }

    // render the template on the client side, passing in the data object to fill out information
    res.status(200).render(template, data);
}



module.exports = {
    fileUploadHandler,
    fileRetreiveHandler
}