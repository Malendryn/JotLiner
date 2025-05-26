
// this file loads sqlite3 and opens the db, creating it as well if needed

import sqlite3 from "sqlite3";

import { fileURLToPath } from 'url';
import { dirname } from 'path';


async function dbUpdate(db, from, to) {
    if (from === 0) {       // first time ever updating
        
    }
}
export { dbUpdate };


updateDB = async (fromVersion) => {  // returns toVersion
        var version;

        const exists = await db.tableExists("extra")   // if 'extra' table doesnt yet exist, start currentVersion at 0
        if (!exists) {
            version = 0;
        } else {                                         // else we start the update process AFTER the current version
            version = await db.query("SELECT value from extra where key='dbVersion'");
            version = parseInt(version[0]["value"]);
        }

        if (toVersion <= version) {     // if the target version is less than the current version, just go home
            return;
        }
        if (fromVersion != version) {   // if the upgradeFrom version != current DB version, throw an error
            throw new Error(`DB Version is ${version}, FAILED request to upgrade from ${fromVersion} to ${toVersion}`)
        }

        await db.run("BEGIN TRANSACTION");
        try {
            await func();
            await db.run(`UPDATE extra set value='${toVersion}' where key='dbVersion'`);
            await db.run("COMMIT TRANSACTION");
        } catch (error) {
            await db.run("ROLLBACK TRANSACTION");
            throw error;
        }
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

BF.openDB = async function(dbName) {
    const db = await new DBHandler();
    await db.open(dbName + ".db");
    let sql;

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

