// dependencies
const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');

// initialise environment variables from .env file
require('dotenv').config({ path: '.env' });

// initialise express
const server = express();

// initialise file upload middleware
server.use(fileUpload());

// trust X-Forwarded-* headers
server.set('trust proxy', true);

// initialise routes
server.use('/', require(path.join(__dirname, 'routing', 'get')));
server.use('/', require(path.join(__dirname, 'routing', 'post')))

// start the server on port 80
server.listen(80, () => console.log(`Server started on port 80`));
