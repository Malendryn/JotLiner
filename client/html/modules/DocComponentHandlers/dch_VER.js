
// this class is an extreme outlier as it has no real home in the document proper but is kept as a component for 'generic operability' across the board
class DCH_VER extends FG.DCH_BASE {
    construct() {
        this.hasDiv   = false;   // see baseclass
        this.hasChunk = false;   // see baseclass
    }
// baseclass functions that are overridden below
    // async load(sr, parent)  // load content
    // async unload()          // load content
    // async render()          // render entire object and all its children

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(parent) {
        super(parent);
    };


    async parse(sr) {
        const ver = await sr.readNext();
        FG.docVersion = ver.split(".").map(ss => parseInt(ss)); // store the doc version as [ major, minor, patch]
    }
    
    
    async unparse() {     // this loader loads the 'out of band' stuff not specifically inside a component
        debugger; await super.unload();
    }
    
    
    async render() {
        // nullfunc, this object doesn't render
    }
};
export { DCH_VER as DCH };      // always export 'as DCH' for docloader to attach to globalThis.DCH
