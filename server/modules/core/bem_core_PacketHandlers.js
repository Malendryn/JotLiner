
import fs from "fs"; //'node:fs/promises'; <-- this works too
import path from "path";

WS.__classes.GetDCHList.prototype.process = async function() {
    // return new Promise(async (resolve, reject) => {
        const dirPath = path.join(BG.basePath, "client", "html", "modules", "DocComponentHandlers");

        const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
        const list = [];
        files.forEach(file => {
            if (file.isDirectory()) {
                list.push(file.name);
            }
        });
        this.list = list;
        return this;
    //     resolve(this);  // resolve(this) sends 'this' back! 
    // });
}


WS.__classes.GetExtra.prototype.process = async function() {
    let tmp = await BG.db.query("SELECT value FROM extra WHERE key=?", [this.txt]);
    if (tmp.length == 1) {
        this.txt = tmp[0].value;
    } else {
        this.txt = null;
    }
    return this;
}


WS.__classes.GetDocTree.prototype.process = async function() {
    this.list = await BG.db.query("SELECT * from docTree order by parent,listOrder");
    return this;
}


WS.__classes.GetDoc.prototype.process = async function() { // must use 'function()' to have a 'this'   (not '() =>' )
        const tmp = await BG.db.query("SELECT content FROM doc WHERE uuid=?", [this.uuid]);
        if (tmp.length > 0) {
            this.doc = tmp[0].content;
        } else {
            this.doc = null;
        }
        return this;
}


WS.__classes.NewDoc.prototype.process = async function() {    // insert new doc into db,  return with nothing!
    try {
        await BG.db.run("BEGIN TRANSACTION");
        let recs = await BG.db.query("SELECT id,uuid,listOrder from docTree where parent=? order by listOrder", [this.dict.parent]);
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
            await BG.db.run("UPDATE docTree SET listOrder = listOrder + 1 where id=?", [recs[idx].id]);   // increment existing rec's listorder's
        }

        let list = [this.dict.uuid, this.dict.version, this.dict.doc];
        await BG.db.run("INSERT INTO doc (uuid,version,content) values (?,?,?)", list);               // insert the doc
        list = [this.dict.name, this.dict.uuid, order, this.dict.parent];
        await BG.db.run("INSERT INTO docTree (name,uuid,listOrder,parent) values (?,?,?,?)", list);   // insert the index entry
        await BG.db.run('UPDATE extra SET value=? where key="curDocUuid"', [this.dict.uuid]);         // make this the current doc too
        await BG.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await BG.db.run("ROLLBACK TRANSACTION");
        return new WS.__classes["Fault"](err.message);
    }
    this.dict = {}; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendWait()
};


WS.__classes.SaveDoc.prototype.process = async function() {    // insert new doc into db,  return with a GetDocTree packet
    try {
        await BG.db.run("BEGIN TRANSACTION");
        let list = [this.dict.version, this.dict.doc, this.dict.uuid];
        await BG.db.run("UPDATE doc SET version=?,content=? WHERE uuid=?", [list]);               // insert the doc
        await BG.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await BG.db.run("ROLLBACK TRANSACTION");
        return new WS.__classes["Fault"](err.message);
    }
    this.dict = {}; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendExpect()
};


WS.__classes.DeleteDoc.prototype.process = async function() {    // insert new doc into db,  return with nothing!
    try {
        await BG.db.run("BEGIN TRANSACTION");

        async function deleteRec(uuid) {
            let recs = await BG.db.query("SELECT uuid from docTree where parent=?", [uuid]);
            for (let idx = 0; idx < recs.length; idx++) {
                await deleteRec(recs[idx].uuid);
            }
            recs = await BG.db.query("SELECT listOrder,parent from docTree where uuid=?", [uuid]);
            let rec = recs[0];
            await BG.db.run("DELETE FROM doc WHERE uuid=?", [uuid]);
            await BG.db.run("DELETE FROM docTree WHERE uuid=?", [uuid]);
            await BG.db.run("UPDATE docTree SET listOrder = listOrder - 1 WHERE parent = ? and listOrder > ?", [rec.parent, rec.listOrder]);
        }
        await deleteRec(this.uuid);

        await BG.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await BG.db.run("ROLLBACK TRANSACTION");
        return new WS.__classes["Fault"](err.message);
    }
    this.uuid = ""; // empty packetdata for faster returnPkt
    return this;    // send self back cus client called using .sendWait()
};


