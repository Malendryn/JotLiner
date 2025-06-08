
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


async function iterCallback(db, rec) {
    let decoder = new DFDecoder(rec.content);
    let docContent = decoder.decode();

    const metaList = [];
    for (const dch of docContent.dchList) {
        let encoder = new DFEncoder();
        let tmp = encoder.encode(dch.data);         // encode only the plugin's data
        const list = [rec.id, dch.name, tmp, 0];
        let id = await db.run("INSERT INTO dchData (docId,name,content,bump) values (?,?,?,?)", list);

        dch.style.Z=0;             // stick 'Z' into the style block
        let meta = {
            I: id,
            S: dch.style,
            C: dch.children,
        };
        metaList.push(meta);
    }
// now we have to convert the meta.C from a #-of-children to the actual recId's in the dch table

    let idx = 0;
    function iter() {
        const meta = metaList[idx];
        let children = meta.C;          // change from the number captured above...
        meta.C = [];                    //...to a list of id's 
        while (children-- > 0) {        // and if there were any children...
            ++idx;
            meta.C.push(iter());        //...add them
        }
        return meta.I;  // return 'I'd as 'parent of consumed children' (for children-of-children consuming)
    }
    while (idx < metaList.length) {
        iter();
        ++idx;
    }

    await db.run("UPDATE doc set meta=? where id=?", [JSON.stringify(metaList), rec.id]);

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
if (1) {
    await db.run("ALTER TABLE doc ADD COLUMN meta TEXT NOT NULL DEFAULT '';");
    await db.run("ALTER TABLE doc ADD COLUMN bump INTEGER NOT NULL DEFAULT 0;");
    
    const sql = 
    "CREATE TABLE dchData"
    + "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"  // id of entry in index table (used by parent)
    + ", docId      INTEGER NOT NULL"            // ref back to id in doc table
    + ", name       TEXT    NOT NULL"            // BOX, TXA, etc...
    + ", content    BLOB    NOT NULL"            // content of dch exportData() as Uint8Array
    + ", bump       INTEGER NOT NULL"
    + ");";
    await db.run(sql);
}

if (1) {
    await db.iter("SELECT * FROM doc ORDER BY id", iterCallback);
}
}
export { updateDb };
