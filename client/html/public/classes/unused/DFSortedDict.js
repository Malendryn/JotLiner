/*!
 * DFSortedList.js
 * Copyright (c) Malendryn Tiger (Ron Stanions @ DragonsFire Creations)
 *
 * This software is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the License at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/
/*
    similar to Map() but 'key' is always sorted  (hence works best if key is always same datatype like number, string, etc)
*/

export class DFSortedList {
    uids = [];  // unique integers that map to keys  (replaces 'idx' as an immutable value no longer relative to index)
    keys = [];  // like the {key:val} part of a dict except not limited to strings
    vals = [];  // like the {key:val} part of a dict

    get length() { return this.keys.length; }
   
    add(key, val) { // return uid of new insert, or -uid if replaced entry
        let idx = this.keys.length;
        while (--idx >= 0) {
            if (this.keys[idx] === key) {
                this.vals[idx] = val;
                return -this.uids[idx];
            }
            if (this.keys[idx] < key) {
                const uid = ++this._nextId;
                idx += 1;  // bump idx forward one to insert after the found key
                this.uids.splice(idx, 0, uid);
                this.keys.splice(idx, 0, key);
                this.vals.splice(idx, 0, val);
                return uid;
            }
        }
        const uid = ++this._nextId;
        this.uids.unshift(uid);        // prepend if lowest key
        this.keys.unshift(key);
        this.vals.unshift(val);
        return uid;
    }

    removeByKey(key) {   // return num remaining or -1
        for (let idx = 0; idx < this.keys.length; idx++) {
            if (this.keys[idx] === key) {
                this.keys.splice(idx, 1);
                this.vals.splice(idx, 1);
                return this.keys.length;
            }
        }
        return -1;
    }
    removeByUid(uid) {  // return num remaining or -1
        let idx = this.uids.indexOf(uid);
        if (idx >= 0) {
            this.keys.splice(idx, 1);
            this.vals.splice(idx, 1);
            this.uids.splice(idx, 1);
            return this.keys.length;
        }
        return -1;
    }

    getByUid(uid) {     // return [key, val, uid] or null
        let idx = this.uids.indexOf(uid);
        if (idx >= 0) {
            return [this.keys[idx], this.vals[idx], this.uids[idx]];
        }
        return null;
    }
    getByKey(key) {     // return [key, val, uid] or null
        const idx = this.keys.indexOf(key);
        if (idx === -1) {
            return null;
        }
        return [this.keys[idx], this.vals[idx], this.uids[idx]];
    }

    setByUid(uid, nuVal) {   // return updated [key, val, uid] or null
        let idx = this.uids.indexOf(uid);
        if (idx >= 0) {
            return [this.keys[idx], this.vals[idx], this.uids[idx]];
        }
        return null;
    }
    setByKey(key, nuVal) {   // return [key, val, uid] or null
        const idx = this.keys.indexOf(key);
        if (idx === -1) {
            return null;
        }
        this.vals[idx] = nuVal;
        return [this.keys[idx], this.vals[idx], this.uids[idx]];
    }

    find(what, testFn) {    //   compare what to this.vals[...], return t/f if matched
                            // return [key, val, uid] based on testFn or null if not found, NOTE--ONLY finds FIRST match!
        for (let idx = 0; idx < this.vals.length; idx++) {
            if (testFn(what, this.vals[idx])) {
                return [this.keys[idx], this.vals[idx], this.uids[idx]];
            }
        }
        return null;
    }
    _nextId = 0;
}
