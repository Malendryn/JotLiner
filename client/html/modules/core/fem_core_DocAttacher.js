/*
ALL this does is load a SINGLE DocComponent, and populates it based on its type
it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)

reads data from a string(stream) and parses it out into a component in a few different ways.
typical use 
X = new DocAttacher();
X.attach(meta, parent, clone);      // attach the component (and all its children) to <div> (and div's handler)
    clone:  bool  default:false; true=clone meta's dchData recs and use those instead  (allows us to do copy/paste)
*/

import { DCW_BASE  } from "/modules/core/fem_core_DCW_BASE.js";
import { DFDecoder } from "/public/classes/DFCoder.mjs";

export class DocAttacher {   // create and return a DCH from a stream
    dchList;
    dchLIdx;

    rootDcw;
    meta;
    keys;
    idx;
    async attach(meta, parentDch, clone=false)  {
        this.meta = meta;
        this.keys = Object.keys(meta);
        this.idx = 0;
        this.rootDcw = null;

        await this._attachNext(parentDch);
        return this.rootDcw;
    }


    async _attachNext(parentDch) {
        if (this.idx > this.keys.length) {      // no more recs to process 
            return null;
        }
        const key = parseInt(this.keys[this.idx++]);
        let meta = this.meta[key];
        const dcw = await DCW_BASE.create(parentDch, meta.S);  // create a handler, assign parent, create <div>, set 'S'tyle
        // if (!dcw) {
        //     return null;
        // }
        if (this.rootDcw == null) {         // record the topmost dch for returning
            this.rootDcw = dcw;
        }
        let pkt = WS.makePacket("GetDchData");      // go get the dch's name and content and attach it
        pkt.id = key;
        pkt = await WS.sendWait(pkt);                 // consider lazyloading this in the future

// RSTODO if this happens we should delete it properly by removing the dchData record too and removing it from any parent's 
// 'children' list and also autoSave() that parent immediately to get rid of the dcw entirely
// this technically SHOULD NEVER happen buuuut.... ! 
        if (!await dcw.attachDch(pkt.data.name)) {
             dcw.destroy();
        } else {
            const decoder = new DFDecoder(pkt.data.content);
            const dict = decoder.decode()
            dcw.__dch.importData(dict);

            for (let idx = 0; idx < meta.C; idx++) {    // load children of component (if any) (only if BOX component)
                await this._attachNext(dcw);            // and attach to this dch
            }
        }
    }
};


function onPktGetDchData(pkt, context) {

}