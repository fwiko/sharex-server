// dependencies
const sqlite3 = require('sqlite3').verbose();

const Helpers = require('./helpers');

// create and/or open database
const db = new sqlite3.Database('database.db', (err) => {
    if (err) {
        console.error(err.message);
    }

    // create table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS AvailableFiles (
        "ID"	INTEGER NOT NULL UNIQUE,
        "AccessCode"	TEXT NOT NULL UNIQUE,
        "FileName"	TEXT NOT NULL,
        "FileType" TEXT NOT NULL,
        "Height"	INTEGER,
        "Width"	INTEGER,
        PRIMARY KEY("ID" AUTOINCREMENT)
    );`);
});

// query database for file record
const getFileRecord = async (accessCode) => {
    return new Promise(resolve => {
        db.get(`SELECT * FROM AvailableFiles WHERE AccessCode = ?`, accessCode, (err, row) => {
            if (err) throw err;
            resolve(row);
        })
    })
}

// insert file record into database
const addFileRecord = async (fileName, fileType) => {
    const accessCode = await getNewAccessCode();
    return new Promise(resolve => {
        db.run(`INSERT INTO AvailableFiles (AccessCode, FileName, FileType) VALUES (?, ?, ?)`, [accessCode, fileName, fileType], (err) => {
            if (err) throw err;
            console.log(`Added file record: ${accessCode} -> ${fileName}`);
            resolve({ accessCode, fileName });
        });
    });
}

// remove file record from database
const removeFileRecord = async (accessCode) => {
    return new Promise(resolve => {
        db.run(`DELETE FROM AvailableFiles WHERE AccessCode = ?`, accessCode, (err) => {
            if (err) throw err;
            console.log(`Removed file record: ${accessCode}`);
            resolve();
        });
    });
}

const updateFileResolution = async (accessCode, height, width) => {
    return new Promise(resolve => {
        db.run(`UPDATE AvailableFiles SET Height = ?, Width = ? WHERE AccessCode = ?`, [height, width, accessCode], (err) => {
            if (err) throw err;
            console.log(`Updated file resolution: ${accessCode} -> ${height}x${width}`);
            resolve();
        });
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
    updateFileResolution
}