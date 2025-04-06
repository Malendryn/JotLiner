
// this class is an extreme outlier as it has no real home in the document proper but is kept as a component for 'generic operability' across the board
class DCH_VER extends FG.DCH_BASE {
    hasDiv   = false;   // see baseclass
    hasChunk = false;   // see baseclass

    async construct() {
        // debugger;
    }


    async parse(sr) {
        const ver = await sr.readNext();
        FG.docVersion = ver.split(".").map(ss => parseInt(ss)); // store the doc version as [ major, minor, patch]
    }
    
    
    async unparse() {     // this loader loads the 'out of band' stuff not specifically inside a component
        debugger; return "";
    }
    
    
    async render() {
        // nullfunc, this object doesn't render
    }
};
export { DCH_VER as DCH };      // always export 'as DCH' for docloader to attach to globalThis.DCH
