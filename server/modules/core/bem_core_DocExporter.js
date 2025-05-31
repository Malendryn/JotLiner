
/* 
usage:
const dict = {
    uuid:     "26-byte-uuid",
    name:     "document name",
    dchList: [                  // list of doc definits as follows:
        {  
            children: 0,        // # of dch's following this one that are children of this one
            name:     "BOX",    // dch name (as reported by its subdirectory)
            style:  { L:0, R:0, T:0, B:0 }  // dch-specific style info
            data:   { zX:0, zY:0, } // dch-specific datadict fetched via dch.exportData()
        }, // next dch, ...
    ]
}

const exp = new DocExporter();
Uint8Array = exp.export(dict);  where dict is:
*/

import { DFEncoder, DFDecoder } from "../../../client/html/modules/shared/DFCoder.mjs";

BF.DocExporter = class DocExporter {
    async export(dict) {
        this.enc = new DFEncoder();

        let ver, blen = 0;
        if (dict.uuid) {                 // IF uuid present, we're exporting to a file, so include @n.n;+uuid+name
            ver = '@' + BG.DOCVERSION + ';';
            ver = new TextEncoder().encode(ver) // this has to be raw, not encoded, so we reserve() instead of encode()
            blen = ver.byteLength;
        }

        const dic2 = { dchList:dict.dchList };  // construct dic2 with ONLY what we want in exported files
        if (blen)    { 
            dic2.uuid = dict.uuid;      // if storing '@n.n;' then MUST store uuid and name ELSE throw error!
            dic2.name = dict.name;
        }
        let val = this.enc.encode(dic2, blen);    // turn the entire dict into a stream ?PLUS? space for '@n.n;'
        if (blen) {                                             // IF space for '@n.n;' was reserved...
            for (let idx = 0; idx < ver.byteLength; idx++) {    // ...embed '@n.n;' as raw bytes into reserved() space
                debugger; val[idx] = ver[idx];
            }
        }
        return val;
    }
};
