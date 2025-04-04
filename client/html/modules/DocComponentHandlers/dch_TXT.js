
class DCH_TXT extends FG.DCH_BASE {
    txt = "";
    async load(sr)    { return await _load.call(this, sr); }       // load str (possibly binary)
    async render()    {        await  _render.call(this);  }       // rerender entire object and all its children


//#####################################################################################################################
    constructor() {
        super();
    };
};
export { DCH_TXT as DCH };      // always expoart 'as DCH' for docloader to attach to globalThis.DCH


async function _load(sr) {
    const len = await sr.length();        // get however many bytes remain in the stream
    this.txt = await sr.readChunk(len);   // read entire thing (no need to shrink as it's about to be tossed)
}


async function _render() {                // render the box and all its children
    debugger;
}

