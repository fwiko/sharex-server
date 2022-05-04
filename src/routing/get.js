// dependencies
const fs = require('fs');
const mime = require('mime');
const path = require('path');
const router = require('express').Router();
const database = require('../database');

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