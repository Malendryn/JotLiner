// herein is the base class of all DocumentComponentHandlers

// we use the term 'pixel' although we mean unit as a fixed-size-in-space by which everything must abide.
// we use the term 'pixel' because it is the one constant we can be guaranteed to display on any screen device 


// NOTE: see dcd_Document.js as the first document component needed in any document


FG.DCH_BASE = class DCH_BASE {   // base class of all document components
// NOTE: do not instance any DCH class directly, use FG.DCH_BASE.create() instead

////////// vars extending classes MUST provide on their own!  /////////////////////////////////////////////////////////
    hasDiv = true;    // true = create 'this.div' @ construction AND read XYWH from docStream when created via DocLoader
    hasChunk = true;  // true = load "byteCount;byteData" from sr (and shrink) during loadDoc(sr) and return as a str

    parent;         // parent of this handler (or null if toplevel)
    div = null;     // if hasDiv, html div that this object owns, else null

//RSTODO discard these, no longer used
    // X = 0;Y = 0;    // X,Y posn for this.div (relative to parent div in pixels)
    // W = 0;H = 0;    // Width,Height of this.div. (negative values change width,height to right,bottom relative to parent div)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// must-implement functions -------------------------------------------------------------------------------------------
    //       async construct()            // called in static create() after this.div established
    //       async loadDoc(StreamReader sr) // loadDoc and populate self with data passed in via StreamReader (called by DocLoader)
    // str = async unloadDoc()              // unload displayable data, return as a str (called by DocSaver)
    //       async render()               // render object into its own 'this.div' docElement

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// helper functions (defined below) -----------------------------------------------------------------------------------
    // el     = async makeEl("DCHandler Name") // create+attach, set TLBR = 0px, pos=absolute  (EG fill entirety of this.div)
    // handle = async attachHandler(object, event, callback)
    //          async detachHandler(handle)     // detach specified handle (if belongs to this object?)
    //          async detachHandlers();         // cycle through all handles belonging to this object and all children

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    static async create(dchName, parent) {
        if (!DCH.hasOwnProperty(dchName)) {          // load the module(plugin) if not already loaded
            const dch = await FF.loadModule("./modules/DocComponentHandlers/dch_" + dchName + ".js")
            DCH[dchName] = dch.DCH;
        }
        const dch = new DCH[dchName]();         // create handler, do nothing else!
        dch.parent = parent;
        if (dch.hasDiv) {                                  // is dch a visible object that needs a <div> to render in? 
            dch.div = document.createElement("div");           // create div
            let parentDiv;
            if (dch.parent == null) {                          // if self has no parent...
                parentDiv = document.getElementById("docWrapper");  // attach div to outermost <div id="docWrapper">
            } else {
                parentDiv = dch.parent.div                     // else attach to parent's <div>
            }
            parentDiv.appendChild(dch.div);
        }
        dch.construct();
        return dch;
    }


    async makeEl(name) {
        const el = document.createElement("textarea");
        this.div.appendChild(el);
        el.style.position = "absolute";
        el.style.left = "0px";
        el.style.top = "0px";
        el.style.right = "0px";
        el.style.bottom = "0px";
        // el.style.backgroundColor = "lightgreen";
        return el;
    }


    async detachHandler(handle) {   // detach specified handle
        debugger;  
    }


    async detachHandlers() {    // cycle through object and all children and detach all handlers
//        debugger;  
    }

}; // end class

