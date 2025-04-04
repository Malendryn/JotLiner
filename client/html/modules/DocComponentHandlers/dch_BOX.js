
// load/save()  converts docudata to/from DocComponentHandlers, 
// render()     handles rendering the box inside which children[] DocComponentHandlers reside in

class DCH_BOX extends FG.DCH_BASE {
    type = -1;       // spclcase, lowlevel loader

    children = [];

    async load(sr)     { return await _load.call(this, sr); }   // load content, return ptr
    async render()              {        await _render.call(this);           }   // rerender entire object and all its children


//#####################################################################################################################
    constructor() {
        super();
        this.type = -1;  // Special class, has control of the StreamReader
    };
};
export { DCH_BOX as DCH };

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function _load(sr) {     // this loader loads the 'out of band' stuff not specifically inside a component
    let numChildren = parseInt(await sr.readNext());
    while (numChildren-- > 0) {
        let tmp = await FF.dchLoader.load(sr);
        tmp.parent = this;
        this.children.push(tmp);
    }
}

    
function _render() {                // render the box and all its children
    debugger;
}


