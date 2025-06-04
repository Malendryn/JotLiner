/*
how can we write a generic tracker for something, in this case we're talking about a style loader/unloader
*/

/*
ownerId is anything, a number, a word, just something 'unique' that says this style was loaded by class/function/module 'x'
so that it can be removed using removeAllStylesByOwner(ownerId) later
*/
async function addStyle(ownerId, style) {    // idx is only for errormsgs
    const isBlock = /^\s*<style[\s>][\s\S]*<\/style>\s*$/i.test(style.trim()); //true if valid  "<style></style>"  else false=assume filepath
      if (!isBlock) {
        const response = await fetch(style);
        if (!response.ok) {
            console.warn(`Failed to download styles[${idx}] (${style}) as a css file`);
            return;                             // fail silently (std practice in webpages)
        }
        style = "<style>" + await response.text() + "</style>";
    }

    let el = document.createElement("div");     // first load and validate the form
    el.innerHTML = style;
    el = el.firstElementChild;
    if (!el || el.tagName != "STYLE") {
        console.warn(`Parameter {styles:[${idx}]} missing outermost <style></style> element`);
        return;
    }
    el.dataset[styleId] = "";                    // content is irrelevant,  that it exists is all that matters
    document.head.appendChild(el);               // stick it in!
}


/* track anything by its id-and-callback
    payload MUST be a {} with at least one property matching 'key' and used as as a distinctifier (can be absolutely anything)
*/
class Tracker {
    constructor(key) {  // constructor (addCallback, removeCallback)  ??? and no key, just hash the payload and return that as id
        this.key = key;
    }
    dict = {};
    async add(callback, payload) { // callback({payload}) return count of times added to dict or -1 if key missing from payload
        if (!this.key in payload) {
            return -1;
        }
        const keyVal = payload[this.key];   // get key's value from payload
        if (!this.dict[keyVal]) {           // if not exist in dict, add it
            this.dict[keyVal] = 0;
            callback(payload);
        }
        ++this.dict[keyVal];                // increment it


    }

    async remove(keyVal, callback) {   // callback(id) return count remaining or -1 if none removed

    }

    async RemoveAll(callback) {  // return count removed
        for (const keyVal of Object.keys(this.dict) {

        }
        this.dict = {};
    }
}


function addStyle({id, style}) {/*...*/}
function removeStyle({id, style}) { /*...*/}


let x = new Tracker();
x.add


class StyleManager {
    constructor() {
      this.styles = new Map(); // key => { count, node }
    }
  
    _hash(payload) {
      // Normalize object keys to ensure stable hashing
      return typeof payload === 'string'
        ? payload
        : JSON.stringify(payload, Object.keys(payload).sort());
    }
  
    add(payload, createNodeFn) {
      const key = this._hash(payload);
  
      if (this.styles.has(key)) {
        this.styles.get(key).count++;
        return;
      }
  
      const node = createNodeFn(payload);
      document.head.appendChild(node);
      this.styles.set(key, { count: 1, node });
    }
  
    remove(payload) {
      const key = this._hash(payload);
      const entry = this.styles.get(key);
  
      if (!entry) return;
  
      entry.count--;
      if (entry.count <= 0) {
        entry.node.remove();
        this.styles.delete(key);
      }
    }
  
    removeAll() {
      for (const { node } of this.styles.values()) {
        node.remove();
      }
      this.styles.clear();
    }
  }

  //////////////////////////////////////
  class RefCountStore {
    constructor(cbAdd, cbRemove = () => {}) {
      this.cbAdd = cbAdd;
      this.cbRemove = cbRemove;
      this.map = new Map(); // id -> { count, payload, promise }
    }
  
    static _hash(payload) {
      const stable = typeof payload === 'string'
        ? payload
        : JSON.stringify(payload, Object.keys(payload).sort());
  
      let hash = 2166136261;
      for (let i = 0; i < stable.length; i++) {
        hash ^= stable.charCodeAt(i);
        hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
      }
  
      return (hash >>> 0).toString(36);
    }
  
    async add(payload) {
      const id = RefCountStore._hash(payload);
  
      if (this.map.has(id)) {
        this.map.get(id).count++;
        return id;
      }
  
      const promise = Promise.resolve().then(() => this.cbAdd(payload));
      this.map.set(id, { count: 1, payload, promise });
      return id;
    }
  
    async remove(id) {
      const entry = this.map.get(id);
      if (!entry) return;
  
      entry.count--;
      if (entry.count <= 0) {
        await Promise.resolve(this.cbRemove(entry.payload));
        this.map.delete(id);
      }
    }
  
    async removeAll() {
      for (const { payload } of this.map.values()) {
        await Promise.resolve(this.cbRemove(payload));
      }
      this.map.clear();
    }
  
    get(id) {
      return this.map.get(id);
    }
  }