/*
ALL this does is load a SINGLE DocComponent, and populates it based on its type
it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)

reads data from a string(stream) and parses it out into a component in a few different ways.
typical use 
X = new DocAttacher();
X.attach(dcwDict, parent, clone);      // attach the component (and all its children) to <div> (and div's handler)
    clone:  bool  default:false; true=clone dch recs & update dchDict to add those (allows us to do copy/paste)
*/

import { DCW_BASE } from "/modules/core/fem_core_DCW_BASE.js";
import { DFDecoder } from "/public/classes/DFCoder.mjs";
import { DFDict } from "/public/classes/DFDict.mjs";

export class DocAttacher {   // create and return a DCH from a stream
    rootDcw;
    dcwDict;
    keys;
    idx;
    async attach(dcwDict, parentDcw, clone=false)  {
        this.dcwDict = new DFDict(dcwDict);
        this.keys = [...this.dcwDict.keys];  // get a clone of the keys so we can idx-walk it
        this.idx = 0;
        this.rootDcw = null;

        await this._attachNext(parentDcw);
        return this.rootDcw;
    }


    async _attachNext(parentDcw) {
        if (this.idx > this.keys.length) {      // no more recs to process 
            return null;
        }
        const recId = this.keys[this.idx++];
        let dcwEntry = this.dcwDict.get(recId);
        const dcw = await DCW_BASE.create(parentDcw, dcwEntry.S);  // create a handler, assign parent, create <div>, set 'S'tyle
        if (this.rootDcw == null) {           // record the topmost dch for returning
            this.rootDcw = dcw;
        }
        let pkt = WS.makePacket("GetDch");    // go get the dch's name and content and attach it
        pkt.id = recId;
        pkt = await WS.sendWait(pkt);         // consider lazyloading this in the future

        if (await dcw.attachDch(pkt.rec.name)) {
            dcw._s_dch.__recId = recId;   // dch needs to know its recId for autoSave
            const decoder = new DFDecoder(pkt.rec.content);
            const dict = decoder.decode();
            dcw._s_dch.importData(dict);
        }
        for (let idx = 0; idx < dcwEntry.C; idx++) {    // load children of component (if any) (only if BOX component)
            await this._attachNext(dcw);            // and attach to this dch
        }
    }
};
