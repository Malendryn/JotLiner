
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

                    // const timeout = 15 * 60 * 1000;     // 15 minutes
                    // this.timeoutId = setInterval(() => {
                    //     const now = Date.now();
                    //     if (now - this.lastAccessed > timeout) {
                    //         console.log("Reopening DB '" + this.dbName + "' due to inactivity...");
                    //         this.close();
                    //         this.open(this.dbName);     // reopen same db as was opened to begin with
                    //     }
                    // }, 60 * 1000); // check every minute
                      
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

    iter = async (sql, callback, params = []) => {
        return new Promise((resolve, reject) => {
            this.lastAccessed = Date.now();
    
            const stmt = this.db.prepare(sql, params, (err) => {
                if (err) {
                    return reject(err);
                }
    
                const next = () => {
                    stmt.get(async (err, row) => {
                        this.lastAccessed = Date.now();
                        if (err) {
                            stmt.finalize(() => reject(err));
                            return;
                        }
    
                        if (!row) {
                            stmt.finalize((err) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            });
                            return;
                        }
    
                        const cont = await callback(this.db, row);
                        if (!cont) {
                            return resolve();
                        }
                        next();
                    });
                };
                next();
            });
        });
    };

    constructor() {
    }
};


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
            await db.query(`UPDATE extra set value='${curVer}' where key='dbVersion'`);   // update the dbVersion to the 'after' value
            await db.run("COMMIT TRANSACTION");                             // commit!
        } catch (err) {
            await db.run("ROLLBACK TRANSACTION");
            throw err;
        }
    }
    return db;
}
