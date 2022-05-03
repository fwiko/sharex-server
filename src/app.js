// dependencies
const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const config = require('../config');

// initialise environment variables from .env file
require('dotenv').config({ path: '.env' });

// initialise express
const server = express();

// initialise file upload middleware
server.use(fileUpload());

// trust X-Forwarded-* headers
server.set('trust proxy', config.server.proxied);

// initialise routes
server.use('/', require(path.join(__dirname, 'routing', 'get')));
server.use('/', require(path.join(__dirname, 'routing', 'post')))

// start the server on port 80
server.listen(config.server.port, () => console.log(`Server started on port ${config.server.port}`));
