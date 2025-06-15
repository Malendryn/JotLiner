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

// this works but indexBased?  that's not super-compatible with the whole key/val concept of this class
    // insert(key, val, idx = this.length) {   // return true on succ, false if idx out of bounds OR key already exists
    //     if (idx < 0 || idx > this.length) { // out of bounds
    //         return false;       
    //     }
    //     const found = this._indexOfKey(key);
    //     if (found !== -1) {
    //         return false;                   // key already exists
    //     }
    //     this.#keys.splice(idx, 0, key);
    //     this.#vals.splice(idx, 0, val);
    //     return true;
    // }


    update(key, val) {
        const idx = this._indexOfKey(key);
        if (idx !== -1) {
            this.#vals[idx] = val;
            return true;
        } else {
            return false;
        }
    }


    clear() {
        this.#keys = [];
        this.#vals = [];
    }


    get keys() {            // return an iterator for the keys
        return this.#keys.values();
    }


    get values() {          // return an iterator for the values
        return this.#vals.values();
    }


    findKeysForValue(val) {
        const list = [];
        for (let idx = 0; idx < this.#keys.length; idx++) {
            if (this.#vals[idx] === val) {
                list.push(this.#keys[idx]);
            }
        }
        return list;
    }


    get(key) {
        const idx = this._indexOfKey(key);
        return idx !== -1 ? this.#vals[idx] : undefined;
    }


    has(key) {
        return this._indexOfKey(key) !== -1;
    }


    delete(key) {
        const idx = this._indexOfKey(key);
        if (idx !== -1) {
            this.#keys.splice(idx, 1);
            this.#vals.splice(idx, 1);
            return true;
        }
        return false;
    }


    entries() {
        return this.#keys.map((k, i) => [k, this.#vals[i]]);
    }


    export() {
        return JSON.stringify(this.entries());
    }


    import(data) {
        this.clear();
        data = typeof data === "string" ? JSON.parse(data) : data;
        for (const [k,v] of data) {
            this.append(k, v);
        }
    }


    constructor(data = undefined) {
        if (data !== undefined) {
            this.import(data);
        }
    }


    [Symbol.iterator]() {
        return this.entries()[Symbol.iterator]();
    }


///////////// internal funcs & props
    #keys = [];
    #vals = [];

    _indexOfKey(key) {                    // Finds index of a key, or -1 if not found
        return this.#keys.findIndex(k => Object.is(k, key));
    }
}