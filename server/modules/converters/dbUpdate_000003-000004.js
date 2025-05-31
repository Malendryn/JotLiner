
/* update from 3 to 4
we're replacing the entire docTree table, in orter to change 'parent' from a TEXT uuid to an INTEGER id
and while we're at it, add a 'bump' INTEGER field at the bottom

*/

async function updateDb(db) { 
    let sql;
    sql = "ALTER TABLE docTree RENAME TO docTree_orig";
    await db.run(sql);

    sql = 
    "CREATE TABLE docTree"
    + "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"  // id of entry in index table (used by parent)
    + ", name       TEXT    NOT NULL"            // name of entry in index table
    + ", uuid       TEXT    NOT NULL"            // uuid of entry in doc table
    + ", listOrder  INTEGER NOT NULL"            // ('order'=reserved word in sqlite3) 'display order' of recs in this table (when at same parent level)
    + ", parent     INTEGER NOT NULL"            // id of parent rec this is a child of, or '' if toplevel
    + ", bump       INTEGER NOT NULL DEFAULT 0"  // inc any time rec OR doc changes
    + ");"; // don't add 'WITHOUT ROWID' just to be more compatible/inline-with other SQL language derivatives
    await db.run(sql);

// now copy all data from the _orig table into the new table, replacing what was parent=TEXT --> uuid with parent=INTEGER --> id
    sql =
    "INSERT INTO docTree (id, name, uuid, listOrder, parent)"
    + " SELECT"
    + "   o.id,"
    + "   o.name,"
    + "   o.uuid,"
    + "   o.listOrder,"
    + "   IFNULL(p.id, 0)"  // the id of the parent, found by matching the uuid, or 0 if no parent
    + " FROM"
    + "   docTree_orig o"
    + " LEFT JOIN"
    + "   docTree_orig p on o.parent = p.uuid;"
    await db.run(sql);

    sql = "DROP TABLE docTree_orig";
    await db.run(sql);
}
export { updateDb };
