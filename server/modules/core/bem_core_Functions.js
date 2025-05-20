
// globally available functions to keep the main files cleaner  (BF stands for 'Backend Functions')

// BF.functions
// return---?snc? funcname-----------------Description-------------------------------------------------------
// ==== FROM index.js =================================================================================================
// module   async loadmodule(modulePath)   load and return module, if has an init(), call that before returning

// ==== FROM bem_core_Functions.js ====================================================================================
// --------       shutdown()               called before server exits entirely.  closes database and does other cleanup
// -------- async makeUUID()               make and return a UUID
// -------- async makeHash(txt)            convert txt into a one-way SHA-1 hash value and return it
// "txt"  =       checkFilename(name)      check for invalid characters and lengths; return string if bad, null if good
// -------- async closeDB(dbName)          decrement usercount, close&remove from BG.openedDBs accordingly

// ==== FROM bem_core_WSockHandler.js ====================================================================================
// --------       onChanged(table,uuid)    whenever any action changes a table, this function must get called

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
BF.shutdown = () => {                       // program closing, do final terminations/cleanups before quitting
    debugger; if (BG.db) {
        // RSTODO if BG.db=open
        debugger; BG.db.close();
    }
}
process.on("exit",    () => { BF.shutdown(); });
process.on("SIGINT",  () => { process.exit(); });
process.on("SIGTERM", () => { process.exit(); });


export async function init() {
    const crypto = await import("crypto");

    BF.makeUUID = async () => {
        return crypto.randomUUID();
    }
    
    
    BF.makeHash = async (txt) => {
        return Array.from(
            new Uint8Array(
                await crypto.subtle.digest('SHA-1', new TextEncoder().encode(txt))
            ),
            (byte) => byte.toString(16).padStart(2, '0')
        ).join('');
    }
}


BF.checkFilename = function(filename) {
    if (filename.length === 0) {    // Basic checks
        return "Filename cannot be empty";
    }

    const badChars = /[<>:"/\\|?*\x00-\x1F]/g;    // Generally invalid chars for Windows, linux, mac
    if (badChars.test(filename)) {
        return "Filename contains invalid characters";
    }

    if (/^\s|\s$/.test(filename)) {
        return "Filename cannot begin or end with whitespace"

    }
    // Disallowed Windows reserved filenames (case-insensitive)
    const reservedNames = [
        "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
    ];

    const baseName = filename.split('.')[0].toUpperCase();
    if (reservedNames.includes(baseName)) {
        return "Filename cannot contain Windows-reserved words";
    }

    if (/[. ]$/.test(filename)) {   // on Windows, can't end with space or dot
        return "Filename cannot end with a space or period";
    }

    if (filename.length > 255) {    // Limit length: conservative max (NTFS supports 255 bytes, but safer to stay below)
        return "Filename cannot exceed 255 characters in length";
    }
    return null;
}


BF.attachDB = async function(dbName, client) {
    let odb = BG.openedDBs[dbName];    // see if this db is already connected
    if (odb) {
        ++odb.clients;      // increment # of clients using it
        client.dbName = dbName;
        client.db = odb.db;
        return;
    }
    const db = await BF.openDB(dbName);
    BG.openedDBs[dbName] = {
        db:      db,   // handle to the now-opened db
        clients: 1,     // how many connections have this db open
    };
    client.dbName = dbName;
    client.db = db;
}


BF.releaseDB = async function(client) {
    if (client) {
        if (client.dbName) {                                // test for null HERE so numerous caller's don't have to
            const dbEntry = BG.openedDBs[client.dbName];    // decrement usercount if already open
            if (dbEntry) {
                if (--dbEntry.clients == 0) {
                    await dbEntry.db.close();               // close and remove if reduced to zero
                    delete BG.openedDBs[client.dbName];
                    client.db = null;
                    client.dbName = null;
                }
            }
        }
    }
}

