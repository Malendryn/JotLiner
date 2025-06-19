/*!
 * DFSingleFire.js
 * Copyright (c) Malendryn Tiger (Ron Stanions @ DragonsFire Creations)
 *
 * This software is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the License at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/
/*
call anything 'only once', but track how many times the same call and same params were passed so we can remove it later
   (EX: to prevent duplication of addEventListener count,  loadStyle())
   
usage:
create 2 functions like this:
    function onFirst(payload) {...}  // same data with __DFId added, throws error if fails
    function onRemove(payload) {...} // same data with __DFId added, throws are caught and ignored so removeAll can continue

connect them to DFSingleFire like this:
    x = new DFSingleFire();
    id = x.add({payload}, onFirst, onRemove)  // call onFirst(payload) once,  throw if onFirst throws
                                                // return id, return same id if same payload+onFirst added again
    x.remove(id)                              // call onRemove(payload) via id, 
                                                // return #remaining (0 if last), -1 if already removed, -2 if key!found
    x.removeAll()                             // remove all tracked by calling onRemove(payload) on each

**** RULES:
**** payload MUST be a dict{} as we internally add __DFId and _onRemove to it
**** payload is keyed off ONLY toplevel elements, it does not walk into lists and objects to keyify off them
        (solves '{el:document.createElement("div")}' dilemma where el: was walked as a {} and matched by accident)

*/

export class DFSingleFire {
    constructor() {
        this.hasher = new _IdHasher();
        this.entries = new Map();       // key, maps to { id:idCounter++, refCount:refCount, onRemove:onRemove }
        this.idToKey = new Map();       // id returned to user (maps to key in entries
        this.idCounter = 1;             // IDs start at 1
    }

    async add(payload, onFirst, onRemove = () => {}) {
        payload.__onFirst = onFirst;        // put this in the payload as part of the keyHash
        // payload.__onRemove = onRemove;   // but NOT this!
        const key = this.hasher.hash(payload);
        let entry = this.entries.get(key);

        if (entry) {
            entry.refCount++;
        } else {
            payload.__DFId = this.idCounter;    // pass id to onFirst/onRemove for them to use too (AFTER hashing above)
            await onFirst(payload);             // call before inserting in case it throws

            entry = { 
                id:       this.idCounter++, 
                refCount: 1, 
                onRemove:  () => onRemove(payload)  // use closure so payload gets passed for EG: removeEventListener()
            };
            this.entries.set(key, entry);
            this.idToKey.set(entry.id, key);
        }
        return entry.id;
    }

    async remove(id) {
        const key = this.idToKey.get(id);
        if (!key)   { return -1; }      // no such key-or-entry was found

        const entry = this.entries.get(key);
        if (!entry) { return -1; }      // no such key-or-entry was found

        if (--entry.refCount <= 0) {
            this.entries.delete(key);
            this.idToKey.delete(id);
            try {
                await entry.onRemove?.();
            } catch (err) {}            // catch and silently ignore
        }
        return entry.refCount;          // return # refs remaining
    }

    async removeAll() {
        for (const [key, entry] of this.entries) {
            await entry.onRemove?.();
            this.idToKey.delete(entry.id);
        }
        this.entries.clear();
    }
}


class _IdHasher {
    constructor() {
        this.fnIds = new WeakMap();
        this.objIds = new WeakMap();
        this.counter = 0;
    }

    getId(x) {
        const t = typeof x;
        if (x === null)        { return "null";      }
        if (t === "undefined") { return "undefined"; }
        if (t === "boolean" || t === "number" || t === "string") { 
            let str = JSON.stringify(x);        
            let hash = 2166136261;                  // convert to FNV-1a hashed stringVal
            for (let i = 0; i < str.length; i++) {
                hash ^= str.charCodeAt(i);
                hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
            }
            return (hash >>> 0).toString(); // unsigned 32-bit number
        }
        if (t === "function") {
            if (!this.fnIds.has(x)) this.fnIds.set(x, `fn#${this.counter++}`);
            return this.fnIds.get(x);
        }
        if (t === "object") {
            if (!this.objIds.has(x)) this.objIds.set(x, `obj#${this.counter++}`);
            return this.objIds.get(x);
        }
        throw new Error("Unsupported type: " + t);
    }

    hash(value) {   // toplevel only, no traversing, value is always a dict
        const keys  = Object.keys(value).sort();                     // sort keys cuz order matters when hashing
        const parts = keys.map(k => `${k}:${this.getId(value[k])}`);
        return `{${parts.join(",")}}`;
    }
    // hash(value) {    // traverses anything, breaks tests against {a:3} === {a:3} when theyre truly different
    //     const t = typeof value;
    //     if (value === null || t === "function" || t !== "object") {
    //         return this.getId(value);
    //     }
    //     if (Array.isArray(value)) {
    //         return "[" + value.map(v => this.hash(v)).join(",") + "]";
    //     }
    //     const keys  = Object.keys(value).sort();                     // sort keys cuz order matters when hashing
    //     const parts = keys.map(k => `${k}:${this.hash(value[k])}`);
    //     return `{${parts.join(",")}}`;
    // }
}

/* test code
const once = new DFSingleFire();

function test1() {
    console.log("test1 called");
}
function test2() {
    console.log("test2 called");
}

function onFirst(payload) {
    console.log("onFirst payload=" + JSON.stringify(payload));

}
function onRemove(payload) {
    console.log("onRemove payload=" + JSON.stringify(payload));
}

let id;
id = await once.add({ type: "style", href: "/dark.css", fn:test1, arr:[1,[2],3], dd:{a:{b:3}} }, onFirst, onRemove);
console.log("added id = " + id);
id = await once.add({ type: "style", href: "/dark.css", fn:test2, arr:[1,[2],3], dd:{a:{b:3}} }, onFirst, onRemove);
console.log("added id = " + id);

id = await once.add({ type: "style", href: "/dark.css", fn:test1, arr:[1,[2],3], dd:{a:{b:3}} }, onFirst, onRemove);
console.log("added id = " + id);

console.log("remove=", await once.remove(1));     // expect 1
console.log("remove=", await once.remove(1));     // expect 0
console.log("remove=", await once.remove(1));     // expect -1
console.log("remove=", await once.remove(2));     // expect 0
console.log("remove=", await once.remove(2));     // expect -1
console.log("remove=", await once.remove(3));     // expect -1
*/