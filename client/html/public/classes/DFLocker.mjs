
class DFLocker {        // performs the rough equivalent of a mutex lock
    async lock(id=0) {
        let lockResolver;
        if (id) {
            if (this.#ownerId === id) {
                ++this.#lockCount;
                return id;
            }
        }

        if (this.#lockCount > 0) {      // prevent 'await-releasing' when there's nothing to await for yet
            await this.#lockHandle;    // Wait for previous lock to finish
        }
    
        ++this.#lockCount;      // should've been 0, now 1
        let resolver;
        const newHandle = new Promise(resolve => {        // Create new lock
          resolver = resolve;
        });
    
        this.#lockHandle   = newHandle;
        this.#lockResolver = resolver;
        this.#ownerId       = this.#nextOwnerId++;
        return this.#ownerId;
    }
  
    unlock(id) {
        if (id != this.#ownerId || !this.#lockResolver) {
            return false;
        }
        --this.#lockCount;
        if (this.#lockCount > 0) {
            return false;
        }
        this.#lockResolver();
        this.#lockResolver = null;
        this.#ownerId = 0;
        return true;
    }

    get count()  { return this.#lockCount; }
    set count(v) { throw new Error("Attempt to set readonly property"); }

    constructor() {
        // this.#lockHandle = Promise.resolve();    // create a resolved promise that acts like a faux lock that starts unlocked 
        //   (no longer needed since we test for #lockCount > 0 now)
    }
    #lockHandle;     // the promise that locks await on
    #lockResolver;   // the funcptr to the promises 'resolve()'
    #ownerId = 0;
    #nextOwnerId = 1;
    #lockCount = 0;
};
export { DFLocker };

/*test start

debugger;
let x = new DFLocker();
let id1 = await x.lock();  console.log(x.count);         // get and hold our first lock, C=1
setTimeout(async() => {
    debugger; 
    setTimeout(async() => {let id2 = await x.lock(id1); console.log(x.count);}, 0);   // should increment count and return immediately,  C=2
    setTimeout(async() => {let id3 = await x.lock(id1); console.log(x.count);}, 0);   // increment again  (id1,2,3 all = same),  C=3
    setTimeout(async() => {console.log(x.unlock(id1)); console.log(x.count);}, 0);    // false, count reduced  C=2
    setTimeout(async() => {console.log(x.unlock(id1)); console.log(x.count);}, 0);     // false, count reduced C=1
    setTimeout(async() => {console.log(x.unlock(id1)); console.log(x.count);}, 0);     // true, (final unlock) C= = 0   
    setTimeout(async() => {console.log(x.unlock(id1)); console.log(x.count);}, 0);     // false, not locked, C=0
}, 0);

debugger; 
let tmp = await x.lock(); console.log(x.count);    // waits for all of the above to complete THEN C=1
x.unlock(tmp);            console.log(x.count);    // unlocks the lock to clear everything, C=0
debugger;

/*test end*/