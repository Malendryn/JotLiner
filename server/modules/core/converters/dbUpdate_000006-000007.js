
/* update from 6 to 7
    Now that all packets and all table:doc.content are converted to Uint8Array, we need to walk through all
    doc records and upgrade them accordingly.
    (as we are now handling all validation/upgrade on serverside instead of clientside)
*/

async function callback(db, rec) {
    let dict = {
        version: rec.version,   // passed in BECAUSE doc-from-dbTable doesnt have header ('@n.n;') in versions 2.0 and above
        doc:     rec.content,   // raw content straight from dbTable
    };

    dict = await BF.docExploder(dict);
    if (dict.error) {       // if conversion fails, doc is borked, MUST remove it! (SHOULD never happen!)
        console.error("Conversion error: " + dict.error);
        console.error("removing entry from database");
        await db.run("DELETE from doc where uuid=?", [rec.uuid]);
        await db.run("DELETE from docTree where uuid=?", [rec.uuid]);
        return true;
    }

    if (dict.upgraded) {    // if exloder says was upgraded from a prior version, reinsert into database
        delete dict.uuid;    // with uuid not present, (NOT version, uuid!) tell DocExporter to NOT include @n.n; or uuid or name
        const exporter = new BF.DocExporter();
        let   content = await exporter.export(dict);

        content = Buffer.from(content, 0, content.byteLength);  // convert Uint8Array to Buffer() cuz sqlite3
        const list = [
            "2.0",      // hardcoded here cuz this is a oneshot upgrade specifically to 2.0
            content,
            rec.id
        ];
        await db.run("UPDATE doc SET version=?,content=? WHERE id=?", list);
    }
    return true;
}



async function updateDb(db) { 
    let sql;
    await db.iter("select * from doc", callback);
}
export { updateDb };
