
class DCH_BOX extends FG.DCH_BASE {
    construct() {
        this.hasDiv    = true;     // see baseclass
        this.hasChunk  = false;    // see baseclass
    }

    children = [];


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor(parent) {
        super(parent);
    };


    async parse(sr) {      // this loader loads the 'out of band' stuff not specifically inside a component
        let numChildren = parseInt(await sr.readNext());
        while (numChildren-- > 0) {
            let tmp = await FF.DocLoader.load(sr, this); // load a child object
            this.children.push(tmp);                              // and finally add it to the children of this box
        }
    }


    async unparse() {     // this loader loads the 'out of band' stuff not specifically inside a component
    }

    
    async render() {
        await super.render();
        for (const child of this.children) {
            await child.render();
        }
    }
};
export { DCH_BOX as DCH };      // always export 'as DCH' for docloader to attach to globalThis.DCH


