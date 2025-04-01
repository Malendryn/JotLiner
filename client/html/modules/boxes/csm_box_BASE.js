
// BH stands for 'BoxHandler'
// we use the term 'pixel' although we mean unit as a fixed-size-in-space by which everything must abide.
// we use the term 'pixel' because it is the one constant we can be guaranteed to display on any screen device 

class BH_BASE {         // toplevel instance of a displayable 'box' and all that goes on within it
    parent;             // BH_BASE of parent (if inside another box), else null if toplevel
    X;Y;                // X,Y  pixel-relative To parent's 0,0 (negative vals are allowed)
    W;H;                // Width Height of contents in pixels
    zDepth;             // order of displaying, (higher#s are above/onTopOf lower#s, 0 is furthest away)

/* these elements are not of the BASE but are here until we move them somewhere else
    border = {          // borders take space INSIDE the W/H
        color : [0, 0, 0, 0],   // RGBA border color  (as x00 to xFF)
        width : 1,              // width in pixels
        style : 0,              // 0=solid, 1=dashed, 2=dotted, 3=..?
    }
    bgColor = [0, 0, 0, 0];     // RGBA border color  (as x00 to xFF)
*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// functions to override ----------------------------------------------------------------------------------------------
    render ()   { _render.call(this)};  // rerender entire object and all its children

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// functions that can be overridden but don't have to be --------------------------------------------------------------
    resize (width, height) { _resize.call(this, width, height)}; // resize box (but not contents!) to new dimensions and rebuild contents as needed

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
constructor(parent = null) {
    this.parent = parent;
};

static async create(parent = null) {
        const tmp = new this(parent);
        if ("init" in this) {
            await tmp.init();       // careful, debugging near the db.open() call causes wonky throw/errors
        }
        return tmp;
    }
}; // end class
FG.BH_BASE = BH_BASE;       // make this class globally available to everyone so they don't have to loadModule it

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

function _render() {                // render the box and all its children
    debugger;
}

function _resize(width, height) {   // change size of box (not contents!) and then rerender
    debugger;
    this.W = width;
    this.H = height;
    this.render();
}


