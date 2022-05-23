// Dependencies
const fs = require('fs');
const mime = require('mime');
const path = require('path');

const config = require('../configs/config');
const helpers = require('../utils/helpers');
const database = require('../services/database');

// Establish router
const router = require('express').Router();

/* POST Upload a file */
router.post('/upload', async (req, res) => {
    // Validate the request
    if (!req.headers.password || !helpers.validatePassword(req.headers.password)) return res.sendStatus(403);
    if (!req.files.file) return res.sendStatus(400);

    // Register the new file
    const filePath = helpers.filePath(req.files.file.name);
    const fileRecord = await database.addFileRecord(filePath);

    // Save the file data
    try {
        helpers.ensureDirectory(path.dirname(filePath));
        await fs.writeFileSync(filePath, req.files.file.data);
    } catch (err) {
        console.error(err);
        return res.sendStatus(500)
    }

    // Respond to the request
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ URL: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${fileRecord.accessCode}${config.files.extensions.includes(path.extname(filePath).substring(1)) ? path.extname(filePath) : ''}` }));
});

/* GET Download a file */
router.get(`/:identifier`, async (req, res) => {
    const fileRecord = await database.getFile(req.params.identifier.split('.')[0]);

    // Query the database for the file record associated with the identifier
    if (!fileRecord) return res.sendStatus(404);
    if (!fs.existsSync(fileRecord.FilePath)) {
        await database.removeFileRecord(req.params.identifier.split('.')[0]);
        return res.sendStatus(404);
    }

    // Respond to the request with the requested file
    res.writeHead(200, { 'Content-Type': mime.lookup(fileRecord.FilePath), 'Content-disposition': `inline; filename="${path.basename(fileRecord.FilePath)}"` });
    fs.createReadStream(fileRecord.FilePath).pipe(res);
});

// Reject requests to non-existent routes
router.get('*', (req, res) => res.sendStatus(404));

module.exports = router;