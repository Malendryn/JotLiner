
// globally available functions to keep the main files cleaner  (BF stands for 'Backend Functions')

// BF.functions
// return---?snc? funcname-----------------Description-------------------------------------------------------
// ==== FROM index.js =================================================================================================
// module   async loadmodule(modulePath)   load and return module, if has an init(), call that before returning

// ==== FROM bem_core_Functions.js ====================================================================================
// --------       shutdown()               called before server exits entirely.  closes database and does other cleanup
// -------- async makeUUID()               make and return a UUID
// -------- async makeHash(txt)            convert txt into a one-way SHA-1 hash value and return it
// "txt"  =       checkDBName(name)        check for invalid characters and lengths; return string if bad, null if good
// [list] = async getDBList()              return list of databases 
// -------- async attachDB(dbName, client) open db if not already,  inc usercount, 
// -------- async detachDB(client)         decrement usercount, close&remove from BG.openedDBs accordingly

// ==== FROM bem_core_WSockHandler.js ====================================================================================
// --------       onChanged(table,uuid)    whenever any action changes a table, this function must get called


import path from 'path';
import fs from "fs";

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


BF.cmpVersion = function(first, second) { // return -1 if first < second,  0 if same, 1 if first > second
    const ea = first.split(".").map(Number);
    const eb = second.split(".").map(Number);
    while (ea.length < eb.length) { ea.push(0); }
    while (eb.length < ea.length) { eb.push(0); }
    let ct = (ea.length > eb.length) ? ea.length : eb.length;
    for (let idx = 0; idx < ct; idx++) {
        if (ea[idx] < eb[idx]) { return -1; }
        if (ea[idx] > eb[idx]) { return 1;  }
    }
    return 0;
}


BF.dump1 = function(u8a) {
    console.log(Array.from(u8a).map(byte => byte.toString(16).padStart(2, '0')).join(' '));
}

BF.dump2 = function(u8a) {
    let ss = "";
    for (let idx = 0; idx < u8a.byteLength; idx++) {
        if (idx % 16 == 0) {
            if (ss) {
                console.log(ss);
            }
            ss = idx.toString(16).padStart(4, '0') + " ";
        } 
        const byte = u8a[idx];
        ss += " " + byte.toString(16).padStart(2, '0') + String.fromCharCode(byte);
    }
    if (ss) {
        console.log(ss);
    }
}

BF.checkDBName = function(dbName) {
    if (dbName.length === 0) {    // Basic checks
        return "Database name cannot be empty";
    }

    // if (dbName.indexOf(".") != -1) {    // just makes other parsing easier if we don't have to worry about periods in the names
    //     return "Database name cannot contain periods";
    // }

    const badChars = /[<>:"/\\|?*\x00-\x1F]/g;  // Generally invalid chars for Windows, linux, mac
    if (badChars.test(dbName)) {
        return "Database name contains invalid characters";
    }

    if (/^\s|\s$/.test(dbName)) {
        return "Database name cannot begin or end with whitespace"

    }
    const reservedNames = [                     // Disallow Windows reserved dbNames (case-insensitive)
    "CON", "PRN", "AUX", "NUL",
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
    ];

    const baseName = dbName.split('.')[0].toUpperCase();
    if (reservedNames.includes(baseName)) {
        return "Database name cannot contain Windows-reserved words";
    }

    if (/[. ]$/.test(dbName)) {   // on Windows, can't end with space or dot
        return "Database name cannot end with a space or period";
    }

    if (dbName.length > 48) {    // Limit length: don't need/want rediculously long database names
        return "Database name cannot exceed 48 characters in length";
    }
    return null;
}


BF.getDBList = async function() {
    const dirPath = path.join(BG.basePath, "server", "db");
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const list = [];
    for (const file of files) {
        if (!file.name.endsWith(".db")) {                                   // skip names that don't end in .db
            continue;
        }
        list.push(file.name.substring(0, file.name.lastIndexOf(".db")));    // strip off the .db ending 
    }
    return list;
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


BF.detachDB = async function(client) {
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

