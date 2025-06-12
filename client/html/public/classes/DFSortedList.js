
export class DFSortedList {
    keys = [];
    vals = [];
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
    remove(key) {   // returns idx of deleted entry or -1 if none was found
        for (let idx = 0; idx < this.keys.length; idx++) {
            if (this.keys[idx] === key) {
                this.keys.splice(idx, 1);
                this.vals.splice(idx, 1);
                return idx;
            }
        }
        return -1;
    }
}
