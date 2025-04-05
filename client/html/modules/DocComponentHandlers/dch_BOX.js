
// load/save()  converts docudata to/from DocComponentHandlers, 
// render()     handles rendering the box inside which children[] DocComponentHandlers reside in

class DCH_BOX extends FG.DCH_BASE {
    hasChunk    = false;     // false = load as "byteCount;byteData", true=pass sr as-is for lowlevel processing

    children = [];

// baseclass functions that are overridden below
    // async load(sr, parent)  // load content
    // async unload()          // load content
    // async render()          // render entire object and all its children

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
        super();
        this.type = -1;         // Special class, has control of the StreamReader
    };


    async load(sr, parent) {      // this loader loads the 'out of band' stuff not specifically inside a component
        let chunk = await super.load(sr, parent);     // since hasChunk=false, chunk=null
        let numChildren = parseInt(await sr.readNext());
        while (numChildren-- > 0) {
            let tmp = await FF.docComponentLoader.load(sr, this); // load a child object
            this.children.push(tmp);                              // and finally add it to the children of this box
        }
    }


    async unload() {     // this loader loads the 'out of band' stuff not specifically inside a component
        debugger; await super.unload();
        let numChildren = parseInt(await sr.readNext());
        while (numChildren-- > 0) {
            let tmp = await FF.docComponentLoader.load(sr);       // load the object
            tmp.parent = this;                              // set its parent to this box
            this.children.push(tmp);                        // and finally add it to the children of this box
            
        }
    }

    async render() {
        let div = await super.render();
        for (const child of this.children) {
            await child.render();
        }
    }
};
export { DCH_BOX as DCH };      // always export 'as DCH' for docloader to attach to globalThis.DCH


