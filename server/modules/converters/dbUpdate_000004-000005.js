
/* update from 4 to 5
Here we're simply moving the 'name' field from docTree over to the doc table but we're gonna reconstruct the doc table
entirely in order to pre-prep it for the 5 to 6 update
so we will add fields dchList and bump, both of which we won't be using until 6
*/

async function updateDb(db) { 
    let sql;
    await db.run("ALTER TABLE doc ADD COLUMN name TEXT NOT NULL DEFAULT ''");
// since we will need to reconstrct doc from new and reorder version above uuid, we'll not bother
// to add these twe fields just yet
    // await db.run("ALTER TABLE doc ADD COLUMN dchList TEXT NOT NULL DEFAULT '[]'");
    // await db.run("ALTER TABLE doc ADD COLUMN bump INTEGER NOT NULL DEFAULT 0");

    sql = 
        "UPDATE doc"
      + " SET name = ("
      + "   SELECT docTree.name"
      + "   FROM docTree"
      + "   WHERE docTree.uuid = doc.uuid"
      + " )"
      + " WHERE EXISTS ("
      + "   SELECT 1"
      + "   FROM docTree"
      + "   WHERE docTree.uuid = doc.uuid"
      + " );";
    await db.run(sql);

    sql = "ALTER TABLE docTree RENAME TO docTree_orig";
    await db.run(sql);

    sql = 
    "CREATE TABLE docTree"
    + "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"  // id of entry in index table (used by parent)
    + ", uuid       TEXT    NOT NULL"            // uuid of entry in doc table
    + ", listOrder  INTEGER NOT NULL"            // ('order'=reserved word in sqlite3) 'display order' of recs in this table (when at same parent level)
    + ", parent     INTEGER NOT NULL"            // id of parent rec this is a child of, or '' if toplevel
    + ", bump       INTEGER NOT NULL DEFAULT 0"  // inc any time rec OR doc changes
    + ");"; // don't add 'WITHOUT ROWID' just to be more compatible/inline-with other SQL language derivatives
    await db.run(sql);

    sql =
        "INSERT INTO docTree (id, uuid, listOrder, parent, bump)"
      + "SELECT id, uuid, listOrder, parent, bump FROM docTree_orig;";
      await db.run(sql);

    sql = "DROP TABLE docTree_orig";
    await db.run(sql);
}
export { updateDb };
