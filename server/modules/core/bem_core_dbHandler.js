
// this file loads sqlite3 and opens the db, creating it as well if needed

import path from "path";
import sqlite3 from "sqlite3";
import fs from "fs";


class DBHandler {
    db = null;

    //        async open(dbPath)              // create[if necessary], and open dbPath
    //              close()
    // stmt = async run(sql, params=[])       // returns Statement object, use stmt.lastID to get id of any newly inserted recs
    // rows = async query(sql, params=[])     // run an sql query and return rows[]
    // bool = async tableExists(tableName)    // return true/false
    //        async updateDb(array[])         // update DB by running a series of CREATE/UPDATE sql stmts


    open = async (dbName) => {
        return new Promise((resolve, reject) => {
            let dbPath = path.join(BG.serverPath, "db", dbName);
            this.db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
                if (err) {
                    reject(err);
                    return;
                } else {
                    resolve();
                    return;
                }
            });
        });
    }


    close = () => {
        debugger; if (this.db) {
            this.db.close();
            this.db = null;
        }
    }


    run = async (sql, params = []) => {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(sql, params, function (err) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve(this);      // returns Statement object, use retval.lastID to get id of any newly inserted recs
                    return;
                });
            })
        });
    }


    query = async (sql, params = []) => {
        return new Promise((resolve, reject) => {
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


    updateDB = async (fromVersion, toVersion, func) => {
        var version;

        const exists = await this.tableExists("extra")   // if 'extra' table doesnt yet exist, start currentVersion at 0
        if (!exists) {
            version = 0;
        } else {                                         // else we start the update process AFTER the current version
            version = await this.query("SELECT value from extra where key='dbVersion'");
            version = parseInt(version[0]["value"]);
        }

        if (toVersion <= version) {     // if the target version is less than the current version, just go home
            return;
        }
        if (fromVersion != version) {   // if the upgradeFrom version != current DB version, throw an error
            throw new Error(`DB Version is ${version}, request to upgrade from ${fromVersion} to ${toVersion} failed`)
        }

        await this.run("BEGIN TRANSACTION");
        try {
            await func();
            await this.run(`UPDATE extra set value='${toVersion}' where key='dbVersion'`);
            await this.run("COMMIT TRANSACTION");
        } catch (error) {
            await this.run("ROLLBACK TRANSACTION");
            throw error;
        }
    }

    constructor() {
    }
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
export async function init() {
    BG.db = await new DBHandler();
    await BG.db.open("backend.db");
    let sql;

    await BG.db.updateDB(0, 1, async() => {  // update 0=>1, create extra table ONLY and add extra:dbVersion=0
        sql =
"CREATE TABLE extra"
+ "( key        TEXT NOT NULL PRIMARY KEY"
+ ", value      TEXT NOT NULL"
+ ") WITHOUT ROWID;";
        await BG.db.run(sql);                                                           // create table
        await BG.db.run("INSERT INTO extra (key,value) values ('dbVersion', '0')");     // set initial value to '0'
    }); // ************************************************************************************************************
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    await BG.db.updateDB(1, 2, async() => {  // update 1=>2, create index and doc tables
        sql = 
"CREATE TABLE docList"  // cuz 'index' is a reserved word in SQLite3
+ "( id         INTEGER NOT NULL PRIMARY KEY"  // id of entry in index table (used by parent)
+ ", name       TEXT    NOT NULL"  // name of entry in index table
+ ", docId      TEXT    NOT NULL"  // uuid of entry in doc table
+ ", listOrder  INTEGER NOT NULL"  // ('order'=reserved word in sqlite3) 'display order' of recs in this table (when at same parent level)
+ ", parent     INTEGER NOT NULL"  // id of parent rec this is a child of
+ ");"; // don't add 'WITHOUT ROWID' just to be more compatible/inline-with other SQL language derivatives
        await BG.db.run(sql);
    }); // ************************************************************************************************************
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    await BG.db.updateDB(2, 3, async() => {  // update 2=>3, create index and doc tables
        sql = 
"CREATE TABLE doc"
+ "( uuid        TEXT    NOT NULL UNIQUE"  //UUID of doc
+ ", version     TEXT    NOT NULL"         //"n.n" major.minor version of doc (for auto-upgrade when loaded)
+ ", content     TEXT    NOT NULL"         // textified 'exported' doc body
+ ");";
        await BG.db.run(sql);
    }); // ************************************************************************************************************


}   

