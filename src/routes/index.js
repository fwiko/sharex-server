// dependencies
const express = require('express');
const controllers = require('../controllers');

const router = express.Router();

// register routes
router.post('/upload', async (req, res) => await controllers.fileUploadHandler(req, res));
router.get('/:identifier', async (req, res) => await controllers.fileRetreiveHandler(req, res));

// unrelated/invalid request routes
router.get('/', async (req, res) => controllers.baseRequestHandler(req, res))



module.exports = router;