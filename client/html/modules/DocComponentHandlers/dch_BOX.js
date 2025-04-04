
// load/save()  converts docudata to/from DocComponentHandlers, 
// render()     handles rendering the box inside which children[] DocComponentHandlers reside in

class DCH_BOX extends FG.DCH_BASE {
    isRaw       = true;     // false = load as "byteCount;byteData", true=pass sr as-is for lowlevel processing

    children = [];

// baseclass-overridden functions
    async load(sr)     {        await _load.call(this, sr);       }   // load content
    async unload()     {        await _unload.call(this);         }   // load content
    async render(div)  {        await _render.call(this, div);  }   // rerender entire object and all its children

//#####################################################################################################################
    constructor() {
        super();
        this.type = -1;         // Special class, has control of the StreamReader
    };
};
export { DCH_BOX as DCH };      // always export 'as DCH' for docloader to attach to globalThis.DCH

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function _load(sr) {     // this loader loads the 'out of band' stuff not specifically inside a component
    let numChildren = parseInt(await sr.readNext());
    while (numChildren-- > 0) {
        let tmp = await FF.dchLoader.load(sr);       // load the object
        tmp.parent = this;                              // set its parent to this box
        this.children.push(tmp);                        // and finally add it to the children of this box
    }
}


async function _unload() {     // this loader loads the 'out of band' stuff not specifically inside a component
    let numChildren = parseInt(await sr.readNext());
    while (numChildren-- > 0) {
        let tmp = await FF.dchLoader.load(sr);       // load the object
        tmp.parent = this;                              // set its parent to this box
        this.children.push(tmp);                        // and finally add it to the children of this box
    }
}


async function _render(div) {             // render the box and all its children
    let el = await this.makeDiv(div);     // create a div for this and set its XYWH
    div.appendChild(el);

//RSTEMP get-us-going mods to experiment on the el
    // el.style.position = "relative";
    el.style.border = "1px solid black";
    el.style.backgroundColor = "lightsalmon";
    el.style.overflow = "hidden";
    el.style.whiteSpace = "nowrap";
//RSTEMP.end
debugger; return;
    for (const comp of this.children) {
        let el2 = comp.makeDiv(el)              // initialize and place a div for this object to live in

//RSTEMP get-us-going mods to experiment on the el
        // el.style.position = "relative";
        el2.style.border = "1px solid black";
        el2.style.backgroundColor = "lightsalmon";
        el2.style.overflow = "hidden";
        el2.style.whiteSpace = "nowrap";
//RSTEMP.end

        el.appendChild(el2);
    }
}
