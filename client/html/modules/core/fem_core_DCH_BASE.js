// herein is the base class of all DocumentComponentHandlers

// we use the term 'pixel' although we mean unit as a fixed-size-in-space by which everything must abide.
// we use the term 'pixel' because it is the one constant we can be guaranteed to display on any screen device 


// NOTE: see dcd_Document.js as the first document component needed in any document


FG.DCH_BASE = class DCH_BASE {   // base class of all document components
// NOTE: do not instance any DCH class directly, use FG.DCH_BASE.create() instead

////////// vars extending classes MUST provide on their own!  /////////////////////////////////////////////////////////
    hasDiv = true;  // true = create 'this.div' @ construction AND read XYWH from docStream when created via DocLoader

    parent;         // parent of this handler (or null if topLevel)
    div = null;     // OWNEDBY BASE! ...  if hasDiv, is html 'absolute' div that this object owns, else null  (autocreated during create())

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// child-must-implement functions -------------------------------------------------------------------------------------
    //        async construct()              // called by static create() after this.div + basics established and attached
    //X       async loadDoc(StreamReader sr) // loadDoc and populate self with data passed in via StreamReader (called by DocLoader)
    //X val = async unloadDoc()              // unload displayable data, return as a StreamWriter (called by DocSaver)
    //        async render()                 // render object into its own 'this.div' docElement

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// BASE-created helper functions (defined below) ----------------------------------------------------------------------
    // handle = async attachHandler(object, event, callback)
    //          async detachHandler(handle)     // detach specified handle (if belongs to this object?)
    //          async detachHandlers();         // cycle through all handles belonging to this object and all children


    static async create(dchName, parent, sr) {
        if (!DCH.hasOwnProperty(dchName)) {          // load the module(plugin) if not already loaded
            const dch = await FF.loadModule("./modules/DocComponentHandlers/dch_" + dchName + ".js")
            DCH[dchName] = dch.DCH;
        }
        const dch = new DCH[dchName]();         // create handler, do nothing else!
        dch.parent = parent;
        if (dch.hasDiv) {                                   // is dch a visible object that needs a <div> to render in? 
            dch.div = document.createElement("div");        // create div
            dch.div.dchHandlerDiv = true;                   // flag to let me find it from any child
            let parentDiv;
            if (dch.parent == null) {                               // if self has no parent...
                parentDiv = document.getElementById("docWrapper");  // attach div to outermost <div id="docWrapper">
            } else {
                parentDiv = dch.parent.div                     // else attach to parent's <div>
            }
            dch.div.style.position = "absolute";            // the wrapping 'dch.div' is ALWAYS absolute!
            parentDiv.appendChild(dch.div);
        }

        if (sr) {       // right here is where we read the divDescriptors from the sr
            const vals = await sr.readNext();       // get # of els that follow that define the core div info
            for (let idx = 0; idx < vals; idx++) {    // get and parse the L/T R/B W H etc... values
                const tmp = await sr.readNext();
                const typ = tmp.charAt(0);         // get the L/T R/B W or H char
                const val = tmp.substr(1) + "px";  // get the value and append "px"

                switch(typ) {
                    case 'L':   dch.div.style.left   = val;   break;
                    case 'T':   dch.div.style.top    = val;   break;
                    case 'R':   dch.div.style.right  = val;   break;
                    case 'B':   dch.div.style.bottom = val;   break;
                    case 'W':   dch.div.style.width  = val;   break;
                    case 'H':   dch.div.style.height = val;   break;
                }
            }
        
        //RSTEMP get-us-going mods to experiment on the el
            dch.div.style.border = "1px solid black";
            dch.div.style.backgroundColor = "lightsalmon";
            dch.div.style.overflow = "hidden";
            dch.div.style.whiteSpace = "nowrap";
        //RSTEMP.end
        }

        dch.construct();
        return dch;
    }


    async detachHandler(handle) {   // detach specified handle
        debugger;  
    }


    async detachHandlers() {    // cycle through object and all children and detach all handlers
//        debugger;  
    }

}; // end class

