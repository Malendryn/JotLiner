
// this file loads better-sqlite3 and opens the db, creating it as well if needed

import path from "path";
import Database from "better-sqlite3";
// import fs from "fs"; //'node:fs/promises'; <-- this works too

class DBHandler {
    db = null;
    lastAccessed = 0;
    timeoutId = 0;
    dbName;

    //        async open(dbPath)              // create[if necessary], and open dbPath
    //              close()
    // stmt = async run(sql, params=[])       // returns Statement object, use stmt.lastID to get id of any newly inserted recs
    // rows = async query(sql, params=[])     // run an sql query and return rows[]
    // bool = async tableExists(tableName)    // return true/false
    //        async updateDb(array[])         // update DB by running a series of CREATE/UPDATE sql stmts

    open(dbName) {
        this.dbName = dbName;
        const dbPath = path.join(BG.serverPath, "db", this.dbName);
        this.db = new Database(dbPath, { fileMustExist: false });
        this.db.pragma("journal_mode = WAL");
        this.db.pragma("busy_timeout = 5000");
        this.lastAccessed = Date.now();

        // Optional: timeout logic for closing and reopening DB on inactivity
        /*
        const timeout = 15 * 60 * 1000; // 15 minutes
        this.timeoutId = setInterval(() => {
        const now = Date.now();
        if (now - this.lastAccessed > timeout) {
            console.log(`Reopening DB '${this.dbName}' due to inactivity...`);
            this.close();
            this.open(this.dbName);
        }
        }, 60 * 1000);
        */
    }


    close() {
        if (this.db) {
            if (this.timeoutId) {
                clearInterval(this.timeoutId);
            }
            this.db.close();
            this.db = null;
        }
    }


    run(sql, params = []) {                  // for INSERT, UPDATE or DELETE that has no RETURNING
        this.lastAccessed = Date.now();
        const stmt = this.db.prepare(sql);
        const info = stmt.run(...params);
        return info.lastInsertRowid || info.changes; // return insertedID if INSERT(autoinc) or rowcount of changes
    }


    get(sql, params = []) {                   // for UPDATE that has RETURNING (or any query expecting a single-row response)
        this.lastAccessed = Date.now();
        const stmt = this.db.prepare(sql);
        return stmt.get(...params);
    }


    query(sql, params = []) {                 // for SELECT Statements, (statements that return multiple rows)
        this.lastAccessed = Date.now();
        const stmt = this.db.prepare(sql);
        return stmt.all(...params);
    }


    tableExists(tableName) {
        const row = this.get("SELECT 1 FROM sqlite_master WHERE type='table' AND tbl_name=?;", [tableName]);
        return !!row;
    }


// works but fails if I try to add/mod/del recs in callback() 
// w/'Unhandled rejection: TypeError: This database connection is busy executing a query    '
// iter(sql, callback, params = []) {   
    //     this.lastAccessed = Date.now();
    //     const stmt = this.db.prepare(sql);
    //     const iterator = stmt.iterate(...params);

    //     for (const row of iterator) {
    //         const cont = callback(this, row);
    //         if (cont === false) {
    //             break;
    //         }
    //     }
    // }
    iter(sql, callback, params = []) {
        this.lastAccessed = Date.now();
        const stmt = this.db.prepare(sql);
        const rows = stmt.all(...params);

        for (const row of rows) {
            const cont = callback(this, row);
            if (cont === false) {
                break;
            }
        }
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
BF.openDB = async function(dbName) {
    const db = await new DBHandler();
    await db.open(dbName + ".db");

    const updaterPath = path.join(BG.serverPath, "modules/converters");
    // let flist = await fs.promises.readdir(updaterPath, { withFileTypes: true });    // fetch all the dbUpdate_######-######.js files...
    // let files = [];
    // for (const entry of flist) {
    //     files.push(entry.name);
    // }
    // files = files.filter(f => f.startsWith('dbUpdate_') && f.endsWith('.js')); // filter for only those named dbUpdate_.....js
    // files = files.sort();                                                            // and finally make sure they're properly ascii sorted lowest to highest

    let curVer = 0;
    if (await db.tableExists("extra")) {        // if 'extra' table exists fetch the dbVersion else leave at 0
        curVer = await db.query("SELECT value FROM extra WHERE key='dbVersion'");
        curVer = parseInt(curVer[0].value);
    }

    for (let fname of BG.converters) {     // iter through converter filenames
        if (!fname.startsWith("dbUpdate_")) {
            continue;
        }
        let tmp = fname.substring(9,22);   // strip 'dbUpdate_123456-654321.js' down to 123456-654321
        let [before,after] = tmp.split('-');
        before = parseInt(before);
        after = parseInt(after);
        if (before != curVer) {
            continue;
        }
        let mod = await BF.loadModule("./modules/converters/" + fname);    // load this module
        await db.run("BEGIN TRANSACTION");                                      // start transaction
        try {
            mod = await mod.updateDb(db);                                               // do the upgdate/upgrade
            curVer = after;
            await db.run(`UPDATE extra set value='${curVer}' where key='dbVersion'`);   // update the dbVersion to the 'after' value
            await db.run("COMMIT TRANSACTION");                             // commit!
        } catch (err) {
            await db.run("ROLLBACK TRANSACTION");
            throw err;
        }
    }
    return db;
}
