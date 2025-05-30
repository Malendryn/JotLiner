
/* update from 6 to 7
    Now that all packets and all table:doc.content are converted to Uint8Array, we need to walk through all
    doc records and upgrade them accordingly.
    (as we are now handling all validation/upgrade on serverside instead of clientside)
*/

async function callback(db, rec) {
    let dict = {
        version: rec.version,   // OVERWRITTEN by exploder (for v1.0 and 1.1 only)
        // uuid:    rec.uuid,   // ignored for exploding ONLY WHILE UPDATING (IS  populated by exploder)
        // name:    rec.name,   // ignored for exploding ONLY WHILE UPDATING (NOT populated by exploder)
        doc:     rec.content,
    };

    dict = await BF.docExploder(dict);
    if (dict.error) {       // if conversion fails, doc is borked, MUST remove it! (SHOULD never happen!)
        console.error("Conversion error: " + dict.error);
        console.error("removing entry from database");
        await db.run("DELETE from doc where uuid=?", [rec.uuid]);
        await db.run("DELETE from docTree where uuid=?", [rec.uuid]);
        return true;
    }
    delete dict.version;
    delete dict.uuid;       // with uuid not present, tells DocExporter to NOT include @n.n;
    delete dict.name;

    const exporter = new BF.DocExporter();
    let   content = await exporter.export(dict);

    if (dict.updated) {
        content = Buffer.from(content, 0, content.byteLength);  // convert Uint8Array to Buffer() cuz sqlite3
        const list = [
            "2.0",
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
