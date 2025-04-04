// herein is the base class of all DocumentComponentHandlers

// we use the term 'pixel' although we mean unit as a fixed-size-in-space by which everything must abide.
// we use the term 'pixel' because it is the one constant we can be guaranteed to display on any screen device 


// NOTE: see dcd_Document.js as the first document component needed in any document


FG.DCH_BASE = class DCH_BASE {   // base class of all document components
    hasXYWH     = true;     // next 4 values are XYWH
    isRaw       = false;    // false = load as "byteCount;byteData", true=pass sr as-is for lowlevel processing

    X;Y;                // X,Y  pixel-relative To parent's 0,0 (negative vals are allowed)
    W;H;                // Width Height of contents in pixels
//    zDepth;               // order of displaying, (higher#s are above/onTopOf lower#s, 0 is furthest away)

    parent = null;              // parent handler (or null if toplevel)
    
/* these elements are not of the BASE but are here until we move them somewhere else
    border = {          // borders take space INSIDE the W/H
        color : [0, 0, 0, 0],   // RGBA border color  (as x00 to xFF)
        width : 1,              // width in pixels
        style : 0,              // 0=solid, 1=dashed, 2=dotted, 3=..?
    }
    bgColor = [0, 0, 0, 0];     // RGBA border color  (as x00 to xFF)
*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// must-ALWAYS-override functions --------------------------------------------------------------------------------------------
    async load(sr)     {        await _errorP.call(this, sr);   }   // load StreamReader data into object for displaying
    async unload()     {        await _errorU.call(this);       }   // unload displayable data, return as a str (for saving)
    async render(div)  { return await _errorR.call(this, div);  }   // render object content into el returned by getDiv()

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// must-NEVER-override functions --------------------------------------------------------------------------------------------
    // async getDiv()     { return await _getDiv.call(this);  }    // get a new div, set its XYWH

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// optional override functions ----------------------------------------------------------------------------------------
//  async init()     {};                                   // called immediately after class is finished creation (do we need this?)
    async makeDiv(div) { return await _makeDiv.call(this, div); }  // create and locate/size a div for this object

    constructor() {
    };
}; // end class


async function _makeDiv(div) {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left   = this.X + "px";
    el.style.top    = this.Y + "px";
    let W = this.W, H = this.H;
    if (W < 0) {
        W = div.offsetWidth - this.X + W;
    }
    if (H < 0) {
        H = div.offsetHeight - this.Y + H;
    }
    el.style.width  = W + "px";
    el.style.height = H + "px";
    return el;
}




async function _errorP(sr) {
    throw new Error(this.class.name, ": load(sr) not overridden");
}
async function _errorU() {
    throw new Error(this.class.name, ": unload() not overridden");
}
async function _errorR(div) {
    throw new Error(this.class.name, ": render() not overridden");
}

