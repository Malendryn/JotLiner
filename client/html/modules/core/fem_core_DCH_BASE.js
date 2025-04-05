// herein is the base class of all DocumentComponentHandlers

// we use the term 'pixel' although we mean unit as a fixed-size-in-space by which everything must abide.
// we use the term 'pixel' because it is the one constant we can be guaranteed to display on any screen device 


// NOTE: see dcd_Document.js as the first document component needed in any document


FG.DCH_BASE = class DCH_BASE {   // base class of all document components
    hasDiv      = true;     // next 4 values are XYWH
    hasChunk    = true;     // true = autoLoad "byteCount;byteData" from sr (and shrink) during load()

    parent;     // (see load()) parent handler (or null if toplevel)

    X;Y;        // (see load()) X,Y  of this's <div> pixel-relative To parent's 0,0 (negative vals are allowed)
    W;H;        // (see load()) Width Height of this's <div> in pixels

    
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// must-ALWAYS-override functions --------------------------------------------------------------------------------------------
    // chunk = async load(sr, parent);   // create this's <div>, if hasChunk, load from StreamReader and return it, else ""
    //         async unload()            // unload displayable data, return as a str (for saving)
    // div   = async render()            // setup <div> with basics and return handle to it for child to draw in

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// must-NEVER-override functions --------------------------------------------------------------------------------------------
    // async getDiv()     { return await _getDiv.call(this);  }    // get a new div, set its XYWH

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// optional override functions ----------------------------------------------------------------------------------------
//  async init()     {};                                   // called immediately after class is finished creation (do we need this?)


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    constructor() {
    };

    _div = null;       // internal handle to MY 'DCH_BASE created <div> Element'


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    async load(sr, parent) {
        this.parent = parent;
        if (this.hasDiv) {
            this._div = document.createElement("div");
            let parentDiv;
            if (this.parent == null) {
                parentDiv = document.getElementById("docWrapper");
            } else {
                parentDiv = this.parent._div
            }

            this._div.style.position = "absolute";

            this.X = parseInt(await sr.readNext());
            this.Y = parseInt(await sr.readNext());
            this.W = parseInt(await sr.readNext());
            this.H = parseInt(await sr.readNext());
            parentDiv.appendChild(this._div);
        }

        let chunkLen = 0;
        if (this.hasChunk) {
            chunkLen = parseInt(await sr.readNext());           // get the # of bytes that belong to this handler's content
        }
        const chunk = await sr.readChunk(chunkLen, true);   // read next chunkLen bytes, then shrink sr
        return chunk;
    }


    async unload() {
        debugger; throw new Error(this.class.name, ": unload() not overridden");
    }


    async render() {

    //RSTEMP get-us-going mods to experiment on the el
        this._div.style.border = "1px solid black";
        this._div.style.backgroundColor = "lightsalmon";
        this._div.style.overflow = "hidden";
        this._div.style.whiteSpace = "nowrap";
    //RSTEMP.end

        this._div.style.left   = this.X + "px";
        this._div.style.top    = this.Y + "px";
        if (this.W > 0) {
            this._div.style.width = this.W + "px";
        } else {
            this._div.style.right = (0 - this.W) + "px";
        }
        if (this.H > 0) {
            this._div.style.height = this.H + "px";
        } else {
            this._div.style.bottom = (0 - this.H) + "px";
        }
        return this._div;
    }
}; // end class


