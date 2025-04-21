
import fs from 'node:fs/promises';
import path from 'path';

WS.__classes.GetDoc.prototype.process = async function() { // must use 'function()' to have a 'this'   (not '() =>' )
    return new Promise(async (resolve, reject) => {
        const filePath = path.join(BG.basePath, "server", this.docId);
        this.doc = await fs.readFile(filePath, { encoding: 'utf8' });
        resolve(this);  // resolve(this) sends 'self' back! 
    });
}
