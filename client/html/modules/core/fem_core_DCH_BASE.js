// herein is the base class of all DocumentComponentHandlers

// we use the term 'pixel' although we mean unit as a fixed-size-in-space by which everything must abide.
// we use the term 'pixel' because it is the one constant we can be guaranteed to display on any screen device 


// NOTE: see dcd_Document.js as the first document component needed in any document


FG.DCH_BASE = class DCH_BASE {   // base class of all document components
////////// vars extending classes MUST provide on their own!  /////////////////////////////////////////////////////////
    // hasDiv;    // T/F, true = create 'this.div' @ construction AND read XYWH from docStream when created via DocLoader
    // hasChunk;  // T/F, true = load "byteCount;byteData" from sr (and shrink) during parse(sr) and return as a str

    parent;         // parent of this handler (or null if toplevel)
    div = null;     // if hasDiv, html div that this object owns, else null

    X;Y;        // X,Y posn for this.div (relative to parent div in pixels)
    W;H;        // Width,Height of this.div. (negative values change width,height to right,bottom relative to parent div)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// childClass overrides ----------------------------------------------------------------
    //         async construct(); // called via baseclass constructor() to set values like hasDiv and hasChunk immediately
    //         async parse(sr);   // parse and populate self with data passed in via StreamReader (called by DocLoader)
    // str   = async unparse();   // unload displayable data, return as a str (called by DocSaver)
    //         async render();    // render object into its own 'this.div' docElement

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// must-NEVER-override functions --------------------------------------------------------------------------------------------
    // async getDiv()     { return await _getDiv.call(this);  }    // get a new div, set its XYWH


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/**
 * !must implement!, called from baseclass constructor() to allow childClass to set variables on itself
 */
    construct() { throw new Error("child class missing function construct()"); }


/**
 * !must implement!, method to parse content of sr to populate class
 * @param Stringreader sr - a stringreader containing data to be parsed */
    async parse(sr) {}


/**
 * !must implement!, called via baseclass constructor immediately to allow childClass to set variables on it
 * @returns {string} object's data turned into a savable text string/stream
*/
    async unparse() {}

/**
 * !must implement!, called to render object inside this.div 
*/
    async render() {}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//     async load(sr, parent) {
//         this.parent = parent;
//         if (this.hasDiv) {
//             this.div = document.createElement("div");
//             let parentDiv;
//             if (this.parent == null) {
//                 parentDiv = document.getElementById("docWrapper");
//             } else {
//                 parentDiv = this.parent.div
//             }

//             this.div.style.position = "absolute";

//             this.X = parseInt(await sr.readNext());
//             this.Y = parseInt(await sr.readNext());
//             this.W = parseInt(await sr.readNext());
//             this.H = parseInt(await sr.readNext());

//             this.div.style.left   = this.X + "px";
//             this.div.style.top    = this.Y + "px";
//             if (this.W > 0) {
//                 this.div.style.width = this.W + "px";
//             } else {
//                 this.div.style.right = (0 - this.W) + "px";
//             }
//             if (this.H > 0) {
//                 this.div.style.height = this.H + "px";
//             } else {
//                 this.div.style.bottom = (0 - this.H) + "px";
//             }

// //RSTEMP get-us-going mods to experiment on the el
//             this.div.style.border = "1px solid black";
//             this.div.style.backgroundColor = "lightsalmon";
//             this.div.style.overflow = "hidden";
//             this.div.style.whiteSpace = "nowrap";
// //RSTEMP.end

//             parentDiv.appendChild(this.div);
//         }

//         let chunkLen = 0;
//         if (this.hasChunk) {
//             chunkLen = parseInt(await sr.readNext());           // get the # of bytes that belong to this handler's content
//         }
//         const chunk = await sr.readChunk(chunkLen, true);   // read next chunkLen bytes, then shrink sr
//         return chunk;
//     }


    // async unload() {
    //     debugger; throw new Error(this.class.name, ": unload() not overridden");
    // }


    constructor(parent) {
        this.parent = parent;                               // attach self to parent
        this.construct();       // allow childclass to set values like this.hasDiv  (cuz js is stupid about this)
        if (this.hasDiv) {                                  // is this a visible object that needs a <div> to render in? 
            this.div = document.createElement("div");           // create div
            let parentDiv;
            if (this.parent == null) {                          // if self has no parent...
                parentDiv = document.getElementById("docWrapper");  // attach div to outermost <div id="docWrapper">
            } else {
                parentDiv = this.parent.div                     // else attach to parent's <div>
            }
            parentDiv.appendChild(this.div);
        }
    };


}; // end class


