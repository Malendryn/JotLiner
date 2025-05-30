
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
const stream = exp.export(dict);  where dict is:

*/

import { DFEncoder, DFDecoder } from "../../../client/html/modules/shared/DFCoder.mjs";

BF.DocExporter = class DocExporter {
    async export(dict) {
        this.enc = new DFEncoder();

        let ver, blen = 0;
        if (dict.uuid) {                 // IF uuid present, we're exporting to a file, so include @n.n;+uuid+name
            ver = new TextEncoder().encode("@2.0;") // this has to be raw, not encoded, so we reserve() instead of encode()
            blen = ver.byteLength;
        }
        let val = this.enc.encode(dict, blen);    // turn the entire dict into a stream ?PLUS? space for '@n.n;'
        if (blen) {                                             // IF space for '@n.n;' was reserved...
            for (let idx = 0; idx < ver.byteLength; idx++) {    // ...embed '@n.n;' as raw bytes into reserved() space
                debugger; val[idx] = ver[idx];
            }
        }
        return val;
    }
};
