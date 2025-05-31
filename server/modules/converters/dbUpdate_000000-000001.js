async function updateDb(db) { // first update from 0 to 1 simply creates the extra table
    let sql =
    "CREATE TABLE extra"
    + "( id         INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT"
    + ", key        TEXT NOT NULL UNIQUE"
    + ", value      TEXT NOT NULL"
    + ")";
    await db.run(sql);                                                           // create table
    await db.run("INSERT INTO extra (key,value) values ('dbVersion', '0')");     // incremented for each .updateDB()
}
export { updateDb };
