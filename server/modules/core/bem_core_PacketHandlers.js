
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
    let tmp = await BG.db.query("SELECT value from extra where key=?", [this.txt]);
    if (tmp.length == 1) {
        debugger; this.txt = tmp[0];
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
    // return new Promise(async (resolve, reject) => {
        const filePath = path.join(BG.basePath, "server", this.docId);
        this.doc = await fs.promises.readFile(filePath, { encoding: 'utf8' });
        return this;
        // resolve(this);  // resolve(this) sends 'this' back! 
    // });
}


WS.__classes.NewDoc.prototype.process = async function() {    // insert new doc into db,  return with a GetDocList packet
    debugger; console.log(this.dict);           // --> {name,uuid,listOrder,parent,doc}
    const pkt = new WS.__classes["GetDocList"]();           // create new packet WITHOUT incrementing __id
    return await pkt.process();                              // call the normal process() for "DocList" and return it as response to "NewDoc"
};
