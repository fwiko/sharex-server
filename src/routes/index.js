// dependencies
const express = require('express');
const controllers = require('../controllers');

const router = express.Router();

// register routes

router.get('/test1', (req, res) => {

    const data = {
        fileName: "jaquway.mp4",
        fileType: "video",
        fileUrl: "https://cdn-cf-east.streamable.com/video/mp4/9rkzcw.mp4?Expires=1654292640&Signature=BjBsvwQGoEN~uO3ODdZf-1AumkM2lYpfZqW-1wMvgqju~-Cu5nhAeDy474ol85QcoJmbJBY1kA9y8n3~8Uf3TqAMolBonSoOLkYa1MucYHWwU9IOwr56nrZrpHeRO70c9HAdWV2NyPVX2nldy24E02MmoJgi7tX9khiwSNmH1TE7qrztGgZTVZAR8g3CKrZj0NWwh1IQ3QIgs5P2VZNFedWFy~DSOWd-Je9W5fNGKwewMFd4qt3YrkxN9ZWVYF12oCtx6tzrmdNMJOT7VJq8mB4DpTwZCHemAwGm-KpnuzGkA1fMe9AM9zFqo0RIFHDUSb3TC4MkBXAK5wPecXZYFw__&Key-Pair-Id=APKAIEYUVEN4EVB2OKEQ",
        mimeType: "video/mp4",
        fileWidth: "576",
        fileHeight: "1024",
    }
    res.render('main', { layout: false, ...data })
});

router.post('/upload', async (req, res) => await controllers.fileUploadHandler(req, res));
router.get('/:identifier', async (req, res) => await controllers.fileRetreiveHandler(req, res));

module.exports = router;

// successfully got meta tags to embed video
// must collect file data upon upload and store in database (width, height, filename, access token, create thumbnail image and store in /public/thumbnails)