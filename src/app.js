// Dependencies
const express = require('express');
const fileUpload = require('express-fileupload');

const config = require('./configs/config');

// Timestamps for console.log messages
require('console-stamp')(console, {
    format: ':date(yyyy/mm/dd HH:MM:ss)'
});

// Initialise environment variables from .env file
require('dotenv').config({ path: '.env' });

// Initialise express
const app = express();

// Initialise file upload middleware
app.use(fileUpload({
    limits: {
        fileSize: config.files.maxSize * 1024 * 1024,
        files: 1
    },
}));

// Initialise routes
app.use('/', require('./routes/routes'));

// Trust X-Forwarded-* headers
app.set('trust proxy', config.server.proxied);

// Start the server on port 80
app.listen(config.server.port, () => console.log(`Server started on port ${config.server.port}`));
