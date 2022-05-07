const config = {};

// settings related to the server
config.server = {
    port: 80,
    proxied: true
}

// settings related to uploaded files
config.files = {
    directory: 'uploads',
    maxSize: 500,
    disallowedFileTypes: []
}

// settings related to database file records
config.codes = {
    length: 6,
    characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
}

module.exports = config;