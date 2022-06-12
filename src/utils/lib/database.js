// dependencies
const sqlite3 = require('sqlite3').verbose();
const util = require('util');

const Helpers = require('./helpers');

// create and/or open database
let db = new sqlite3.Database('db/database.sqlite3', (err) => {
    if (err) throw err;
    console.log('Connected to database');
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
const addFileRecord = async (fileName, fileType, fileFormat) => {
    const accessCode = await getNewAccessCode();
    await db.run(`INSERT INTO AvailableFiles (AccessCode, FileName, FileType, FileFormat) VALUES (?, ?, ?, ?)`, [accessCode, fileName, fileType, fileFormat], (err) => {
        if (err) throw err;
        console.log(`Added file record: ${accessCode} -> ${fileName}`);
    });
    return accessCode;
}

// remove file record from database
const removeFileRecord = async (accessCode) => {
    await db.run(`DELETE FROM AvailableFiles WHERE AccessCode = ?`, accessCode, (err) => {
        if (err) throw err;
        console.log(`Removed file record: ${accessCode}`);
    });
}

// update resolution of image/video file record in database
const updateResolution = async (accessCode, width, height) => {
    await db.run(`UPDATE AvailableFiles SET Height = ?, Width = ? WHERE AccessCode = ?`, [height, width, accessCode], (err) => {
        if (err) throw err;
        console.log(`Updated file resolution: ${accessCode} -> ${height}x${width}`);
    });
};

// get new unique access code
const getNewAccessCode = async () => {
    const accessCode = Helpers.randomString(6);
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
    updateResolution
}