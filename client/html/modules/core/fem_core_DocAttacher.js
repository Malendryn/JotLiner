/*
ALL this does is load a SINGLE DocComponent, and populates it based on its type
it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)

reads data from a string(stream) and parses it out into a component in a few different ways.
typical use 
X = new DocAttacher();
X.attach(meta, parent, clone);      // attach the component (and all its children) to <div> (and div's handler)
    clone:  bool  default:false; true=clone meta's dchData recs and use those instead  (allows us to do copy/paste)
*/

import { DCW_ShadowRect } from "/modules/core/fem_core_DCW_ShadowRect.js";

export class DocAttacher {   // create and return a DCH from a stream
    dchList;
    dchLIdx;

    rootDch;
    meta;
    keys;
    idx;
    async attach(meta, parentDch, clone=false)  {
        this.meta = meta;
        this.keys = Object.keys(meta);
        this.idx = 0;
        this.rootDch = null;

        await this._attachNext(parentDch);
        return this.rootDch;
    }


    async _attachNext(parentDch) {
        if (this.idx > this.keys.length) {      // no more recs to process 
            return null;
        }
        const key = parseInt(this.keys[this.idx++]);
        let meta = this.meta[key];
        const dch = await DCW_ShadowRect.create(parentDch, meta.S);  // create a handler, assign parent, create <div>, set 'S'tyle
        // if (!dch) {
        //     return null;
        // }
        if (this.rootDch == null) {         // record the topmost dch for returning
            this.rootDch = dch;
        }

        console.log(FF.__FILE__(), "attach DCH HERE!  *********************************************************")
        if (0) {
            let pkt = WS.makePacket("GetDchData");  // consider lazyloading this in the future
            pkt.id = key;
            pkt = await WS.sendWait(pkt);

            dch.attachHandler(pkt.data.name)
            dch.importData(pkt.data.content);
        }

        for (let idx = 0; idx < meta.C; idx++) {    // load children of component (if any)
            await this._attachNext(dch);            // and attach to this dch
        }
    }
};


function onPktGetDchData(pkt, context) {

}