
// explode contents of docstream into a dict (see bem_core_DocExporter.js for dict construction)

import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";


export async function explode(dict) {  // see bem_core_DocExploder.js for definition of dict
    let dimp = new DocImporter();
    const dic2 = await dimp.import(dict.doc);
    delete dic2.name;                 // v1.1 never has a name
    return dic2;
}


class DocImporter {
    dict;
    bin;
    idx;
    async import(bin)  {
        this.bin = bin;
        this.idx = 0;
        this.dict = {}
        try {
            let val;
            val = this._readToLF();             // skipover "@2.0;" as already parsed and proven
            this.dict.uuid = this._readToLF();
            this.dict.name = this._readToLF();
            const view = new Uint8Array(this.bin.buffer, this.idx, this.bin.byteLength - this.idx);
            const decoder = new DFDecoder(view);
            val = decoder.decode()
            this.dict.dchList = val.dchList;
        } catch (err) {
            this.dict.error = err.message;
        }
        return this.dict;
    }


    _readToLF() {   // read until a ';' or EOF and return it,  (if ';' move idx past it)
        let tmp = "";
        let chr = '';
        while (this.idx < this.bin.length) {
            const chr = String.fromCharCode(this.bin[this.idx++]);
            if (chr != '\n') {
                tmp += chr;
            } else {
                break;
            }
        }
        return tmp;
    }
 };
