
class DCH_TXT extends FG.DCH_BASE {
    txt = "";

// baseclass-overridden functions
    async load(sr)     {        await _load.call(this, sr);   }   // load content
    async unload()     {        await _unload.call(this);     }   // load content
    async render(div)  {        await _render.call(this);     }   // rerender entire object and all its children

//#####################################################################################################################
    constructor() {
        super();
    };
};
export { DCH_TXT as DCH };      // always export 'as DCH' for docloader to attach to globalThis.DCH


async function _load(sr) {
    const len = await sr.length();        // get however many bytes remain in the stream
    this.txt = await sr.readChunk(len);   // read entire thing (no need to shrink as it's about to be tossed)
}


async function _unload() {     // this loader loads the 'out of band' stuff not specifically inside a component
    let numChildren = parseInt(await sr.readNext());
    while (numChildren-- > 0) {
        let tmp = await FF.dchLoader.load(sr);       // load the object
        tmp.parent = this;                              // set its parent to this box
        this.children.push(tmp);                        // and finally add it to the children of this box
    }
}


async function _render(div) {                // render the box and all its children
    debugger; div.innerHTML = this.txt;
}
