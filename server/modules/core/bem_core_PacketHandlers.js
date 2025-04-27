
import fs from "fs"; //'node:fs/promises'; <-- this works too
import path from "path";

WS.__classes.GetDoc.prototype.process = async function() { // must use 'function()' to have a 'this'   (not '() =>' )
    return new Promise(async (resolve, reject) => {
        const filePath = path.join(BG.basePath, "server", this.docId);
        this.doc = await fs.promises.readFile(filePath, { encoding: 'utf8' });
        resolve(this);  // resolve(this) sends 'self' back! 
    });
}


WS.__classes.GetDCHList.prototype.process = async function() {
    return new Promise(async (resolve, reject) => {
        const dirPath = path.join(BG.basePath, "client", "html", "modules", "DocComponentHandlers");

        const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
        const list = [];
        files.forEach(file => {
            if (file.isDirectory()) {
                list.push(file.name);
            }
        });
        this.list = list;
        resolve(this);  // resolve(this) sends 'self' back! 
    });
}
