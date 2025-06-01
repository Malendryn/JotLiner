
import fs from "fs"; //'node:fs/promises'; <-- this works too
import path from "path";

import { DFEncoder, DFDecoder } from "../../../client/html/modules/shared/DFCoder.mjs";

//debugger; // only way to break during module load, brkpoints don't cut it!
function logPkt(name) {
//    console.log("pkt=" + name);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.GetBackendInfo.prototype.process = async function(client) {
    logPkt("GetBackendInfo");
    this.version = BG.VERSION;
    this.docVersion = BG.DOCVERSION;
    return this;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.GetExtra.prototype.process = async function(client) {
    logPkt("GetExtra");
    this.txt = null;
    if (!client.db) { return BF.fault("Database not selected"); }
    let tmp = await client.db.query("SELECT value FROM extra WHERE key=?", [this.key]);
    delete this.key;

    if (tmp.length == 1) {
        this.val = tmp[0].value;
    }
    return this;
}
WS.classes.SetExtra.prototype.process = async function(client) {
    logPkt("SetExtra");
    if (!client.db) { return BF.fault("Database not selected"); }
    let tmp = await client.db.query("INSERT OR REPLACE INTO extra (key,value) VALUES(?,?)", [this.key, this.val]);
    return null;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.GetDCHList.prototype.process = async function(client) {
    logPkt("GetDCHList");
    const dirPath = path.join(BG.basePath, "client", "html", "modules", "DocComponentHandlers");
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
    const list = [];
    for (const file of files) {
        if (file.isDirectory()) {
            const name = file.name;
            if (name.length >= 3) {
                if (/^(?!_)[A-Z0-9_]+$/.test(name)) {  // allowOnly all-uppercase, nums+letters+'_' only, doesnt start with '_'
                    list.push(name);
                }
            }
        }
    }
    this.list = list;
    return this;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.GetDocTree.prototype.process = async function(client) {
    logPkt("GetDocTree");
    if (!client.db) { return BF.fault("Database not selected"); }
    // this.list = await client.db.query("SELECT * from docTree order by parent,listOrder");
    let sql = "SELECT docTree.*, doc.name FROM docTree"
            + " JOIN doc ON docTree.uuid = doc.uuid"
            + " ORDER BY parent,listOrder;";
    this.list = await client.db.query(sql);
    return this;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.GetDoc.prototype.process = async function(client) { // must use 'function()' to have a 'this'   (not '() =>' )
    logPkt("GetDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    this.doc = null;
    const tmp = await client.db.query("SELECT version,content FROM doc WHERE uuid=?", [this.uuid]);
    if (tmp.length > 0) {
        this.ver = tmp[0].version;
        this.doc = tmp[0].content;
    }
    return this;    // {uuid:"...", doc:{ dchList:[{children:1, name:"BOX", style:{T,R,B,L}, data:{zX,zY}}]}}
}
WS.classes.NewDoc.prototype.process = async function(client) {    // this.dict={name,uuid,after,parent,u8aDoc}
    logPkt("NewDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    try {
        await client.db.run("BEGIN TRANSACTION");
        let recs = await client.db.query("SELECT id,uuid,listOrder from docTree where parent=? order by listOrder", [this.dict.parent]);
        let idx, order = 0;
        for (idx = 0; idx < recs.length; idx++) {   // find listOrder # of 'after' rec (else get highest listOrder# in use at this parentLevel)
            const rec = recs[idx];
            order = rec.listOrder;          
            if (rec.id == this.dict.after) {
                break;
            }
        }
        order  += 1;     //our new listOrder number for this rec we're about to insert
        idx++;           //move PAST current rec! (harmless if ran off end)

        for (; idx < recs.length; idx++) {  // increment listOrder of all recs after the point we want to insert
            await client.db.run("UPDATE docTree SET listOrder = listOrder + 1 where id=?", [recs[idx].id]);   // increment existing rec's listorder's
        }

        let list = [BG.DOCVERSION, this.dict.uuid, this.dict.name, this.dict.doc];
        this.docId = await client.db.run("INSERT INTO doc (version,uuid,name,content) values (?,?,?,?)", list);     // insert doc
        list = [this.dict.uuid, order, this.dict.parent];
        this.docTreeId = await client.db.run("INSERT INTO docTree (uuid,listOrder,parent) values (?,?,?)", list);   // insert index entry
        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.classes["Fault"](err.message);
    }
    BF.onChanged(client.ws, {what:"docTree"});
    this.dict = {}; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendWait() (and we added docId and docTreeId to the class on return)
};
WS.classes.SaveDoc.prototype.process = async function(client) {    // this.dict={uuid, doc(u8a)}
    logPkt("SaveDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    try {
        await client.db.run("BEGIN TRANSACTION");
        let list = [BG.DOCVERSION, this.dict.doc, this.dict.uuid];
        await client.db.run("UPDATE doc SET version=?,content=? WHERE uuid=?", [list]);               // insert the doc
        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.classes["Fault"](err.message);
    }
    BF.onChanged(client.ws, {what:"doc", uuid:this.dict.uuid});
    this.dict = {}; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendExpect()
};
WS.classes.RenameDoc.prototype.process = async function(client) {    // rename a document
    logPkt("RenameDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    await client.db.run("BEGIN TRANSACTION");
    await client.db.run("UPDATE doc SET name=? WHERE uuid=?", [this.dict.name, this.dict.uuid]);
    await client.db.run("COMMIT TRANSACTION");
    BF.onChanged(client.ws, {what: "docTree"});      // tell the world that the docTree changed!
    this.uuid = "";
    this.name = "";     // clear data so we don't waste bandwidth on the return
    return this;                            // send self back cuz client used .sendWait()
}
WS.classes.DeleteDoc.prototype.process = async function(client) {    // insert new doc into db,  return with nothing!
    logPkt("DeleteDoc");
    if (!client.db) { return BF.fault("Database not selected"); }
    try {
        await client.db.run("BEGIN TRANSACTION");

        async function deleteRec(rootId) {
            let recs = await client.db.query("SELECT id from docTree where parent=?", [rootId]);  // get all children whos parent is recToDelete
            for (let idx = 0; idx < recs.length; idx++) {                                         // recursively delete them and their children
                await deleteRec(recs[idx].id);
            }
            recs = await client.db.query("SELECT listOrder,parent,uuid from docTree where id=?", [rootId]); // get info about rec to delete
            let rec = recs[0];
            await client.db.run("DELETE FROM doc WHERE uuid=?", [rec.uuid]);  // delete entry from doc table
            await client.db.run("DELETE FROM docTree WHERE id=?", [rootId]);  // delete entry from docTree table
            await client.db.run("UPDATE docTree SET listOrder = listOrder - 1"
                              + " WHERE parent = ? and listOrder > ?", [rec.parent, rec.listOrder]);  // decrement listOrders to close the gap
        }
        let rootId = await client.db.query("SELECT id from docTree where uuid=?", [this.uuid]);     // get id of rec who's uuid=
        rootId = rootId[0].id;
        await deleteRec(rootId);

        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.classes["Fault"](err.message);
    }
    BF.onChanged(client.ws, {what:"docTree"});      // tell the world that the docTree changed!
    this.uuid = ""; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendWait()
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.GetDBList.prototype.process = async function(client) {    // delete /CURRENT/ db, return null=good, text=errormsg
    logPkt("GetDBList");
    this.list = await BF.getDBList();
    return this;
};
WS.classes.CreateDB.prototype.process = async function(client) {    // create new db, return null=good, text=errormsg
    logPkt("CreateDB");
    const err = BF.checkDBName(this.name);    // test filename for validity
    delete this.name;
    if (err) {                            // return it if bad
        this.error = err;
        return this;
    }

    let list = await BF.getDBList();                // check if already exists! 
    if (list.includes(this.text)) {
        this.error = "Database '" + this.text + "' already exists";
        return this;
    }


    await BF.detachDB(client);              // detach any currently open db on this client
    await BF.attachDB(this.text, client);

    BF.onChanged(client.ws, {what:"dbList"});      // tell the world that the dbList changed!
    return this;
};
WS.classes.SelectDB.prototype.process = async function(client) {    // make other db current, return null=good, text=errormsg
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

    await BF.detachDB(client);             // close any currently open db on this client
    await BF.attachDB(this.text, client);   // increment clientCount if already open, else open/create db

    this.text = null;
    return this;
};
WS.classes.DeleteDB.prototype.process = async function(client) {    // delete /CURRENT/ db, return null=good, text=errormsg
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
    await BF.detachDB(client);      // close the db off the client so we can delete it

    client.db = null;
    
debugger; try {
        await client.db.run("BEGIN TRANSACTION");
//...
        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.classes["Fault"](err.message);
    }

    BF.onChanged(client.ws, {what:"dbList"});      // tell the world that the dbList changed!

    this.text = null;
    return this;
}
