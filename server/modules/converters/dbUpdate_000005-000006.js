
/* update from 5 to 6
Change table:doc.content from text to blob

*/

async function iterCallback(db, rec) {
    let data = new TextEncoder().encode(rec.content);
    data = Buffer.from(data, 0, data.byteLength);

    const list = [
        rec.id,
        rec.version,
        rec.uuid,
        rec.name,
        data
    ];

    await db.run("INSERT INTO doc (id,version,uuid,name,content) VALUES (?,?,?,?,?)", list);
    return true;
}


async function updateDb(db) { 
    let sql;
    await db.run("ALTER TABLE doc RENAME TO doc_orig");

    sql = 
    "CREATE TABLE doc"
    + "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"  // id of entry in index table (used by parent)
    + ", version    TEXT    NOT NULL"
    + ", uuid       TEXT    NOT NULL"            // uuid of entry in doc table
    + ", name       TEXT    NOT NULL"
    + ", content    BLOB    NOT NULL"            // converting from text to blob
    + ");"; // don't add 'WITHOUT ROWID' just to be more compatible/inline-with other SQL language derivatives
    await db.run(sql);

    await db.iter("SELECT * FROM doc_orig ORDER BY id", iterCallback);

    sql = "DROP TABLE doc_orig";
    await db.run(sql);
}
export { updateDb };
