// dependencies
const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const { engine } = require('express-handlebars');

// config
const config = require('../data/config');

// Timestamps for console.log messages
require('console-stamp')(console, {
    format: ':date(yyyy/mm/dd HH:MM:ss)'
});

// Initialise environment variables from .env file
require('dotenv').config({ path: '.env' });

const app = express();

// public directory
app.use(express.static(path.join(__dirname, '../public')));

// templating engine
app.engine('handlebars', engine({
    helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    },
    partialsDir: './views/partials',
    defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// file upload middleware
app.use(fileUpload(
    {
        useTempFiles: true,
        tempFileDir: './tmp/',
        limits: {
            fileSize: config.uploads.maxSize * 1024 * 1024
        },
        abortOnLimit: true
    }
));

// route handlers
app.use('/', require('./routes'));

// proxy configuration
app.set('trust proxy', config.server.trustProxies);

// start server
app.listen(config.server.port, config.server.hostName, () => console.log(`Server listening on port ${config.server.port}`));