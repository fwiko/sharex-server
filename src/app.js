// dependencies
const express = require('express');
const fileUpload = require('express-fileupload');
const config = require('./config');

// timestamps for console.log messages
require('console-stamp')(console, {
    format: ':date(yyyy/mm/dd HH:MM:ss) :label'
});

// initialise environment variables from .env file
require('dotenv').config({ path: '.env' });

// initialise express
const app = express();

// initialise routes
app.use('/', require('./routes'));

// initialise file upload middleware
app.use(fileUpload({
    limits: {
        fileSize: config.files.maxSize * 1024 * 1024,
        files: 1
    },
}));

// trust X-Forwarded-* headers
app.set('trust proxy', config.server.proxied);

// start the server on port 80
app.listen(config.server.port, () => console.log(`Server started on port ${config.server.port}`));
