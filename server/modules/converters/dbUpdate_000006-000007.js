
/* update from 6 to 7

INTERIM step, only cloning data for now as we work through the update
1) create table 'dch'
2) add doc.dchList and doc.bump
3) keep using content AS IS storing whole doc as a single blob
3) ALSO break doc.content into components --> dch.children+dch.content
4) test 'new' method works flawlessly

once this is proven, 5) THEN remove doc.content column and this will no longer be interim 
*/

import { DFEncoder, DFDecoder } from "../../../client/html/public/classes/DFCoder.mjs";
import { DFDict } from "../../../client/html/public/classes/DFDict.mjs";

function iterCallback(db, rec) {
    let decoder = new DFDecoder(rec.content);
    let docContent;
    try {
        docContent = decoder.decode();
    }
    catch(err) {
        console.log(err.message);
        docContent = {dchList:[]};
    }

    const dict = new DFDict();
    for (const dch of docContent.dchList) {
        let encoder = new DFEncoder();
        let tmp = encoder.encode(dch.data);         // encode only the plugin's data
        const list = [rec.id, dch.name, tmp, 0];
        let id = db.run("INSERT INTO dch (docId,name,content,bump) values (?,?,?,?)", list);

        dch.style.Z=0;             // stick 'Z' into the style block
        let entry = {
            N: dch.name,     // stow name always so we can at least apply dch if importData/exportData fails
            S: dch.style,    // style taken from the OLD dch, for the NEW dcw
            C: dch.children,
        };
        dict.append(id, entry);
    }

    const flatTree = JSON.stringify(dict.export());
    db.run("UPDATE doc set dcwFlatTree=? where id=?", [flatTree, rec.id]);

    return true;

    // let data = new TextEncoder().encode(rec.content);
    // data = Buffer.from(data, 0, data.byteLength);

    // const list = [
    //     rec.id,
    //     rec.version,
    //     rec.uuid,
    //     rec.name,
    //     data
    // ];

    // await db.run("INSERT INTO doc (id,version,uuid,name,content) VALUES (?,?,?,?,?)", list);
    return true;
}

async function updateDb(db) { 
    await db.run("ALTER TABLE doc DROP COLUMN version;");
    await db.run("ALTER TABLE doc ADD COLUMN dcwFlatTree TEXT NOT NULL DEFAULT '';");
    await db.run("ALTER TABLE doc ADD COLUMN bump INTEGER NOT NULL DEFAULT 0;");
    
    const sql = 
    "CREATE TABLE dch"
    + "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"  // id of entry in index table (used by parent)
    + ", docId      INTEGER NOT NULL"            // ref back to id in doc table
    + ", name       TEXT    NOT NULL"            // BOX, TXA, etc...
    + ", content    BLOB    NOT NULL"            // content of dch exportData() as Uint8Array
    + ", bump       INTEGER NOT NULL"
    + ");";
    await db.run(sql);
    await db.iter("SELECT * FROM doc ORDER BY id", iterCallback);
}
export { updateDb };
