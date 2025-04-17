
class DCH_BOX extends FG.DCH_BASE {
    hasDiv    = true;     // see baseclass
    hasChunk  = false;    // see baseclass

    children = [];


    async construct() {
        // debugger;
    }


    async loadDoc(sr) {      // this loader loads the 'out of band' stuff not specifically inside a component
        let numChildren = parseInt(await sr.readNext());
        while (numChildren-- > 0) {
            let tmp = await FF.DocLoader.loadDoc(sr, this);    // load a child object
            this.children.push(tmp);                              // and finally add it to the children of this box
        }
    }


    async unloadDoc() {     // this loader loads the 'out of band' stuff not specifically inside a component
        debugger; return "";
    }

    
    async render() {
        for (const child of this.children) {
            await child.render();
        }
    }
};
export { DCH_BOX as DCH };      // always export 'as DCH' for docloader to attach to globalThis.DCH


