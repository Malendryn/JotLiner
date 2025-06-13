
import { DFSortedList } from "./DFSortedList.js"

export class DFTimedQueue extends DFSortedList {
    constructor(compareFn, callback) {
        super();
        this._compareFn = compareFn;
        this._callback = callback;
    }


    add(val, when) {     // add to queue in 'when'-ordered position, return idx in queue
// we bypass the baseclass's add() untl the end cause we dont want to replace an existing time,
//    but instead want to bump it by +1
        let idx = this.keys.length;
        while (--idx >= 0) {
            if (when > this.keys[idx]) {     // key is unique
                break;
            }
            if (when === this.keys[idx]) {   // key matched,  bump it and try again
                ++when;
                ++idx;      // since we incremented time we need to ++idx too to check next one again
                if (idx >= this.keys.length) {  // don't check past eolist
                    break;
                }
                continue;
            }
        }
        const fire = this.keys.length > 0 && when < this.keys[0];   // will this entry fire first now?
        super.add(when, val);                                       // add it to queue
        if (!this._lastTimeoutId || fire) {                         // if NOT running OR will fire first...
            this._processQueue();
        }
    }


    autoSave(val, delay=1000) {    // since we're talking to 'local' backend this can happen fast,  1 sec, maybe even less?
        debugger; const uid = this.find(val, this._compareFn)
        if (uid !== -1) {
            debugger; this.removeByUid(uid);   // if matched, replace with new val + key
        }
        this.add(val, Date.now() + delay);  // keep this order as the time might be defaultable later
        _tlReset();
    };


    flushAll() {   // cause ALL waitfor's to fire immediately and flush the queue
        debugger; for (let idx = 0; idx < this.keys.length; ++idx) {
            this.keys[idx] = 0;  // zero ALL the keys so they fire immediately
        }
        this._processQueue(); 
    }

    
    _lastTimeoutId = 0;
    async _processQueue() {
        if (this._lastTimeoutId > 0) {                       // kill any current running timer
            clearTimeout(this._lastTimeoutId);
            this._lastTimeoutId = 0;
        }
        while (this.keys.length > 0) {
            const span = this.keys[0] - Date.now();
            if (span <= 0) {           // ready to fire!
                const [key,val] = [this.keys[0], this.vals[0]];  // grab first [key, val] (key is a 'Date.now() + delay')
                this.keys.shift();                               // and remove it from queue
                this.vals.shift();
                this.uids.shift();
                await this._callback(val);
            } else {                // else start a timeout of 'span' millis
               this._lastTimeoutId = setTimeout( () => {
                    this._processQueue();
                }, span);
                return;
            }
        }
    }
}



const _tlFifo = new DFTimeList();

function _tlFifoCmp(what, entry) {  // test the [list] we passed in by walking it and seeking matches
    debugger; for (const item in entry) {
        if (what == item) {
            return true;
        }
    }
    return false;
}


const _processCallback = async function(data) { // process _tlFifo entry
    debugger; if (FG.curDoc && FG.curDoc.dirty) {
        let extracter = new FG.DocExtracter();
        let encoder = new DFEncoder();

        debugger; let tmp = {
            dchList: await extracter.extract(FG.curDoc.rootDcw, false),
        };
        tmp = encoder.encode(tmp);

        let pkt = WS.makePacket("SaveDoc")
        pkt.dict = {                        // NOTE: no version or name, only uuid and content
            uuid:       FG.curDoc.uuid,
            doc:        tmp
        }
        pkt = WS.send(pkt);	        // send to backend, /maybe/ get a response-or-Fault, ?don't care?
        FG.curDoc.dirty = false;
    }
};


