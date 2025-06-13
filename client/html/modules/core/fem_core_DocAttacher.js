/*
ALL this does is load a SINGLE DocComponent, and populates it based on its type
it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)

reads data from a string(stream) and parses it out into a component in a few different ways.
typical use 
X = new DocAttacher();
X.attach(meta, parent, clone);      // attach the component (and all its children) to <div> (and div's handler)
    clone:  bool  default:false; true=clone meta's dchData recs and use those instead  (allows us to do copy/paste)
*/

import { DCW_BASE } from "/modules/core/fem_core_DCW_BASE.js";
import { DFDecoder } from "/public/classes/DFCoder.mjs";

export class DocAttacher {   // create and return a DCH from a stream
    dchList;
    dchLIdx;

    rootDcw;
    meta;
    keys;
    idx;
    async attach(meta, parentDcw, clone=false)  {
        this.meta = meta;
        this.keys = Object.keys(meta);
        this.idx = 0;
        this.rootDcw = null;

        await this._attachNext(parentDcw);
        return this.rootDcw;
    }


    async _attachNext(parentDcw) {
        if (this.idx > this.keys.length) {      // no more recs to process 
            return null;
        }
        const recId = parseInt(this.keys[this.idx++]);
        let meta = this.meta[recId];
        const dcw = await DCW_BASE.create(parentDcw, meta.S);  // create a handler, assign parent, create <div>, set 'S'tyle
        if (this.rootDcw == null) {           // record the topmost dch for returning
            this.rootDcw = dcw;
        }
        let pkt = WS.makePacket("GetDch");    // go get the dch's name and content and attach it
        pkt.id = recId;
        pkt = await WS.sendWait(pkt);         // consider lazyloading this in the future

        if (await dcw.attachDch(pkt.data.name)) {
            dcw._s_dch.__recId = recId;   // dch needs to know its recId for autoSave
            const decoder = new DFDecoder(pkt.data.content);
            const dict = decoder.decode();
            dcw._s_dch.importData(dict);
        }
        for (let idx = 0; idx < meta.C; idx++) {    // load children of component (if any) (only if BOX component)
            await this._attachNext(dcw);            // and attach to this dch
        }
    }
};
