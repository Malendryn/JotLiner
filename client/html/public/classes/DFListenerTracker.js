/*!
 * DFListenerTracker.js
 * Copyright (c) Malendryn Tiger (Ron Stanions @ DragonsFire Creations)
 *
 * This software is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the License at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/
/*
usage:
    const tracker = new DFListenerTracker();
    const id = tracker.add(buttonEl, "click", onClick, true);
    tracker.remove(id);
    tracker.removeAll();

    add(el, action, callback, opts=undefined) // add a listener to be tracked.
        el:        any DOM element, including document and window
        action:    a "text" string like  "click" or "mousemove"
        callback:  a callback expecting a single (event) parameter
        opts:      options you would pass to any normall eventListener, default=undefined

            works just like a normal addEventListener call except allows you to keep track
            for easier removal later on.  So for example, where you would have:
                el.addEventListener("button", onButton, true);
                -here you would use-
                .add(el, "button", onButton, true)
        RETURNS:  an integer value you can use as an id.

    remove(id) 
        removes any formerly added eventListener by the id returned.
        RETURNS: remaining number of listeners added with the same parameters.  
          -or-   -1 if unable to find listener to remove/was already removed

    removeAll()
        removes all listeners added by add to this instance of DFListenerTracker
        RETURNS: nothing
    
*/

import { DFSingleFire } from "./DFSingleFire.js"

export class DFListenerTracker {
    constructor() {
         this.sf = new DFSingleFire();
    }

    async add(el, type, cb, opts = false) {
        const dict = { el, type, cb, opts };
        return await this.sf.add(dict, this._add, this._remove);
    }

    async _add(payload) {
        const el = payload.el;
        const type = payload.type;
        const cb = payload.cb;
        const opts = payload.opts;
        el.addEventListener(type, cb, opts);
    }

    async remove(id) {
        return await this.sf.remove(id);
    }

    async _remove(payload) {
        const el = payload.el;
        const type = payload.type;
        const cb = payload.cb;
        const opts = payload.opts;
        el.removeEventListener(type, cb, opts);
    }

    async removeAll() {
        await this.sf.removeAll();
    }
}

/*
class DFListenerTracker {
    add(el, type, cb, opts = false) {
        const idx = this._findListener(el, type, cb, opts);  // Find if this exact listener already exists
        let listenerId;
        if (idx) {                                  // we found an existing listener
            const listener = this._listeners.get(idx);
            listener.count++;                       // increment its use count
            listenerId = idx;
        } else {
            el.addEventListener(type, cb, opts);    // new, add listener and...
            listenerId = ++this._listenerId;        // ...use a new entry id
            this._listeners.set(listenerId, {el, type, cb, opts:JSON.stringify(opts || null), count:1});
        }
        const entryId = ++this._entryId;
        this._entries.set(entryId, listenerId);     // return always-unique new id mapped to the counted listener
        return entryId;
    }

    remove(id) {
        const listenerId = this._entries.get(id);
        if (!listenerId) {
            return -1;          // -1 to indicate key wasn't found
        }
        const val = this._listeners.get(listenerId);   // get the listener

        this._entries.delete(id);               // delete from _entries
        if (--val.count === 0) {                // decrement it, if zero delete it
            val.el.removeEventListener(val.type, val.cb, JSON.parse(val.opts));
            this._listeners.delete(listenerId);
        }
        return val.count;       // return remaining listencount or 0 if just got removed
    }

    removeAll() {
        while (this._entries.size > 0) {
            const id = this._entries.keys().next().value;
            this.remove(id);
        }
    }

    _findListener = (el, type, cb, opts) => {            // find the id of the entry in _listeners
        opts = JSON.stringify(opts || null);
        for (const [id, entry] of this._listeners.entries()) {
            if (entry.el === el && entry.type == type && entry.cb === cb && entry.opts == opts) {
                return id;      // found matching id
            }
        }
        return null;            // not found
    }

    constructor() {
        this._entries   = new Map(); // integer id:  .__listener id
        this._listeners = new Map(); // integer id: {id, el, type, cb, opts, count}
        this._entryId = 0;
        this._listenerId = 0;
    }
}
export { DFListenerTracker };
/**/