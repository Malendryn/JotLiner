// herein is the base class of all DocumentComponentHandlers

// we use the term 'pixel' although we mean unit as a fixed-size-in-space by which everything must abide.
// we use the term 'pixel' because it is the one constant we can be guaranteed to display on any screen device 


// NOTE: see dcd_Document.js as the first document component needed in any document


FF.DocComBASE = class DCH_BASE {   // base class of all document components
    type = 1;             // ALL that inherit from this, will be type=1 (see DOCFORMAT)
    X;Y;                  // X,Y  pixel-relative To parent's 0,0 (negative vals are allowed)
    W;H;                  // Width Height of contents in pixels
//    zDepth;               // order of displaying, (higher#s are above/onTopOf lower#s, 0 is furthest away)

    parent;             // parent handler (or null if toplevel)
    children = [];        // if any handlers exist as a child of this one, they are listed here
/* these elements are not of the BASE but are here until we move them somewhere else
    border = {          // borders take space INSIDE the W/H
        color : [0, 0, 0, 0],   // RGBA border color  (as x00 to xFF)
        width : 1,              // width in pixels
        style : 0,              // 0=solid, 1=dashed, 2=dotted, 3=..?
    }
    bgColor = [0, 0, 0, 0];     // RGBA border color  (as x00 to xFF)
*/


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// must-override functions --------------------------------------------------------------------------------------------
    async load(str)   { throw new Error("DCHL"); }    // parse the 'data' portion of the doc into the visual editable object
    async unload()    { throw new Error("DCHU"); }    // unparse visual editable data, return as a str (for saving)
    async render()    { throw new Error("DCHR"); }    // rerender entire object and all its children

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// optional override functions ----------------------------------------------------------------------------------------
//  async init()     {};                              // called immediately after class is finished creation (do we need this?)
    async resize(w, h) { _resize.call(this, w, h); }  // resize box (but not contents!) to new dimensions and rebuild contents as needed


//#####################################################################################################################
    // static async create(docName = null) {
    //     debugger; const tmp = new this(parent);
    //     // if ("init" in this) {
    //     //     await tmp.init();
    //     // }
    //     return tmp;
    // }


    constructor(parent) {
        this.parent = parent;
    };
}; // end class



async function _resize(width, height) {   // change size of box (not contents!) and then rerender
    debugger;
    this.W = width;
    this.H = height;
    this.render();
}


