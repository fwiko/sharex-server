// dependencies
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.db');
const config = require('../config');
const utility = require('./utility');

db.run(`CREATE TABLE IF NOT EXISTS AvailableFiles (
    "ID"	INTEGER NOT NULL UNIQUE,
    "AccessCode"	TEXT NOT NULL UNIQUE,
    "FilePath"	TEXT NOT NULL,
    PRIMARY KEY("ID" AUTOINCREMENT)
);`);

const database = {};

database.getFile = function (accessCode) {
    return new Promise(resolve => {
        db.get(`SELECT * FROM AvailableFiles WHERE AccessCode = ?`, accessCode, (err, row) => {
            if (err) throw err;
            resolve(row);
        });
    })
}

database.addFile = async function (filePath, _callback) {
    const accessCode = await database.getNewCode();
    return new Promise(resolve => {
        db.run(`INSERT INTO AvailableFiles (AccessCode, FilePath) VALUES (?, ?)`, [accessCode, filePath], (err) => {
            if (err) throw err;
            resolve({ accessCode, filePath });
        });
    });
}

database.getNewCode = function () {
    const code = utility.randomString(config.codes.length);
    return new Promise(async resolve => {
        await database.getFile(code)
            .then(async fileRecord => {
                if (fileRecord) {
                    resolve(await database.getNewCode());
                } else {
                    resolve(code);
                }
            })
    });
}

module.exports = database;