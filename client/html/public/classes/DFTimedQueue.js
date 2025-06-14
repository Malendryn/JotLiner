
import { DFSortedList } from "./DFSortedList.js"

export class DFTimedQueue extends DFSortedList {
    constructor(compareFn, callback) {
        super();
        this._compareFn = compareFn;
        this._callback = callback;
    }


    add(action, val, when) {     // add to queue in 'when'-ordered position, return idx in queue
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
        super.add(when, [action, val]);                             // add it to queue
        if (!this._lastTimeoutId || fire) {                         // if NOT running OR will fire first...
            this._processQueue();
        }
    }


    autoSave = (action, val, delay=1000) => {    // since we're talking to 'local' backend this can happen fast,  1 sec, maybe even less?
        const test = this.find(val, this._compareFn);  // returns [timeout, val, uid] or null
        if (test !== null) {
            debugger; this.removeByUid(test[2]);   // if matched, replace with new val + key
        }
        this.add(action, val, Date.now() + delay);  // keep this order as the time might be defaultable later
    };


    flushAll = async () => {   // cause ALL waitfor's to fire immediately and flush the queue
        for (let idx = 0; idx < this.keys.length; ++idx) {
            this.keys[idx] = 0;  // zero ALL the keys so they fire immediately
        }
        await this._processQueue(); 
    }


    _lastTimeoutId = 0;
    async _processQueue() {
        if (this._lastTimeoutId > 0) {                       // kill any current running timer
            clearTimeout(this._lastTimeoutId);
            this._lastTimeoutId = 0;
        }
        while (this.keys.length > 0) {
            const span = this.keys[0] - Date.now();              //FF.trace("span=" + span, "key=",this.keys[0]);
            if (span <= 0) {           // ready to fire!
                const val = this.vals[0];  // get val from queue before removing
                this.keys.shift();         // then remove it from queue
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



setTimeout(()=>{console.log("foo")},2000)
