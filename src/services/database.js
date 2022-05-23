// Dependencies
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('data/database.db');

const config = require('../configs/config');
const helpers = require('../utils/helpers');

// Create database tables if they do not exist
db.run(`CREATE TABLE IF NOT EXISTS AvailableFiles (
    "ID"	INTEGER NOT NULL UNIQUE,
    "AccessCode"	TEXT NOT NULL UNIQUE,
    "FilePath"	TEXT NOT NULL,
    PRIMARY KEY("ID" AUTOINCREMENT)
);`);

const database = {};

// Retreive a file record
database.getFile = function (accessCode) {
    return new Promise(resolve => {
        db.get(`SELECT * FROM AvailableFiles WHERE AccessCode = ?`, accessCode, (err, row) => {
            if (err) throw err;
            resolve(row);
        });
    });
}

// Add a new file record
database.addFileRecord = async function (filePath) {
    const accessCode = await database.getNewCode();
    return new Promise(resolve => {
        db.run(`INSERT INTO AvailableFiles (AccessCode, FilePath) VALUES (?, ?)`, [accessCode, filePath], (err) => {
            if (err) throw err;
            console.log(`Added file ${filePath} with access code ${accessCode}`);
            resolve({ accessCode, filePath });
        });
    });
}

// Remove a file record
database.removeFileRecord = function (accessCode) {
    return new Promise(resolve => {
        db.run(`DELETE FROM AvailableFiles WHERE AccessCode = ?`, accessCode, (err) => {
            if (err) throw err;
            console.log(`Removed file ${filePath} with access code ${accessCode}`);
            resolve();
        });
    });
}

// Generate a unique identifier
database.getNewCode = function () {
    const code = helpers.randomString(config.codes.length);
    return new Promise(async resolve => {
        await database.getFile(code)
            .then(async fileRecord => {
                if (fileRecord) {
                    resolve(await database.getNewCode());
                } else {
                    resolve(code);
                }
            });
    });
}

module.exports = database;