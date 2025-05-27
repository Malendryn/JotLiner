
// this file loads sqlite3 and opens the db, creating it as well if needed

import path from "path";
import sqlite3 from "sqlite3";
import fs from "fs"; //'node:fs/promises'; <-- this works too


class DBHandler {
    db = null;
    lastAccessed;
    timeoutId = 0;
    dbName;
    //        async open(dbPath)              // create[if necessary], and open dbPath
    //              close()
    // stmt = async run(sql, params=[])       // returns Statement object, use stmt.lastID to get id of any newly inserted recs
    // rows = async query(sql, params=[])     // run an sql query and return rows[]
    // bool = async tableExists(tableName)    // return true/false
    //        async updateDb(array[])         // update DB by running a series of CREATE/UPDATE sql stmts


    open = async (dbName) => {
        this.dbName = dbName;
        return new Promise((resolve, reject) => {
            let dbPath = path.join(BG.serverPath, "db", this.dbName);
            this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    reject(err);
                    return;
                } else {
                    this.db.configure('busyTimeout', 5000);  // wait up to 5 seconds before throwing SQLITE_BUSY
                    this.lastAccessed = Date.now();

                    const timeout = 15 * 60 * 1000;     // 15 minutes
                    this.timeoutId = setInterval(() => {
                        const now = Date.now();
                        if (now - this.lastAccessed > timeout) {
                            console.log("Reopening DB '" + this.dbName + "' due to inactivity...");
                            this.close();
                            this.open(this.dbName);     // reopen same db as was opened to begin with
                        }
                    }, 60 * 1000); // check every minute
                      
                    resolve();
                    return;
                }
            });
        });
    }


    close = () => {
        if (this.db) {
            if (this.timeoutId) {
                clearInterval(this.timeoutId);
            }
            this.db.close();
            this.db = null;
        }
    }


    // run = async (sql, params = []) => {
    //     return new Promise(async (resolve, reject) => {
    //         this.lastAccessed = Date.now();
    //         let lastId = 0;
    //         this.db.serialize(async () => {
    //             let stmt;
    //             try {
    //                 stmt = await this.db.prepare(sql);
    //                 // const row = stmt.get(1);
    //                 // console.log(row)

    //                 await stmt.run(...params, function (err) {    // warning! some statements simply crash and exit, unable to try/catch!
    //                     if (err) {
    //                         reject(err.message);
    //                         return;
    //                     }
    //                     lastId = this.lastID;
    //                 });
    //                 await stmt.finalize();
    //             }
    //             catch (err) {
    //                 console.log(err.message);
    //                 reject(err.message);
    //                 return;
    //             }
    //         })
    //         resolve(lastId)
    //     });
    // }

    run = async (sql, params = []) => {
        this.lastAccessed = Date.now();
    
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                const stmt = this.db.prepare(sql, (err) => {
                    if (err) {
                        reject(err.message);
                        return;
                    }
    
                    stmt.run(...params, function (err) {
                        if (err) {
                            reject(err.message);
                            return;
                        }
    
                        const lastId = this.lastID;
    
                        stmt.finalize((err) => {
                            if (err) {
                                reject(err.message);
                                return;
                            }
                            resolve(lastId);
                        });
                    });
                });
            });
        });
    }

    query = async (sql, params = []) => {
        return new Promise((resolve, reject) => {
            this.lastAccessed = Date.now();
            this.db.serialize(() => {
                this.db.all(sql, params, (err, rows) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(rows);
                    return;
                });
            });
        });
    }


    tableExists = async (tableName) => {
        const rows = await this.query("SELECT tbl_name FROM sqlite_master WHERE type='table' AND tbl_name=?;", [tableName]);
        return rows.length > 0;
    }


    // updateDB = async (fromVersion, toVersion, func) => {
    //     var version;

    //     const exists = await this.tableExists("extra")   // if 'extra' table doesnt yet exist, start currentVersion at 0
    //     if (!exists) {
    //         version = 0;
    //     } else {                                         // else we start the update process AFTER the current version
    //         version = await this.query("SELECT value from extra where key='dbVersion'");
    //         version = parseInt(version[0]["value"]);
    //     }

    //     if (toVersion <= version) {     // if the target version is less than the current version, just go home
    //         return;
    //     }
    //     if (fromVersion != version) {   // if the upgradeFrom version != current DB version, throw an error
    //         throw new Error(`DB Version is ${version}, FAILED request to upgrade from ${fromVersion} to ${toVersion}`)
    //     }

    //     await this.run("BEGIN TRANSACTION");
    //     try {
    //         await func();
    //         await this.run(`UPDATE extra set value='${toVersion}' where key='dbVersion'`);
    //         await this.run("COMMIT TRANSACTION");
    //     } catch (error) {
    //         await this.run("ROLLBACK TRANSACTION");
    //         throw error;
    //     }
    // }

    constructor() {
    }
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
BF.openDB = async function(dbName) {
    const db = await new DBHandler();
    await db.open(dbName + ".db");

    const updaterPath = path.join(BG.basePath, "server/modules/core/dbUpdaters");
    let flist = await fs.promises.readdir(updaterPath, { withFileTypes: true });    // fetch all the dbUpdate_######-######.js files...
    let files = [];
    for (const entry of flist) {
        files.push(entry.name);
    }
    files = files.filter(f => f.startsWith('dbUpdate_') && f.endsWith('.js')); // filter for only those named dbUpdate_.....js
    files = files.sort();                                                            // and finally make sure they're properly ascii sorted lowest to highest


    let curVer = 0;
    if (await db.tableExists("extra")) {        // if 'extra' table exists fetch the dbVersion else leave at 0
        curVer = await db.query("SELECT value FROM extra WHERE key='dbVersion'");
        curVer = parseInt(curVer[0].value);
    }

    for (let fname of files) {                  // iter through filenames
        let tmp = fname.substring(9,22);   // strip 'dbUpdate_123456-654321.js' down to 123456-654321
        // let from,to;
        let [from,to] = tmp.split('-');
        from = parseInt(from);
        to = parseInt(to);
        if (from < curVer) {            // skipover already-done updaters
            continue;
        }
        if (from != curVer) {
            throw new Error(`DB update aborted, no updater found to update from version ${curVer}`);
        }
        let mod = await BF.loadModule("./modules/core/dbUpdaters/" + fname);    // load this module
        await db.run("BEGIN TRANSACTION");                                      // start transaction
        try {
            mod = await mod.updateDb(db);                                               // do the upgdate/upgrade
            curVer = to;
            await db.query(`UPDATE extra set value='${curVer}' where key='dbVersion'`);   // update the dbVersion to the 'to' value
            await db.run("COMMIT TRANSACTION");                             // commit!
        } catch (err) {
            await db.run("ROLLBACK TRANSACTION");
            throw err;
        }
    }
    return db;
}



