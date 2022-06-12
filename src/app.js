// dependencies
const path = require('path');
const express = require('express');
const fileUpload = require('express-fileupload');
const { engine } = require('express-handlebars');

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
            fileSize: 50 * 1024 * 1024
        },
        abortOnLimit: true
    }
));

// route handlers
app.use('/', require('./routes'));

// proxy configuration
app.set('trust proxy', true);

// start server
app.listen(8080, () => console.log('Server started on port 8080'));