
import fs from "fs"; //'node:fs/promises'; <-- this works too
import path from "path";

import { DFEncoder, DFDecoder } from "../../../client/html/public/classes/DFCoder.mjs";
import { DFDict }               from "../../../client/html/public/classes/DFDict.mjs";

//debugger; // only way to break during module load, brkpoints don't cut it!
function logPkt(name) {
    console.log("pkt=" + name);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.GetBackendInfo.prototype.onPktRecvd = async function(client) {
    logPkt("GetBackendInfo");
    this.version = BG.VERSION;
    this.docVersion = BG.DOCVERSION;
    this.connId = client.ws._id;
    return this;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WS.classes.GetExtra.prototype.onPktRecvd = async function(client) {
//     debugger; logPkt("GetExtra");
//     this.txt = null;
//     if (!client.db) { return WS.fault("Database not selected"); }
//     let tmp = await client.db.query("SELECT value FROM extra WHERE key=?", [this.key]);
//     delete this.key;

//     if (tmp.length == 1) {
//         this.val = tmp[0].value;
//     }
//     return this;
// }
// WS.classes.SetExtra.prototype.onPktRecvd = async function(client) {
//     debugger; logPkt("SetExtra");
//     if (!client.db) { return WS.fault("Database not selected"); }
//     let tmp = await client.db.query("INSERT OR REPLACE INTO extra (key,value) VALUES(?,?)", [this.key, this.val]);
//     return null;
// }


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.GetDCHList.prototype.onPktRecvd = async function(client) {
    logPkt("GetDCHList");
    const dirPath = path.join(BG.basePath, "client", "html", "modules", "DocComponentHandlers");
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
    const list = [];
    for (const file of files) {
        if (file.isDirectory() || file.isSymbolicLink()) {
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
WS.classes.GetDocTree.prototype.onPktRecvd = async function(client) {
    logPkt("GetDocTree");
    if (!client.db) { return WS.fault("Database not selected"); }
    // this.list = await client.db.query("SELECT * from docTree order by parent,listOrder");
    let sql = "SELECT docTree.*, doc.name FROM docTree"
            + " JOIN doc ON docTree.uuid = doc.uuid"
            + " ORDER BY parent,listOrder;";
    this.list = await client.db.query(sql);
    return this;
}


WS.classes.GetDoc.prototype.onPktRecvd = async function(client) { // must use 'function()' to have a 'this'   (not '() =>' )
    logPkt("GetDoc");
    if (!client.db) { return WS.fault("Database not selected"); }
    const tmp = await client.db.query("SELECT name,dcwFlatTree,bump FROM doc WHERE uuid=?", [this.uuid]);
    delete this.uuid;
    if (tmp.length > 0) {
        this.rec = tmp[0];
    }
    return this;        // this is now sendWaited
}
WS.classes.GetDch.prototype.onPktRecvd = async function(client) { // must use 'function()' to have a 'this'   (not '() =>' )
    logPkt("GetDch");
    const recs = await client.db.query("SELECT name,content FROM dch WHERE id = ?", [this.id]);
    delete this.id;
    this.rec = recs[0];
    return this;
}

// WS.classes.NewDoc.prototype.onPktRecvd = async function(client) {    // this.dict={name,uuid,after,parent,u8aDoc}
//     logPkt("NewDoc");
//     if (!client.db) { return WS.fault("Database not selected"); }
//     try {
//         await client.db.run("BEGIN TRANSACTION");
//         let recs = await client.db.query("SELECT id,uuid,listOrder from docTree where parent=? order by listOrder", [this.dict.parent]);
//         let idx, order = 0;
//         for (idx = 0; idx < recs.length; idx++) {   // find listOrder # of 'after' rec (else get highest listOrder# in use at this parentLevel)
//             const rec = recs[idx];
//             order = rec.listOrder;          
//             if (rec.id == this.dict.after) {
//                 break;
//             }
//         }
//         order  += 1;     //our new listOrder number for this rec we're about to insert
//         idx++;           //move PAST current rec! (harmless if ran off end)

//         for (; idx < recs.length; idx++) {  // increment listOrder of all recs after the point we want to insert
//             await client.db.run("UPDATE docTree SET listOrder = listOrder + 1 where id=?", [recs[idx].id]);   // increment existing rec's listorder's
//         }

//         let list = [BG.DOCVERSION, this.dict.uuid, this.dict.name, this.dict.doc];
//         this.docId = await client.db.run("INSERT INTO doc (version,uuid,name,content) values (?,?,?,?)", list);     // insert doc
//         list = [this.dict.uuid, order, this.dict.parent];
//         this.docTreeId = await client.db.run("INSERT INTO docTree (uuid,listOrder,parent) values (?,?,?)", list);   // insert index entry
//         await client.db.run("COMMIT TRANSACTION");
//     } catch (err) {
//         await client.db.run("ROLLBACK TRANSACTION");
//         return new WS.classes["Fault"](err.message);
//     }
//     WS.broadcast(this, id:x x, bump:bump});
//     this.dict = {}; // empty packetdata for faster returnPkt
//     return this;    // send self back cus client called using .sendWait() (and we added docId and docTreeId to the class on return)
// };
// WS.classes.ModDoc.prototype.onPktRecvd = async function(client) {    // this.dict={uuid, doc(u8a)}
//     logPkt("ModDoc");
//     let rec;
//     if (!client.db) { return WS.fault("Database not selected"); }
//     try {
//         await client.db.run("BEGIN TRANSACTION");
//         let list = [this.dcwFlatTree, this.uuid];
//         rec = await client.db.get("UPDATE doc SET dcwFlatTree=?,bump=bump+1 WHERE uuid=? RETURNING bump", [list]);  // insert the doc
//         await client.db.run("COMMIT TRANSACTION");
//     } catch (err) {
//         await client.db.run("ROLLBACK TRANSACTION");
//         return new WS.classes["Fault"](err.message);
//     }
//     WS.broadcast("ModDoc", {uuid:this.uuid, bump:rec.bump});
//     delete this.name;
//     delete this.dcwFlatTree;
//     delete this.uuid;
//     this.bump = rec.bump;
//     return this;    // send self back cus client called using .sendExpect()
// };
// WS.classes.RenameDoc.prototype.onPktRecvd = async function(client) {    // rename a document
//     debugger; logPkt("RenameDoc");
//     let rec;
//     if (!client.db) { return WS.fault("Database not selected"); }
//     await client.db.run("BEGIN TRANSACTION");
//     rec = await client.db.get("UPDATE doc SET name=?,bump=bump+1 WHERE uuid=? RETURNING bump", [this.name, this.uuid]);
//     await client.db.run("COMMIT TRANSACTION");

//     debugger;/*TEST*/ // docTree did NOT change, doc.name did
//     WS.broadcast(this, {uuid:this.uuid, bump:rec.bump}); // tell the world that something about the doc changed!
//     delete this.uuid;
//     delete this.name;
//     return this;                            // send self back cuz client used .sendWait()
// }
// WS.classes.DeleteDoc.prototype.onPktRecvd = async function(client) {    // insert new doc into db,  return with nothing!
//     debugger; logPkt("DeleteDoc");
//     if (!client.db) { return WS.fault("Database not selected"); }
//     try {
//         await client.db.run("BEGIN TRANSACTION");

//         async function deleteRec(rootId) {
//             let recs = await client.db.query("SELECT id from docTree where parent=?", [rootId]);  // get all children whos parent is recToDelete
//             for (let idx = 0; idx < recs.length; idx++) {                                         // recursively delete them and their children
//                 await deleteRec(recs[idx].id);
//             }
//             recs = await client.db.query("SELECT listOrder,parent,uuid from docTree where id=?", [rootId]); // get info about rec to delete
//             let rec = recs[0];
//             await client.db.run("DELETE FROM doc WHERE uuid=?", [rec.uuid]);  // delete entry from doc table
//             await client.db.run("DELETE FROM docTree WHERE id=?", [rootId]);  // delete entry from docTree table
//             await client.db.run("UPDATE docTree SET listOrder = listOrder - 1"
//                               + " WHERE parent = ? and listOrder > ?", [rec.parent, rec.listOrder]);  // decrement listOrders to close the gap
//         }
//         let rootId = await client.db.query("SELECT id from docTree where uuid=?", [this.uuid]);     // get id of rec who's uuid=
//         rootId = rootId[0].id;
//         await deleteRec(rootId);

//         await client.db.run("COMMIT TRANSACTION");
//     } catch (err) {
//         await client.db.run("ROLLBACK TRANSACTION");
//         return new WS.classes["Fault"](err.message);
//     }
//     debugger; WS.broadcast(this, {uuid:this.uuid);      // tell the world that the docTree changed!
//     this.uuid = ""; // empty packetdata for faster returnPkt
//     return this;    // send self back cus client called using .sendWait()
// };
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.AddDch.prototype.onPktRecvd = async function(client) {  // add new dch rec(s), broadcast changes
    // this.uuid, this.childOf(recid),  dcwFlatTree to insert
    await client.db.run("BEGIN TRANSACTION");
    let rec = await client.db.get("SELECT id,dcwFlatTree,bump FROM doc WHERE uuid=?", [this.uuid]);
    const docId = rec.id;
    let dcwFlatTree = JSON.parse(rec.dcwFlatTree);
    let dcwRealTree = SF.flatToReal(dcwFlatTree);
    let bump = rec.bump++;

    let tree2Add = this.newDcwFlatTree;
    for (let idx = 0; idx < tree2Add.length; idx++) { // insert missing dch's and get their recId
        let pair = tree2Add[idx];
        let [recId, dict] = pair;
        if (recId == 0) { 
            const list = [
                docId,
                dict.N,              //dchName
                new Uint8Array(),
                bump
            ];
            rec = await client.db.get("INSERT INTO dch (docId,name,content,bump) VALUES (?,?,?,?) RETURNING id", list);
            tree2Add[idx][0] = rec.id;  // apply the newly inserted recId
        }
    }
    
    tree2Add = SF.flatToReal(tree2Add);

    let done = false;               // find where to 'plug in' this tree2Add into the real doc tree
    const addToTree = (dict) => {
        if (dict.recId == this.childOf) {
            dict.children.push(tree2Add);
            done = true;
            return;
        }
        for (let idx = 0; idx < dict.children.length && !done; idx++) {
            addToTree(dict.children[idx]);
        }
    }
    addToTree(dcwRealTree);

    dcwFlatTree = SF.realToFlat(dcwRealTree);       // revert it to a dchFlatTree again

    const list = [
        JSON.stringify(dcwFlatTree),
        bump,
        docId
    ];
    await client.db.run("UPDATE doc SET dcwFlatTree=?,bump=? WHERE id=?", list);

    await client.db.run("COMMIT TRANSACTION");
    WS.broadcast("ModDoc", {uuid:this.uuid, dcwFlatTree:dcwFlatTree, bump:bump});
    return null;
}


WS.classes.ModDch.prototype.onPktRecvd = async function(client) {
    debugger;
}


WS.classes.DelDch.prototype.onPktRecvd = async function(client) {
    await client.db.run("BEGIN TRANSACTION");
    let rec = await client.db.get("SELECT id,dcwFlatTree FROM doc WHERE uuid=?", [this.uuid]);
    let dcwFlatTree = rec.dcwFlatTree;
    dcwFlatTree = JSON.parse(dcwFlatTree);
    const dcwRealTree = SF.flatToReal(dcwFlatTree);
    const docId = rec.id;

    let done = false;
    let flatTreeToDel;
    const findDcwToDel = (dict) => {
        if (done) {
            return;
        }
        if (dict.recId == this.dchId) {  // found the rec? start the capture!
            flatTreeToDel = SF.realToFlat(dict); // avoids worrying about detached dict.parent, dict.index, ...
            done = true;
            return;
        }
        for (let idx = 0; idx < dict.children.length; idx++) {
            findDcwToDel(dict.children[idx]);
            if (done) {
                dict.children.splice(idx, 1);
                return;
            }
        }
    }
    findDcwToDel(dcwRealTree);
    for (const pair of flatTreeToDel) {
        const list = [pair[0]];
        await client.db.run("DELETE FROM dch WHERE id=?", list);
    }

    dcwFlatTree = SF.realToFlat(dcwRealTree)
    const list = [
        JSON.stringify(dcwFlatTree),
        docId
    ];
    rec = await client.db.get("UPDATE doc SET dcwFlatTree=?,bump=bump+1 WHERE id=? RETURNING bump", list);
    await client.db.run("COMMIT TRANSACTION");
    WS.broadcast("ModDoc", {uuid:this.uuid, dcwFlatTree:dcwFlatTree, bump:rec.bump});
    return null;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.GetDBList.prototype.onPktRecvd = async function(client) {    // delete /CURRENT/ db, return null=good, text=errormsg
    logPkt("GetDBList");
    this.list = await BF.getDBList();
    return this;
};
// WS.classes.CreateDB.prototype.onPktRecvd = async function(client) {    // create new db, return null=good, text=errormsg
//     debugger; logPkt("CreateDB");
//     const err = BF.checkDBName(this.name);    // test filename for validity
//     delete this.name;
//     if (err) {                            // return it if bad
//         this.error = err;
//         return this;
//     }

//     let list = await BF.getDBList();                // check if already exists! 
//     if (list.includes(this.text)) {
//         this.error = "Database '" + this.text + "' already exists";
//         return this;
//     }


//     await BF.detachDB(client);              // detach any currently open db on this client
//     await BF.attachDB(this.text, client);

//     WS.broadcast(this, {});      // tell the world that the dbList changed!
//     return this;
// };
WS.classes.SelectDB.prototype.onPktRecvd = async function(client) {    // make other db current, return null=good, text=errormsg
    logPkt("SelectDB");
    let name = this.name;
    delete this.name;
    const err = BF.checkDBName(name);    // test filename for validity
    if (err) {                           // return msg if bad
        this.err = err;
        return this;
    }

    let list = await BF.getDBList();                // check that db file actually exists
    if (!list.includes(name)) {
        this.err = "Database '" + name + "' does not exist";
        return this;
    }

    await BF.detachDB(client);        // close any currently open db on this client
    await BF.attachDB(name, client);  // increment clientCount if already open, else open/create db

    return this;
};
// WS.classes.DeleteDB.prototype.onPktRecvd = async function(client) {    // delete /CURRENT/ db, return null=good, text=errormsg
//     debugger; logPkt("DeleteDB");
//     if (!client.db) { return WS.fault("Database not selected"); }
//     const err = BF.checkDBName(this.text);    // test filename for validity
//     if (err) {                            // return it if bad
//         this.text = err;
//         return this;
//     }

// // validate db is empty here, THEN...

//     debugger; if (BF.openedDBs[client.dbName].clients > 1) {
//         this.text = "Cannot delete DB while other clients are using it";
//         return this;
//     }
//     await BF.detachDB(client);      // close the db off the client so we can delete it

//     client.db = null;
    
// debugger; try {
//         await client.db.run("BEGIN TRANSACTION");
// //...
//         await client.db.run("COMMIT TRANSACTION");
//     } catch (err) {
//         await client.db.run("ROLLBACK TRANSACTION");
//         return new WS.classes["Fault"](err.message);
//     }

//     WS.broadcast(this, {name:dbName});      // tell the world that the dbList changed!

//     this.text = null;
//     return this;
// }
