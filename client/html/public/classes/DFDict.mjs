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
it keeps the order of entries added,             like Map and {}
it supports any kind of data as a key,           like Map, but not {}
does NOT change the order if numeric             like Map, but not {}
can be export/imported in a JSON compatible way, like {} but not Map()

dict = new DFDict(iData=undefined)  // create a new DFDict object and optionally preload it with iData
    iData is either a list of tuples as [[key1,val1],[key2,val2],...]
dict.import(iData)                  // clear any existing data and load with  [[key1,val1],[key2,val2],...]
    iData is either a list of tuples as [[key1,val1],[key2,val2],...]

clear()     // erase entire content

getters:
    num = length  -- return the number of elements
    []  = keys    -- return new array of keys
    []  = values  -- return new array of values

    val   = getByKey(key)      -- returns val or this.NOEXIST if key not found
    [k,v] = getByIdx(idx)      -- returns [key, val] or null if not in range
    num   = indexOf(key)       -- return index of given key, or -1 if not found
    []    = getKeysForVal(val) -- find all keys that have this as their value and return a [] list of keys

    iData = export()           -- returns a list of tuples as [[key1,val1],[key2,val2],...]  (see iData above)

inserters:
    bool = prepend(key, val);         // insert key/val at beginning, true=success, false=key exists
    bool = append(key, val);          // insert key/val at end, return true=success, false=key exists
    sgn  = insertAtIdx(idx, key, val) // insert key/val at(before) idx, return 1=success, 0=key exists, -1=idx out of bounds

modifiers:
    bool = updateByKey(key, newVal)   // change val at key to newVal, return false if key not found
    sgn  = updateKeyByIdx(idx, key)   // change key at idx, return 1=succes, 0=key exists, -1=idx out of bounds
    bool = updateValByIdx(idx, val)   // change val at idx, return false if idx is out of range

deleters:
    bool = deleteByKey(key)     // delete entry by key, return true=success, false=key not found
    bool = deleteByIdx(idx);    // delete entry by index, return true=sugges, false=out of bounds
*/

export class DFDict {
    // KEYEXISTS = Symbol("KEYEXISTS");
    OORANGE   = Symbol("OORANGE");
    NOEXIST   = Symbol("NOEXIST");

    get length() { return this.#keys.length; }

    get keys() {            // return clone of #keys
        return this.#keys.slice();
    }

    get values() {          // return clone of #vals
        return this.#vals.slice();
    }
    
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


    getKeysForVal(val) {  // find all keys that have this as their value and return a [] list
        const list = [];
        for (let idx = 0; idx < this.#keys.length; idx++) {
            if (this.#vals[idx] === val) {
                list.push(this.#keys[idx]);
            }
        }
        return list;
    }

    insertAtIdx(idx, key, val) { 
        if (idx < 0 || idx > this.length) { // out of bounds
            return -1;       
        }
        const found = this._indexOfKey(key);
        if (found !== -1) {
            return 0;                   // key already exists, DO NOT overwrite!  fail with false
        }
        this.#keys.splice(idx, 0, key);
        this.#vals.splice(idx, 0, val);
        return 1;
    }

    getByKey(key) {
        const idx = this._indexOfKey(key);
        return idx !== -1 ? this.#vals[idx] : this.NOEXIST;
    }
    getByIdx(idx) {             // returns [key,val] or null
        if (idx >= 0 && idx < this.#vals.length) {
            return [this.#keys[idx], this.#vals[idx]];
        }
        return null;
    }
    indexOf(key) {               // return index of key or -1 if not found
        return this._indexOfKey(key);
    }


    updateByKey(key, newVal) {     // return success (t/f)
        const idx = this._indexOfKey(key);
        if (idx !== -1) {
            this.#vals[idx] = newVal;
            return true;
        } else {
            return false;
        }
    }
    updateKeyByIdx(idx, key) {
        const kidx = this._indexOfKey(key);
        if (kidx !== -1) {
            return 0;
        }
        if (idx >= 0 && idx < this.#vals.length) {
            this.#keys[idx] = key;
            return 1;
        }
        return -1;
    }
    updateValByIdx(idx, val) {
        if (idx >= 0 && idx < this.#vals.length) {
            this.#vals[idx] = val;
            return true;
        }
        return false;
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

    deleteByIdx(idx) {
        if (idx >= 0 && idx < this.#vals.length) {
            this.#keys.splice(idx, 1);
            this.#vals.splice(idx, 1);
            return true;
        }
        return false; 
    }

    clear() {
        this.#keys = [];
        this.#vals = [];
    }

    import(data) {          // clear and load tupled list into internal kv
        this.clear();
        for (const [k,v] of data) {
            this.append(k, v);
        }
    }
    export() {              // [[k,v], [k,v], ...]
        return this.#keys.map((k, i) => [k, this.#vals[i]]);
    }


    constructor(preload = undefined) {
        if (preload !== undefined) {
            this.import(preload);
        }
    }


///////////// internal funcs & props
    #keys = [];
    #vals = [];

    _indexOfKey(key) {                    // Finds index of a key, or -1 if not found
        return this.#keys.findIndex(k => Object.is(k, key));
    }
}