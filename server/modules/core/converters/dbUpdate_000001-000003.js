async function updateDb(db) { // update from 1 to 3 creates the doc and docinfo tables
    let sql = 
    "CREATE TABLE doc"
    + "( id          INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"
    + ", uuid        TEXT    NOT NULL UNIQUE"  //UUID of doc
    + ", version     TEXT    NOT NULL"         //"n.n" major.minor version of doc (for auto-upgrade when loaded)
    + ", content     TEXT    NOT NULL"         // textified 'exported' doc body
    + ");";
    await db.run(sql);

    sql = 
    "CREATE TABLE docTree"
    + "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"  // id of entry in index table (used by parent)
    + ", name       TEXT    NOT NULL"  // name of entry in index table
    + ", uuid       TEXT    NOT NULL"  // uuid of entry in doc table
    + ", listOrder  INTEGER NOT NULL"  // ('order'=reserved word in sqlite3) 'display order' of recs in this table (when at same parent level)
    + ", parent     TEXT    NOT NULL"  // uuid of parent rec this is a child of, or '' if toplevel
    + ");"; // don't add 'WITHOUT ROWID' just to be more compatible/inline-with other SQL language derivatives
    await db.run(sql);
}
export { updateDb };
