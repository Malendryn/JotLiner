
import fs from "fs"; //'node:fs/promises'; <-- this works too
import path from "path";

function logPkt(name) {
    console.log("pkt=" + name);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.__classes.GetExtra.prototype.process = async function(client) {
    logPkt("GetExtra");
    this.txt = null;
    debugger; 
    if (!client.db) { return BF.fault("Database not selected"); }
    let tmp = await client.db.query("SELECT value FROM extra WHERE key=?", [this.txt]);
    if (tmp.length == 1) {
        this.txt = tmp[0].value;
    }
    return this;
}
WS.__classes.SetExtra.prototype.process = async function(client) {
    logPkt("SetExtra");
    if (!client.db) { return BF.fault("Database not selected"); }
    debugger; let tmp = await client.db.query("INSERT OR REPLACE INTO extra (key,value) VALUES(?,?)", [this.key, this.val]);
    return null;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.__classes.GetDCHList.prototype.process = async function(client) {
    logPkt("GetDCHList");
    const dirPath = path.join(BG.basePath, "client", "html", "modules", "DocComponentHandlers");
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
    const list = [];
    for (const file of files) {
        if (file.isDirectory()) {
            list.push(file.name);
        }
    }
    this.list = list;
    return this;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.__classes.GetDocTree.prototype.process = async function(client) {
    logPkt("GetDocTree");
    if (!client.db) { return BF.fault("Database not selected"); }
    this.list = [];
    this.list = await client.db.query("SELECT * from docTree order by parent,listOrder");
    return this;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.__classes.GetDoc.prototype.process = async function(client) { // must use 'function()' to have a 'this'   (not '() =>' )
    logPkt("GetDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    this.doc = null;
    const tmp = await client.db.query("SELECT content FROM doc WHERE uuid=?", [this.uuid]);
    if (tmp.length > 0) {
        this.doc = tmp[0].content;
    }
    return this;
}
WS.__classes.NewDoc.prototype.process = async function(client) {    // insert new doc into db,  return with nothing!
    logPkt("NewDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    try {
        await client.db.run("BEGIN TRANSACTION");
        let recs = await client.db.query("SELECT id,uuid,listOrder from docTree where parent=? order by listOrder", [this.dict.parent]);
        let idx, order = 0;
        for (idx = 0; idx < recs.length; idx++) {   // find listOrder # of 'after' rec (else get highest listOrder# in use at this parentLevel)
            const rec = recs[idx];
            order = rec.listOrder;          
            if (rec.uuid == this.dict.after) {
                break;
            }
        }
        order  += 1;     //our new listOrder number for this rec we're about to insert
        idx++;           //move PAST current rec! (harmless if ran off end)

        for (; idx < recs.length; idx++) {  // increment listOrder of all recs after the point we want to insert
            await client.db.run("UPDATE docTree SET listOrder = listOrder + 1 where id=?", [recs[idx].id]);   // increment existing rec's listorder's
        }

        let list = [this.dict.uuid, this.dict.version, this.dict.doc];
        await client.db.run("INSERT INTO doc (uuid,version,content) values (?,?,?)", list);               // insert the doc
        list = [this.dict.name, this.dict.uuid, order, this.dict.parent];
        await client.db.run("INSERT INTO docTree (name,uuid,listOrder,parent) values (?,?,?,?)", list);   // insert the index entry
        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.__classes["Fault"](err.message);
    }
    BF.onChanged(client.ws, {what:"docTree"});
    this.dict = {}; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendWait()
};
WS.__classes.SaveDoc.prototype.process = async function(client) {    // insert new doc into db,  return with a GetDocTree packet
    logPkt("SaveDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    try {
        await client.db.run("BEGIN TRANSACTION");
        let list = [this.dict.version, this.dict.doc, this.dict.uuid];
        await client.db.run("UPDATE doc SET version=?,content=? WHERE uuid=?", [list]);               // insert the doc
        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.__classes["Fault"](err.message);
    }
    BF.onChanged(client.ws, {what:"doc", uuid:this.dict.uuid});
    this.dict = {}; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendExpect()
};
WS.__classes.RenameDoc.prototype.process = async function(client) {    // rename a document
    logPkt("RenameDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    await client.db.run("BEGIN TRANSACTION");
    await client.db.run("UPDATE docTree SET name=? WHERE uuid=?", [this.dict.name, this.dict.uuid]);
    await client.db.run("COMMIT TRANSACTION");
    BF.onChanged(client.ws, {what: "docTree"});      // tell the world that the docTree changed!
    this.uuid = "";
    this.name = "";     // clear data so we don't waste bandwidth on the return
    return this;                            // send self back cuz client used .sendWait()
}
WS.__classes.DeleteDoc.prototype.process = async function(client) {    // insert new doc into db,  return with nothing!
    logPkt("DeleteDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    debugger; try {
        await client.db.run("BEGIN TRANSACTION");

        async function deleteRec(uuid) {
            let recs = await client.db.query("SELECT uuid from docTree where parent=?", [uuid]);
            for (let idx = 0; idx < recs.length; idx++) {
                await deleteRec(recs[idx].uuid);
            }
            recs = await client.db.query("SELECT listOrder,parent from docTree where uuid=?", [uuid]);
            let rec = recs[0];
            await client.db.run("DELETE FROM doc WHERE uuid=?", [uuid]);
            await client.db.run("DELETE FROM docTree WHERE uuid=?", [uuid]);
            await client.db.run("UPDATE docTree SET listOrder = listOrder - 1 WHERE parent = ? and listOrder > ?", [rec.parent, rec.listOrder]);
        }
        await deleteRec(this.uuid);

        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.__classes["Fault"](err.message);
    }
    BF.onChanged(client.ws, {what:"docTree"});      // tell the world that the docTree changed!
    this.uuid = ""; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendWait()
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.__classes.CreateDB.prototype.process = async function(client) {    // create new db, return null=good, text=errormsg
    logPkt("CreateDB");
    const err = BF.checkDBName(this.text);    // test filename for validity
    if (err) {                            // return it if bad
        this.text = err;
        return this;
    }

    await BF.releaseDB(client);              // close any currently open db on this client
    await BF.attachDB(this.text, client);

    BF.onChanged(client.ws, {what:"dbList"});      // tell the world that the dbList changed!

    this.text = null;

    return this;
};
WS.__classes.SelectDB.prototype.process = async function(client) {    // make other db current, return null=good, text=errormsg
    logPkt("SelectDB");
    const err = BF.checkDBName(this.text);    // test filename for validity
    if (err) {                                // return msg if bad
        this.text = err;
        return this;
    }

    let list = await BF.getDBList();                // check that db file actually exists
    if (!list.includes(this.text)) {
        this.text = "Database '" + this.text + "' does not exist";
        return this;
    }

    await BF.releaseDB(client);             // close any currently open db on this client
    await BF.attachDB(this.text, client);   // increment clientCount if already open, else open/create db

    this.text = null;
    return this;
};
WS.__classes.DeleteDB.prototype.process = async function(client) {    // delete /CURRENT/ db, return null=good, text=errormsg
    logPkt("DeleteDB");
    if (!client.db) { return BF.fault("Database not selected"); }
    const err = BF.checkDBName(this.text);    // test filename for validity
    if (err) {                            // return it if bad
        this.text = err;
        return this;
    }

// validate db is empty here, THEN...

    debugger; if (BF.openedDBs[client.dbName].clients > 1) {
        this.text = "Cannot delete DB while other clients are using it";
        return this;
    }
    await BF.releaseDB(client);      // close the db off the client so we can delete it

    client.db = null;
    
debugger; try {
        await client.db.run("BEGIN TRANSACTION");
//...
        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.__classes["Fault"](err.message);
    }

    BF.onChanged(client.ws, {what:"dbList"});      // tell the world that the dbList changed!

    this.text = null;
    return this;
}
WS.__classes.GetDBList.prototype.process = async function(client) {    // delete /CURRENT/ db, return null=good, text=errormsg
    logPkt("GetDBList");
    this.list = await BF.getDBList();
    return this;
};