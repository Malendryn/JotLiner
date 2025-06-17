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

// take a dcwDict and insert/update/reorder/delete its entries from at-or-beneath parentDcw(inclusive)
/*
we cant rely on only one dch changing at a time cuz copy/paste
so for each GetDch packet we send a faux dchRecId that we match the response packet to
   ... we can't do that cuz broadcase, has to work for other clients that won't have a faux recid to match to

so, ok, hmm...
we need to rebuild the local dcwTree and send it along with any AddDch/DelDch  request, that should give any other client
enough info to reconstruct from as well

so lets add an update() that coincides with attach

BUT FIRST lets get attach to construct a dch-less tree and then go fetch all the dch's by recid
*/
    async attach(dcwDict, parentDcw, clone=false)  {
        this.dcwDict = new DFDict(dcwDict);
        // this.keys = [...this.dcwDict.keys];  // get a clone of the iterator so we can idx-walk it
        this.idx = 0;
        this.rootDcw = null;
        this.dchStates = new DFDict();  // loadState of dch's {key=dch, val={isLoaded:false},...}
        await this._attachNext(parentDcw);
        return this.rootDcw;
    }

    async update(dcwDict, parentDcw) { //insert/update/delete dcwDict from parentDcw

    }

    async _attachNext(parentDcw) {
        if (this.idx >= this.dcwDict.length) {      // no more recs to process 
            return null;
        }
        const [recId, dcwEntry] = this.dcwDict.getByIdx(this.idx++); 
        const dcw = await DCW_BASE.create(parentDcw, dcwEntry.S);  // create a handler, assign parent, create <div>, set 'S'tyle
        if (this.rootDcw == null) {           // record the topmost dch for returning
            this.rootDcw = dcw;
        }

        let pkt = WS.makePacket("GetDch");      // go get the dch's name and content and attach it
        pkt.id = recId;
        pkt = await WS.sendWait(pkt);           // consider lazyloading this in the future

        if (await dcw.attachDch(pkt.rec.name)) {
            dcw.dchRecId = recId; 
            const decoder = new DFDecoder(pkt.rec.content);
            const dict = decoder.decode();      // will return undefined if u8a is empty
            if (dict != decoder.EOSTREAM) {     // if stream was empty
                dcw.dch.importData(dict);
            }
        }
        for (let idx = 0; idx < dcwEntry.C; idx++) {    // load children of component (if any) (only if BOX component)
            await this._attachNext(dcw);            // and attach to this dch
        }
    }
};
