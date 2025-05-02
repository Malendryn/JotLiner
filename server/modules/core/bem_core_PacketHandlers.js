
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


WS.__classes.GetDocList.prototype.process = async function() {
    this.list = await BG.db.query("SELECT * from docList order by parent,listOrder");
    return this;
}


WS.__classes.GetDoc.prototype.process = async function() { // must use 'function()' to have a 'this'   (not '() =>' )
        const tmp = await BG.db.query("SELECT content FROM doc WHERE uuid=?", [this.uuid]);
        if (tmp.length > 0) {
            this.doc = tmp[0].content;
        } else {
            this.doc = null;
        }
        // const filePath = path.join(BG.basePath, "server", this.uuid);
        // this.doc = await fs.promises.readFile(filePath, { encoding: 'utf8' });
        return this;
}


WS.__classes.NewDoc.prototype.process = async function() {    // insert new doc into db,  return with a GetDocList packet
    let recId;
    try {
        debugger; await BG.db.run("BEGIN TRANSACTION");
        let list = [this.dict.uuid, this.dict.version, this.dict.doc];
        await BG.db.run("INSERT INTO doc (uuid,version,content) values (?,?,?)", [list]);               // insert the doc
        list = [this.dict.name, this.dict.uuid, this.dict.listOrder, this.dict.parent];
        await BG.db.run("INSERT INTO docList (name,uuid,listOrder,parent) values (?,?,?,?)", [list]);   // insert the index entry
        await BG.db.run('UPDATE extra SET value=? where key="curDocUuid"', [this.dict.uuid]);              // make this the current doc too
        await BG.db.run("COMMIT TRANSACTION");
    } catch (err) {
        await BG.db.run("ROLLBACK TRANSACTION");
        return new WS.__classes["Fault"](err.message);
    }

    const pkt = new WS.__classes["GetDocList"]();           // create new packet WITHOUT incrementing __id
    return await pkt.process();                              // call the normal process() for "DocList" and return it as response to "NewDoc"
};
