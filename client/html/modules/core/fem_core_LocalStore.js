class LocalStore {
// get/set curDb:       get or set the current database that is open into localstorage, and load all relative data as well
// get/set curDoc:      get or set the current document selected within the curDb
// get openIndexes:     retrieve the list of open indexes,  .push() delete [el] all work on this
// get/set sliderPos:   get/set the current index<->document slider position
// purgeMissing(dbList) remove localStorage for db's that are not in this list

    get curDb()  { return this.#curDbName }
    set curDb(v) { localStorage.setItem("JL:Db", v);  this.#loadStore(); }

    get curDoc()  { return this.#curDbData.curDoc; }
    set curDoc(v) { this.#curDbData.curDoc = v;  this.#store(); }

    get openIndexes()  { return this.#curDbData.openIndexes.slice(); }
    set openIndexes(v) { this.#curDbData.openIndexes = v;  this.#store(); }

    get sliderPos()    { return this.#curDbData.sliderPos; }
    set sliderPos(v)   { this.#curDbData.sliderPos = v;  this.#store(); }

    #curDbName;
    #curDbData;
    #clearDbData() {
        this.#curDbName = "";
        this.#curDbData = {
            curDoc: "",
            openIndexes: [],
            sliderPos: 200,
        };
    }

    constructor() {
        Object.seal(this);
        this.#loadStore();
    }

    #loadStore() {
        this.#clearDbData();
        let tmp = localStorage.getItem("JL:Db");
        if (tmp !== null) {
            this.#curDbName = tmp;
            tmp = localStorage.getItem(`JL:Db:${this.#curDbName}:Data`);
            if (tmp) {
                this.#curDbData = JSON.parse(tmp);
            }
        }
    } 

    purgeMissing(dbList) {
       if (!dbList.includes(this.curDb)) {       // first, remove curDb if no longer valid
            localStorage.removeItem("JL:Db");
        }
        for (let idx = localStorage.length - 1; idx >= 0; idx--) {  // delete any stale localStorage refs for nonexistent db's
            const key = localStorage.key(idx);
            if (key.startsWith("JL:Db:")) {
                const wrd = key.split(":")[2];      // split out and capture the dbName from the key
                if (!dbList.includes(wrd))  {       // this database is no longer available...
                    localStorage.removeItem(key);   // ...so remove the localStorage memory of it
                }
            }
        }
        this.#loadStore();      // refresh 'self'
    }

    #store() {
        if (this.#curDbName) {
            localStorage.setItem(`JL:Db:${this.#curDbName}:Data`, JSON.stringify(this.#curDbData));
        }
    }
};
globalThis.LS = new LocalStore();

// LS.curDb = "foo";
// let qq = LS.curDb;
// console.log(qq);
// debugger;