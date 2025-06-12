
export class DFSortedList {
    keys = [];
    vals = [];
    get length() { return this.keys.length; }

    add(key, val) { // return idx of new insert, or -idx if replaced entry
        let idx;
        for (idx = 0; idx < this.keys.length; idx++) {
            if (this.keys[idx] === key) {
                this.vals[idx] = val;
                return -idx;
            }
            if (this.keys[idx] > key) {
                this.keys.splice(idx, 0, key);
                this.vals.splice(idx, 0, val);
                return idx;
            }
        }
        this.keys.push(key);
        this.vals.push(val);
        return idx;
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
    removeByIdx(idx) {  // return num remaining or -1
        if (idx >= 0 && idx < this.keys.length) {
            this.keys.splice(idx, 1);
            this.vals.splice(idx, 1);
            return this.keys.length;
        }
        return -1;
    }
    getByIdx(idx) {     // return [key, val, idx] or null
        if (idx >= 0 && idx < this.keys.length) {
            return [this.keys[idx], this.vals[idx], idx];
        }
        return null;
    }
    getByKey(key) {     // return [key, val, idx] or null
        const idx = this.keys.indexOf(key);
        if (idx === -1) {
            return null;
        }
        return [this.keys[idx], this.vals[idx], idx];
    }
    setByIdx(idx, nuVal) {   // return [key, val, idx] or null
        if (idx >= 0 && idx < this.keys.length) {
            this.vals[idx] = nuVal;
            return [this.keys[idx], this.vals[idx], idx];
        }
        return null;
    }
    setByKey(key, nuVal) {   // return [key, val, idx] or null
        const idx = this.keys.indexOf(key);
        if (idx === -1) {
            return null;
        }
        this.vals[idx] = nuVal;
        return [this.keys[idx], this.vals[idx], idx];
    }
// function testFn(what, entry) --compare what to entry(this.vals[idx]), return t/f if matched
    find(what, testFn) {  // return [key, val, idx] based on testFn or null if not found, NOTE: ONLY finds FIRST match!
        for (let idx = 0; idx < this.vals.length; idx++) {
            if (testFn(what, this.vals[idx])) {
                return [this.keys[idx], this.vals[idx], idx];
            }
        }
        return null;
    }
}
