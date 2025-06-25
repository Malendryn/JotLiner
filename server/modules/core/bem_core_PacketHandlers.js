
import fs from "fs"; //'node:fs/promises'; <-- this works too
import path from "path";

import { DFEncoder, DFDecoder } from "../../../client/html/public/classes/DFCoder.mjs";
import { DFDict }               from "../../../client/html/public/classes/DFDict.mjs";

//debugger; // only way to break during module load, brkpoints don't cut it!
function logPkt(name) {
    console.log("pkt=" + name);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes["GetBackendInfo"].prototype.onPktRecvd = async function(client) {
    logPkt(this.constructor.name);
    this.version = BG.VERSION;
    this.docVersion = BG.DOCVERSION;
    this.connId = client.ws._id;
    return this;
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WS.classes["GetExtra"].prototype.onPktRecvd = async function(client) {
//     logPkt(this.constructor.name);
//     this.txt = null;
//     if (!client.db) { return WS.fault("Database not selected"); }
//     let tmp = await client.db.query("SELECT value FROM extra WHERE key=?", [this.key]);
//     delete this.key;

//     if (tmp.length == 1) {
//         this.val = tmp[0].value;
//     }
//     return this;
// }
// WS.classes["SetExtra"].prototype.onPktRecvd = async function(client) {
//     logPkt(this.constructor.name);
//     if (!client.db) { return WS.fault("Database not selected"); }
//     let tmp = await client.db.query("INSERT OR REPLACE INTO extra (key,value) VALUES(?,?)", [this.key, this.val]);
//     return null;
// }


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes["GetDCHList"].prototype.onPktRecvd = async function(client) {
    logPkt(this.constructor.name);
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
WS.classes["GetDocTree"].prototype.onPktRecvd = async function(client) {
    logPkt(this.constructor.name);
    if (!client.db) { return WS.fault("Database not selected"); }
    // this.list = await client.db.query("SELECT * from docTree order by parent,listOrder");
    let sql = "SELECT docTree.*, doc.name FROM docTree"
            + " JOIN doc ON docTree.uuid = doc.uuid"
            + " ORDER BY parent,listOrder;";
    this.list = await client.db.query(sql);
    return this;
}


WS.classes["GetDoc"].prototype.onPktRecvd = async function(client) { // must use 'function()' to have a 'this'   (not '() =>' )
    logPkt(this.constructor.name);
    if (!client.db) { return WS.fault("Database not selected"); }
    const rec = await client.db.get("SELECT name,dcwFlatTree,bump FROM doc WHERE uuid=?", [this.uuid]);
    this.name        = rec.name;
    this.dcwFlatTree = JSON.parse(rec.dcwFlatTree) ;
    this.bump        = rec.bump;
    return this;        // this is now sendWaited
}

WS.classes["AddDoc"].prototype.onPktRecvd = async function(client) {    // this={uuid,name,after,parent}
    logPkt(this.constructor.name);
    if (!client.db) { return WS.fault("Database not selected"); }
    try {
        await client.db.run("BEGIN TRANSACTION");
        let recs = await client.db.query("SELECT id,uuid,listOrder from docTree where parent=? order by listOrder", [this.parent]); // get kids who share this parent
        let idx, order = 0;
        for (idx = 0; idx < recs.length; idx++) {   // find listOrder # of 'after' rec (else get highest listOrder# in use at this parentLevel)
            const rec = recs[idx];
            order = rec.listOrder;          
            if (rec.id == this.after) {
                break;
            }
        }
        order  += 1;     //our new listOrder number for this rec we're about to insert
        idx++;           //move PAST current rec! (harmless if ran off end)

        for (; idx < recs.length; idx++) {  // increment listOrder of all recs after the point we want to insert
            await client.db.run("UPDATE docTree SET listOrder = listOrder + 1 where id=?", [recs[idx].id]);   // increment existing rec's listorder's
        }

        let list, rec;
        list = [this.uuid, this.name, "", 0];           // "" = placeholder for dcwFlatTree (see below)
        rec = await client.db.get("INSERT INTO doc (uuid,name,dcwFlatTree,bump) values (?,?,?,?) RETURNING id", list);     // insert doc, get id
        let docId = rec.id;

        let encoder = new DFEncoder();
        let tmp = encoder.encode({zX:0, zY:0});         // encode the plugin's data
        list = [docId, "BOX", tmp, 0]
        rec = await client.db.get("INSERT INTO dch (docId,name,content,bump) VALUES(?,?,?,?) RETURNING id", list);    // insert basic dch content for the fullscreen box
        const dcwFlatTree = `[[${rec.id},{"N":"BOX","S":{"L":0,"R":0,"T":0,"B":0},"C":0}]]`;     // absolute basic doc flatTree WITH dch recId
        await client.db.run("UPDATE doc SET dcwFlatTree=? where id=?", [dcwFlatTree, docId]);

        list = [this.uuid, order, this.parent];
        await client.db.run("INSERT INTO docTree (uuid,listOrder,parent) values (?,?,?)", list);   // insert index entry
        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.classes["Fault"](err.message);
    }
    WS.broadcast("ModDocTree", {uuid: this.uuid});
    return null;
};

WS.classes["ModDoc"].prototype.onPktRecvd = async function(client) {    // this = {uuid,?name,?dcwFlatTree} -- ? means only present if changed
    logPkt(this.constructor.name);
    if (!client.db) { return WS.fault("Database not selected"); }
    let rec, broadList = {uuid:this.uuid};
    try {
        await client.db.run("BEGIN TRANSACTION");
        let list;
        if ("name" in this) {
            list = [this.name, this.uuid];
            broadList.name = this.name;
            rec = await client.db.get("UPDATE doc SET name=?,bump=bump+1 WHERE uuid=? RETURNING bump", [list]);  // insert the doc
        } else if ("dcwFlatTree" in this) {
            list = [JSON.stringify(this.dcwFlatTree), this.uuid];
            broadList.dcwFlatTree = this.dcwFlatTree;
            rec = await client.db.get("UPDATE doc SET dcwFlatTree=?,bump=bump+1 WHERE uuid=? RETURNING bump", [list]);  // insert the doc
        }
        broadList.bump = rec.bump;
        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        trace("Error: err");
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.classes["Fault"](err.message);
    }
    WS.broadcast("ModDoc", broadList);
    return null;
};

WS.classes["DelDoc"].prototype.onPktRecvd = async function(client) {    // insert new doc into db,  return with nothing!
    logPkt(this.constructor.name);
    if (!client.db) { return WS.fault("Database not selected"); }
    try {
        await client.db.run("BEGIN TRANSACTION");

        async function walk(docTreeId) {
            let recs = await client.db.query("SELECT id from docTree where parent=?", [docTreeId]);  // get all children whos parent is recToDelete
            for (let idx = 0; idx < recs.length; idx++) {                                         // recursively delete them and their children
                await walk(recs[idx].id);
            }
            let rec = await client.db.get("SELECT listOrder,parent,uuid from docTree where id=?", [docTreeId]); // get info about rec to delete
            let docRec = await client.db.get("SELECT id from doc where UUID=?", [rec.uuid]);
            await client.db.run("DELETE FROM dch WHERE docId=?", [docRec.id]);          // deleta associated dch recs
            await client.db.run("DELETE FROM doc WHERE id=?", [docRec.id]);             // delete entry from doc table
            await client.db.run("DELETE FROM docTree WHERE id=?", [docTreeId]);         // delete entry from docTree table
            await client.db.run("UPDATE docTree SET listOrder = listOrder - 1"
                              + " WHERE parent = ? and listOrder > ?", [rec.parent, rec.listOrder]);  // decrement listOrders to close the gap
        }
        let rec = await client.db.get("SELECT id from docTree where uuid=?", [this.uuid]);     // get id of rec who's uuid=
        await walk(rec.id);

        await client.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await client.db.run("ROLLBACK TRANSACTION");
        return new WS.classes["Fault"](err.message);
    }
    WS.broadcast("ModDocTree", {uuid:this.uuid} );      // tell the world that the docTree changed!
    this.uuid = ""; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendWait()
};
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes["GetDch"].prototype.onPktRecvd = async function(client) { // must use 'function()' to have a 'this'   (not '() =>' )
    logPkt(this.constructor.name);
    this.rec = await client.db.get("SELECT name,content FROM dch WHERE id = ?", [this.id]);
    // DoNotDelete 'this.id' as returnee wants it!
    return this;
}

WS.classes["AddDch"].prototype.onPktRecvd = async function(client) {  // add new dch rec(s), broadcast "ModDoc"
    logPkt(this.constructor.name);
    if (!client.db) { return WS.fault("Database not selected"); }
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

    dcwFlatTree = SF.realToFlat(dcwRealTree);       // revert it to a dcwFlatTree again

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

WS.classes["ModDch"].prototype.onPktRecvd = async function(client) {
    logPkt(this.constructor.name);
    if (!client.db) { return WS.fault("Database not selected"); }
    await client.db.run("BEGIN TRANSACTION");
    let list = [this.uuid];
    let rec = await client.db.get("UPDATE doc SET bump=bump+1 WHERE uuid=? RETURNING bump", list);
    list = [this.u8a, rec.bump, this.recId];
    await client.db.run("UPDATE dch SET content=?,bump=? where id=?", list);
    await client.db.run("COMMIT TRANSACTION");
    WS.broadcast("ModDch", {uuid:this.uuid, recId:this.recId, u8a:this.u8a, bump:rec.bump});
    return null;
}

WS.classes["DelDch"].prototype.onPktRecvd = async function(client) {
    logPkt(this.constructor.name);
    if (!client.db) { return WS.fault("Database not selected"); }
    await client.db.run("BEGIN TRANSACTION");
    let rec = await client.db.get("SELECT id,dcwFlatTree FROM doc WHERE uuid=?", [this.uuid]);
    let dcwFlatTree = rec.dcwFlatTree;
    dcwFlatTree = JSON.parse(dcwFlatTree);
    const dcwRealTree = SF.flatToReal(dcwFlatTree);
    const docId = rec.id;

    let done = 0;
    let flatTreeToDel;
    const findDcwToDel = (dict) => {
        if (done) {
            return;
        }
        if (dict.recId == this.dchId) {  // found the rec? start the capture!
            flatTreeToDel = SF.realToFlat(dict); // avoids worrying about detached dict.parent, dict.index, ...
            done = 1;
            return;
        }
        for (let idx = 0; idx < dict.children.length; idx++) {
            findDcwToDel(dict.children[idx]);
            if (done) {
                if (done == 1) {    // only delete once on the way out!
                    done = 2;
                    dict.children.splice(idx, 1);
                }
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
WS.classes["GetDBList"].prototype.onPktRecvd = async function(client) {    // delete /CURRENT/ db, return null=good, text=errormsg
    logPkt(this.constructor.name);
    this.list = await BF.getDBList();
    return this;
};

WS.classes["AddDB"].prototype.onPktRecvd = async function(client) {    // create new db, return null=good, text=errormsg
    logPkt(this.constructor.name);
    const err = BF.checkDBName(this.name);    // test filename for validity
    if (err) {                                // return msg if bad
        this.error = err;
        return this;
    }

    let list = await BF.getDBList();      // check if already exists! 
    if (list.includes(this.name)) {
        this.error = "Database '" + this.name + "' already exists";
        return this;
    }

    const db = await BF.openDB(this.name);     // cause db creation
    db.close();                             // and immediately close

    // await BF.detachDB(client);            // detach any currently open db on this client
    // await BF.attachDB(this.name, client);

    WS.broadcast("AddDB", {});  // tell the world that the dbList changed!
    delete this.name;           // save bandwidth
    return this;                // return to caller in case of error
};

WS.classes["SelectDB"].prototype.onPktRecvd = async function(client) {    // make other db current, return null=good, text=errormsg
    logPkt(this.constructor.name);
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
// WS.classes["DeleteDB"].prototype.onPktRecvd = async function(client) {    // delete /CURRENT/ db, return null=good, text=errormsg
//     logPkt(this.constructor.name);
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
