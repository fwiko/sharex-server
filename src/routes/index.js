// dependencies
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const database = require('../database');
const bcrypt = require('bcrypt');
const utility = require('../utility');

// establish router
const router = require('express').Router();

// handle a file upload POST request
router.post('/upload', async (req, res) => {
    // evaluate the specified password return 403 unauthorized if invalid
    if (!req.headers.password || !await bcrypt.compare(req.headers.password, process.env.PASSWORD_HASH)) return res.status(403).end('Unauthorised.');
    // if the file is not valid return a 400 bad request response
    if (!req.files.file) return res.status(400).end('No file uploaded.');
    // path of the new file to be created
    const filePath = utility.filePath(req.files.file.name);
    // add file location/access information to the database
    const fileRecord = await database.addFileRecord(filePath);
    // save the uploaded file to the file directory
    try {
        utility.ensureDirectory(path.dirname(filePath));
        await fs.writeFileSync(filePath, req.files.file.data);
    } catch (err) {
        console.error(err);
        return res.status(500).end('Internal server error, please try again later.');
    }
    // set the headers and respond with a URL pointing to the new file
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ URL: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${fileRecord.accessCode}` }));
});

// get and serve the requested file
router.get(`/:fileCode`, async (req, res) => {
    const fileRecord = await database.getFile(req.params.fileCode);
    // check if file record and file exist
    if (!fileRecord) return res.sendStatus(404);
    if (!fs.existsSync(fileRecord.FilePath)) {
        await database.removeFileRecord(req.params.fileCode);
        return res.sendStatus(404);
    }
    // set the headers and serve the file
    res.writeHead(200, { 'Content-Type': mime.lookup(fileRecord.FilePath), 'Content-disposition': `inline; filename="${path.basename(fileRecord.FilePath)}"` });
    return fs.createReadStream(fileRecord.FilePath).pipe(res);
});

// return 404 not found on invalid routes
router.get('*', (req, res) => res.status(404).end());

module.exports = router;