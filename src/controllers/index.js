// dependencies
const fs = require('fs');
const path = require('path');
const { Helpers, Database } = require('../utils');

// config
const config = require('../../data/config');

const invalidRequestResponse = (res, status, message) => {
    res.status(status).render('error', { layout: false, message: message, status: status });
}

const baseRequestHandler = (req, res) => {
    res.redirect(config.server.redirectUrl)
}

const fileUploadHandler = async (req, res) => {
    // password & request validation
    if (!process.env.PASSWORD_HASH) {
        return res.status(500).json({ error: 'password not set' });
    }
    if (!req.headers.password || !await Helpers.checkPassword(req.headers.password, process.env.PASSWORD_HASH)) {
        return res.status(403).json({ error: 'invalid password' });
    }
    if (!req.files.file) return res.status(400).json({ error: 'no file provided' });

    const [fileType, fileFormat] = req.files.file.mimetype.split('/');

    // fetch new unique file access code
    const accessCode = await Database.getNewAccessCode();

    // check if file name sanitization is enabled and sanitize the file name if it is
    let fileName;
    if (config.uploads.sanitiseFileNames) {
        fileName = `${accessCode}${path.extname(req.files.file.name)}`;
    } else {
        fileName = req.files.file.name;
    }

    const filePath = Helpers.getFilePath(fileName);

    // insert a new file record into the database, creating a new access code
    let fileRecord;
    try {
        fileRecord = await Database.addFileRecord(accessCode, fileName, fileType, fileFormat);
        console.log(`Added file record: ${accessCode} -> ${fileName}`);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'failed to add file record to database' });
    }

    // save the recieved file to the uploads directory
    try {
        Helpers.ensureDirectory(path.dirname(filePath));
        req.files.file.mv(path.resolve(filePath), (err) => {
            if (err) console.log(err);
        });
    } catch (err) {
        console.error(err);
        await Database.removeFileRecord(fileRecord.accessCode);
        console.log(`Removed file record: ${accessCode}`);
        return res.status(500).json({ error: 'failed to save file to disk' });
    }

    // return a URL pointing to the uploaded file in the format https://<domain name>/<access code>
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ URL: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${fileRecord.accessCode}` }));

    // get the 'type' of the file, determining whether it is a HTML supported media format or not
    const template = Helpers.getTemplate(fileType, fileFormat)

    // add resolution of image/video file to database if said file format is HTML supported
    if (template != 'default') {
        try {
            Helpers.getResolution(fileName, async (width, height) => {
                await Database.updateResolution(fileRecord.accessCode, width, height);
                console.log(`Updated file resolution: ${accessCode} -> ${height}x${width}`);
            });
        } catch (err) { console.error(err); }
    }

    // create a thumbnail for the uploaded file if it is a supported video format
    if (template === 'video') {
        Helpers.createThumbnail(fileName, path.join(path.dirname(filePath), 'thumbnails'), (err) => {
            if (err) {
                console.error(`Failed to create a thumbnail for ${fileName}\n{${err}}`);
            } else console.log(`Created a thumbnail for ${fileName}`);
        });
    }
}

const fileRetreiveHandler = async (req, res) => {
    // attempt to retreive the relevant file record from the database using the specified identification code
    let fileRecord;
    try {
        fileRecord = await Database.getFileRecord(req.params.identifier);
    } catch (err) {
        console.error(err);
        return invalidRequestResponse(res, 500, 'Internal server error, please try again later.');
    }
    if (!fileRecord) {
        return invalidRequestResponse(res, 404, `Unable to find file with identifier <span style="color: #32a852;">${req.params.identifier}</span>.`);
    }

    // check if the file paired with the requested identification code exists
    const localFilePath = Helpers.getFilePath(fileRecord.FileName)
    if (!await Helpers.checkPathExists(localFilePath)) {
        try {
            await Database.removeFileRecord(fileRecord.AccessCode);
            console.log(`Removed file record: ${accessCode}`);
        } catch (err) {
            console.error(err);
        }
        return invalidRequestResponse(res, 404, `The file with identifier <span style="color: #32a852;">${req.params.identifier}</span> no longer exists.`);
    }

    // get the 'type' of the file, determining whether it is a HTML supported media format or not
    const template = Helpers.getTemplate(fileRecord.FileType, fileRecord.FileFormat);

    // create new object containing all relevant file information
    let data = {
        fileName: fileRecord.FileName,
        fileType: fileRecord.FileType,
        fileFormat: fileRecord.FileFormat,
        fileSize: await Helpers.getFileSize(fileRecord.FileName),
        fileUrl: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${path.join(config.uploads.path, fileRecord.FileName)}`,
        themeColour: config.apperance.themeColour
    };

    // check if the file is an image or video and add resolution to the data object
    if (template != 'default') {
        data.Embed = true;
        data.Width = fileRecord.Width;
        data.Height = fileRecord.Height;
    }

    // render the template on the client side, passing in the data object to fill out information
    res.status(200).render(template, data);
}

module.exports = {
    baseRequestHandler,
    fileUploadHandler,
    fileRetreiveHandler,
}