/*
    await db.updateDB(0, 1, async() => {  // update 0=>1, create extra table ONLY and add extra:dbVersion=0
        sql =
"CREATE TABLE extra"
+ "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"
+ ", key        TEXT NOT NULL UNIQUE"
+ ", value      TEXT NOT NULL"
+ ")";
        await db.run(sql);                                                           // create table
        await db.run("INSERT INTO extra (key,value) values ('dbVersion', '0')");     // incremented for each .updateDB()
    }); // ************************************************************************************************************
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    await db.updateDB(1, 2, async() => {  // update 1=>2, create index and doc tables
        sql = 
"CREATE TABLE docTree"
+ "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"  // id of entry in index table (used by parent)
+ ", name       TEXT    NOT NULL"  // name of entry in index table
+ ", uuid       TEXT    NOT NULL"  // uuid of entry in doc table
+ ", listOrder  INTEGER NOT NULL"  // ('order'=reserved word in sqlite3) 'display order' of recs in this table (when at same parent level)
+ ", parent     TEXT    NOT NULL"  // uuid of parent rec this is a child of, or '' if toplevel
+ ");"; // don't add 'WITHOUT ROWID' just to be more compatible/inline-with other SQL language derivatives
        await db.run(sql);
    }); // ************************************************************************************************************
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    await db.updateDB(2, 3, async() => {  // update 2=>3, create index and doc tables
        sql = 
"CREATE TABLE doc"
+ "( id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"
+ ", uuid        TEXT    NOT NULL UNIQUE"  //UUID of doc
+ ", version     TEXT    NOT NULL"         //"n.n" major.minor version of doc (for auto-upgrade when loaded)
+ ", content     TEXT    NOT NULL"         // textified 'exported' doc body
+ ");";
        await db.run(sql);
    }); // ************************************************************************************************************
    return db;
}   

// BF.openDB = async function(dbName) {
//     const db = await new DBHandler();
//     await db.open(dbName + ".db");
//     let sql;

//     await db.updateDB(0, 1, async() => {  // update 0=>1, create extra table ONLY and add extra:dbVersion=0
//         sql =
// "CREATE TABLE extra"
// + "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"
// + ", key        TEXT NOT NULL UNIQUE"
// + ", value      TEXT NOT NULL"
// + ")";
//         await db.run(sql);                                                           // create table
//         await db.run("INSERT INTO extra (key,value) values ('dbVersion', '0')");     // incremented for each .updateDB()
//     }); // ************************************************************************************************************
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     await db.updateDB(1, 2, async() => {  // update 1=>2, create index and doc tables
//         sql = 
// "CREATE TABLE docTree"
// + "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"  // id of entry in index table (used by parent)
// + ", name       TEXT    NOT NULL"  // name of entry in index table
// + ", uuid       TEXT    NOT NULL"  // uuid of entry in doc table
// + ", listOrder  INTEGER NOT NULL"  // ('order'=reserved word in sqlite3) 'display order' of recs in this table (when at same parent level)
// + ", parent     TEXT    NOT NULL"  // uuid of parent rec this is a child of, or '' if toplevel
// + ");"; // don't add 'WITHOUT ROWID' just to be more compatible/inline-with other SQL language derivatives
//         await db.run(sql);
//     }); // ************************************************************************************************************
// ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     await db.updateDB(2, 3, async() => {  // update 2=>3, create index and doc tables
//         sql = 
// "CREATE TABLE doc"
// + "( id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"
// + ", uuid        TEXT    NOT NULL UNIQUE"  //UUID of doc
// + ", version     TEXT    NOT NULL"         //"n.n" major.minor version of doc (for auto-upgrade when loaded)
// + ", content     TEXT    NOT NULL"         // textified 'exported' doc body
// + ");";
//         await db.run(sql);
//     }); // ************************************************************************************************************
//     return db;
// }   

*/