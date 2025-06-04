/*
call anything only once, but track how many times the same call and same params were passed so we can remove it later

usage:
x = new DFSingleFire();
id = x.add({payload}, onFirst, onRemove)  // call onFirst(payload) once,  return id, if repeated, return same id
x.remove(id)                              // call onRemove(id), return #remaining, -1 if already removed, -2 if key!found
*/

export class DFSingleFire {
    constructor() {
        this.hasher = new _IdHasher();
        this.entries = new Map();       // key, maps to { id:idCounter++, refCount:refCount, onRemove:onRemove }
        this.idToKey = new Map();       // id returned to user (maps to key in entries
        this.idCounter = 1;             // IDs start at 1
    }

    async add(payload, onFirst, onRemove = () => {}) {
        payload.__onFirst = onFirst;      // put this in the payload so they get hashed too
        // payload.__onRemove = onRemove;   // but NOT this!
        const key = this.hasher.hash(payload);
        let entry = this.entries.get(key);

        if (entry) {
            entry.refCount++;
        } else {
            await onFirst(payload);
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
            await entry.onRemove?.();
            this.entries.delete(key);
            this.idToKey.delete(id);
        }
        return entry.refCount;      // return # refs remaining
    }

    count(payload) {
        const key = this.hasher.hash(payload);
        return this.entries.get(key)?.refCount ?? 0;
    }

    removeAll() {
        for (const [key, entry] of this.entries) {
            entry.teardown?.();
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
        if (t === "boolean" || t === "number" || t === "string") { return JSON.stringify(x); }
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

    hash(value) {
        const t = typeof value;
        if (value === null || t === "function" || t !== "object") {
            return this.getId(value);
        }
        if (Array.isArray(value)) {
            return "[" + value.map(v => this.hash(v)).join(",") + "]";
        }
        const keys  = Object.keys(value).sort();                     // sort keys cuz order matters when hashing
        const parts = keys.map(k => `${k}:${this.hash(value[k])}`);
        return `{${parts.join(",")}}`;
    }
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