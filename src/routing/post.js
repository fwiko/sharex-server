// dependencies
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const bcrypt = require('bcrypt');
const router = require('express').Router();

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// regex for acceptable file extensions
const fileValidationRegex = /\.(gif|jpg|jpeg|tiff|png|mp4|zip|rar|txt)$/i;

// handle a file upload POST request
router.post('/upload', async (req, res) => {
    try {
        // if the password is incorrect return a 403 forbidden response
        if (!req.headers.password || !await bcrypt.compare(req.headers.password, process.env.PASSWORD_HASH)) return res.status(403).end('Unauthorised');
        // if the file is not valid return a 400 bad request response
        if (!req.files.file || !fileValidationRegex.test(req.files.file.name)) return res.status(400).end('Invalid file');
    } catch (err) {
        console.error(err);
        return res.status(500).end('Internal server error, please try again later.');
    }

    // get the local file path for the new file

    const filePath = path.join('uploads', mime.lookup(req.files.file.name).split("/")[0], req.files.file.name);

    try {
        // save the new file to the local file path
        ensureDir(path.dirname(filePath));
        await fs.writeFileSync(filePath, req.files.file.data);
    } catch (err) {
        console.error(err);
        return res.status(500).end('Internal server error, please try again later.');
    }

    // set the headers and respond with a URL pointing to the new file
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ URL: `${req.secure ? 'https' : 'http'}://${req.headers.host}/${req.files.file.name}` }));
});

module.exports = router;