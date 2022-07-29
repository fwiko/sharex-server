// dependencies
const sqlite3 = require('sqlite3').verbose();
const util = require('util');

const Helpers = require('./helpers');

// config
const config = require('../../../data/config');

// create and/or open database
let db = new sqlite3.Database('data/database.sqlite3', (err) => {
    if (err) throw err;
});

db.run = util.promisify(db.run);
db.get = util.promisify(db.get);

// create table if it doesn't exist
db.run(
    `CREATE TABLE IF NOT EXISTS AvailableFiles (
        "AccessCode"    TEXT NOT NULL UNIQUE,
        "FileName"      TEXT NOT NULL,
        "FileType"      TEXT NOT NULL,
        "FileFormat"    TEXT NOT NULL,
        "Height"        INTEGER,
        "Width"         INTEGER,
        
        PRIMARY KEY("AccessCode")
    );`
);

// query database for file record
const getFileRecord = async (accessCode) => {
    return await db.get(`SELECT * FROM AvailableFiles WHERE AccessCode = ?`, accessCode);
}

// insert file record into database
const addFileRecord = async (accessCode, fileName, fileType, fileFormat) => {
    await db.run(`INSERT INTO AvailableFiles (AccessCode, FileName, FileType, FileFormat) VALUES (?, ?, ?, ?)`, [accessCode, fileName, fileType, fileFormat]);
    return { accessCode };
}

// remove file record from database
const removeFileRecord = async (accessCode) => {
    await db.run(`DELETE FROM AvailableFiles WHERE AccessCode = ?`, accessCode);
}

// update resolution of image/video file record in database
const updateResolution = async (accessCode, width, height) => {
    await db.run(`UPDATE AvailableFiles SET Height = ?, Width = ? WHERE AccessCode = ?`, [height, width, accessCode])
};

// get new unique access code
const getNewAccessCode = async () => {
    const accessCode = Helpers.randomString(config.database.codeLength);
    return new Promise(async resolve => {
        await getFileRecord(accessCode)
            .then(async (fileRecord) => {
                if (fileRecord) {
                    resolve(await getNewAccessCode());
                } else {
                    resolve(accessCode);
                }
            })
    })
}

module.exports = {
    getFileRecord,
    addFileRecord,
    removeFileRecord,
    getNewAccessCode,
    updateResolution,
    getNewAccessCode
}