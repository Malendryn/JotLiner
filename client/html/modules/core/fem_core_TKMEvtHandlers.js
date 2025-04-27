// TKMEvtHandlers = Toplevel Keyboard and Mouse Event Handlers

document.addEventListener('mousedown', mousedown, true);    // listen for mousedown ANYwhere on doc
document.addEventListener('keydown', keydown, true);
document.addEventListener('keyup',   keyup,   true);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// Toplevel MouseHandler stuff below here ///////////////////////////////////////////////////////////////////////////
let mouseOp = null; // 'mouseOp' = mouse Operation (presently only for click+drag of divHandlers)


function keydown(evt) {
    // evt.ctrlKey,  evt.key, etc...
}
function keyup(evt) {
}


function mousedown(evt) {
//RSTODO WHEN moving a handled element and not its contents, 
//     HERE we have to walk 'mouseOp.targetEl' UP to the this._div object that 'owns' the contents of the handler
//     and THAT becomes the el to move (seperate from the mouseOp.targetEl so mousemove ?)
    let div = evt.target;
    let op;
    while (div && (op = div?._dchMouseOp) === undefined) {  // climb parents to find _dchMouseOp
        div = div.parentNode;
    }

    if (!op) {                      // if obj under mouse !associated with a dchMouseOp, ...
        return;
    }

// known ops:
//   "dchToolBtn"     // the <div> containing buttons dropdowns etc in the <divToolbar> at top of screen
//   "idx<>doc"       // the <divIndexDocSizer> dragbar between the <divIndexView> and the <divDocView>
//   "dchComponent"   // parent of any <el> inside a dch <div> (found by walking up the parents until encountered)

    if (op == "dchToolBtn") {          // toolbar buttons handle themselves
        return;
    }

    // evt.stopPropagation();
    // evt.preventDefault();

// record info for the "idx<>doc" dragbar or for the "dchComponent"
    let m = {                       // create and init 'global' mouseOp object
        op:          op,            // record the _dchMouseOp.
        startX:      evt.screenX,   // initial evt.screenX and Y (when mouse was pressed)
        startY:      evt.screenY,
        altKey:      evt.altKey,
        ctrlKey:     evt.ctrlKey,
        metaKey:     evt.metaKey,
        shiftKey:    evt.shiftKey,

        targetEl:    div,                // the div(NOT the dch) that had the _dchMouseOp on it
        dchHandler:  div?._dchHandler,   // the actual dch (or undefined if this isn't a dch-related op IE: index<>doc sizebar)
    };

    if (m.op == "idx<>doc") {                       // if it was the idx<>doc resizer that was clicked on...
        let style = getComputedStyle(m.targetEl);
        m.dragBarLeft = parseInt(style.left);
        m.dragBarWidth = parseInt(style.width);
        m.targetEl.style.cursor = "grabbing";
    } else if (op == "dchComponent") {              // if it's a dch operation we clicked on-or-in
        if (!(evt.ctrlKey && evt.altKey)) {                         // if ctrl+alt not down, ...
            let div = document.getElementById("divToolbar");
            for (let idx = 0; idx < div.children.length; idx++) {   // display the appropriate toolbar
                let tmp = div.children[idx];
                if (tmp._dchHandler == m.dchHandler) {
                    tmp.style.display = "block";
                } else {
                    tmp.style.display = "none";
                }
            }
            return;
        }

        evt.stopPropagation();
        evt.preventDefault();

        m.divRect = {           // gather some 'moving/shaping' info
            lrMode: "",         // "L", "R", or "LR"
            tbMode: "",         // "T", "B", or "TB"
            left:   0,          // initial vals of rect to move/shape
            right:  0,
            width:  0,
            top:    0,
            bottom: 0,
            height: 0,
        };

        if (m.targetEl.style.left)  {  m.divRect.lrMode += "L"; m.divRect.left  = parseInt(m.targetEl.style.left);  }
        if (m.targetEl.style.right) {  m.divRect.lrMode += "R"; m.divRect.right = parseInt(m.targetEl.style.right); }
        if (m.targetEl.style.width) {  m.divRect.lrMode += "W"; m.divRect.width = parseInt(m.targetEl.style.width); }     // not used, only care about LR

        if (m.targetEl.style.top)    {  m.divRect.tbMode += "T"; m.divRect.top    = parseInt(m.targetEl.style.top);    }
        if (m.targetEl.style.bottom) {  m.divRect.tbMode += "B"; m.divRect.bottom = parseInt(m.targetEl.style.bottom); }
        if (m.targetEl.style.height) {  m.divRect.tbMode += "H"; m.divRect.height = parseInt(m.targetEl.style.height); }  // not used, only care about TB
    }

    mouseOp = m;    // assign m to mouseOp to continue handling this op
    document.addEventListener('mousemove', mousemove, true);
    document.addEventListener('mouseup',   mouseup,   true);
}


function mousemove(evt) {
    if (mouseOp) {
        const m = mouseOp;
        const deltaX = (evt.screenX - m.startX);
        const deltaY = (evt.screenY - m.startY);
        if (m.op == "dchComponent") {
            if (m.divRect.lrMode.includes("L")) {
                m.targetEl.style.left = (m.divRect.left  + deltaX) + "px";
            }
            if (m.divRect.lrMode.includes("R")) {
                m.targetEl.style.right = (m.divRect.right - deltaX) + "px";
            }
            if (m.divRect.tbMode.includes("T")) {
                m.targetEl.style.top = (m.divRect.top     + deltaY) + "px";
            }
            if (m.divRect.tbMode.includes("B")) {
                m.targetEl.style.bottom = (m.divRect.bottom  - deltaY) + "px";
            }
        } else if (m.op == "idx<>doc") {
            const tmp = m.dragBarLeft + deltaX;
            if (tmp > 48 && tmp < 1200 ) {       // prevent overshrinking/expanding 
                const elL = document.getElementById("divIndexView");
                const elR = document.getElementById("divDocView");
        
                elR.style.left    = (m.dragBarLeft + m.dragBarWidth + deltaX) + "px";  // set left  of divDocView
                m.targetEl.style.left = (m.dragBarLeft + deltaX) + "px";                // set left  of divIndexDocSizer
                elL.style.width   = (m.dragBarLeft + deltaX) + "px";                // set width of divIndexView
            }
        } else {
            return;     // return and process normally
        }
        evt.stopPropagation();
        evt.preventDefault();
    }    
}


function mouseup(evt) {
    if (!mouseOp) {
        return;
    }

    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup',   mouseup);
    mouseOp.targetEl.style.cursor = "";

    let m = mouseOp;
    mouseOp = null;

    // if (m.op != "dchComponent") {  // if was a dchToolBtn or idx<>doc dragbar just return
    //     return;
    // }

    // evt.stopPropagation();
    // evt.preventDefault();

    // if (m.startX == evt.screenX && m.startY == evt.screenY) { // clicked (mouse didn't move)  .. change toolbar to that div!
    //     let div = document.getElementById("divToolbar");
    //     for (let idx = 0; idx < div.children.length; idx++) {
    //         let tmp = div.children[idx];
    //         if (tmp._dchHandler == m.dchHandler) {  // divs in the toolbar MUST have a _dchHandler attr!
    //             tmp.style.display = "block";
    //         } else {
    //             tmp.style.display = "none";
    //         }
    //     }
    // }
}

