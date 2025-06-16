/*!
 * DFDict.js
 * Copyright (c) Malendryn Tiger (Ron Stanions @ DragonsFire Creations)
 *
 * This software is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the License at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/
/*
what this class does:
it is in essence a key/value pair handler like a basic {} object or a Map()
    but also supports idx insert/update/add/remove
it keeps the order of entries added,    like Map and {}
it supports any kind of data as a key,  like Map, but not {}
it supports JSON via export/import,     like {} but not Map()
*/

export class DFDict {
    get length() { return this.#keys.length; }

    
    prepend(key, val) {       // return true on succ, false if key already exists
        const idx = this._indexOfKey(key);
        if (idx !== -1) {     // if key already exists, return false
            return false;
        }
        this.#keys.unshift(key);
        this.#vals.unshift(val);
        return true;
    }


    append(key, val) {       // return true on succ, false if key already exists
        const idx = this._indexOfKey(key);
        if (idx !== -1) {     // if key already exists, return false
            return false;
        }
        this.#keys.push(key);
        this.#vals.push(val);
        return true;
    }

// insert uses idx which both volatile and not easily exposed as it's all key based, not idx based
// so maybe 'insertAfter(key, newKey, val)  'insertBefore...'

    insertByKey(x) {throw new Error("invalid method")}  // there is no insertByKey, use append or prepend instead
    getByKey(key) {
        const idx = this._indexOfKey(key);
        return idx !== -1 ? this.#vals[idx] : undefined;
    }
    deleteByKey(key) {          // return success (t/f)
        const idx = this._indexOfKey(key);
        if (idx !== -1) {
            this.#keys.splice(idx, 1);
            this.#vals.splice(idx, 1);
            return true;
        }
        return false;
    }
    updateByKey(key, val) {     // return success (t/f)
        const idx = this._indexOfKey(key);
        if (idx !== -1) {
            this.#vals[idx] = val;
            return true;
        } else {
            return false;
        }
    }
    hasKey(key) {               // return t/f
        return this._indexOfKey(key) !== -1;
    }

    getKeysForValue(val) {  // find all keys that have this as their value and return a [] list
        const list = [];
        for (let idx = 0; idx < this.#keys.length; idx++) {
            if (this.#vals[idx] === val) {
                list.push(this.#keys[idx]);
            }
        }
        return list;
    }


// note that index based functions can be volatile unless all actions until complete are wrapped in async/await
    insertBeforeIdx(key, val, idx = this.length) {   // return true on succ, false if idx out of bounds OR key already exists
        if (idx < 0 || idx > this.length) {      // out of bounds
            return false;       
        }
        const found = this._indexOfKey(key);
        if (found !== -1) {
            return false;                   // key already exists, DO NOT overwrite!  fail with false
        }
        this.#keys.splice(idx, 0, key);
        this.#vals.splice(idx, 0, val);
        return true;
    }
    getByIdx(idx) {             // returns [key,val] or null
        if (idx >= 0 && idx < this.#vals.length) {
            return [this.#keys[idx], this.#vals[idx]];
        }
        return null;
    }
    deleteByIdx(idx) {
        if (idx >= 0 && idx < this.#vals.length) {
            this.#keys.splice(idx, 1);
            this.#vals.splice(idx, 1);
            return true;
        }
        return false; 
    }
    updateKeyByIdx(idx, key) {
        if (idx >= 0 && idx < this.#vals.length) {
            this.#keys[idx] = key;
            return true;
        }
        return false;
    }
    updateValByIdx(idx, val) {
        if (idx >= 0 && idx < this.#vals.length) {
            this.#vals[idx] = val;
            return true;
        }
        return false;
    }


    clear() {
        this.#keys = [];
        this.#vals = [];
    }


    get keys() {            // return reft o #keys
        return this.#keys;
    }


    get values() {          // return ref to #vals
        return this.#vals;
    }

    entries() {             // [[k,v], [k,v], ...
        return this.#keys.map((k, i) => [k, this.#vals[i]]);
    }

    import(data) {          // clear and load tupled list into internal kv
        this.clear();
        data = typeof data === "string" ? JSON.parse(data) : data;
        for (const [k,v] of data) {
            this.append(k, v);
        }
    }
    export() { return this.entries(); } // convenience/mated function to import


    constructor(data = undefined) {
        if (data !== undefined) {
            this.import(data);
        }
    }


///////////// internal funcs & props
    #keys = [];
    #vals = [];

    _indexOfKey(key) {                    // Finds index of a key, or -1 if not found
        return this.#keys.findIndex(k => Object.is(k, key));
    }
}