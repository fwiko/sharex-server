const config = {};

// Settings related to the server
config.server = {
    port: 80,
    proxied: true,
    password_hash: process.env.PASSWORD_HASH
}

// Settings related to uploaded files
config.files = {
    directory: 'uploads',
    maxSize: 500,
    disallowedFileTypes: [],
    extensions: ['gif']
}

// Settings related to database file records
config.codes = {
    length: 6,
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
}

module.exports = config;