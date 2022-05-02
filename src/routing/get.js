// dependencies
const fs = require('fs');
const path = require('path');
const mime = require('mime');
const router = require('express').Router();

// serve the requested file if available
router.get('/:img', (req, res) => {
    // get local file path
    const filePath = path.join('uploads', mime.lookup(req.params.img).split("/")[0], req.params.img);
    // check if file exists
    if (!fs.existsSync(filePath)) return res.sendStatus(404);

    // set the headers and serve the file
    res.writeHead(200, { 'Content-Type': mime.lookup(filePath) });
    return fs.createReadStream(filePath).pipe(res);
});

// return 403 forbidden on invalid routes
router.get('*', (req, res) => res.sendStatus(403));

module.exports = router;