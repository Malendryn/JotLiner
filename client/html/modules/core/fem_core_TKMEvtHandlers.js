// TKMEvtHandlers = Toplevel Keyboard and Mouse Event Handlers

document.addEventListener('mousedown', mousedown, true);    // listen for mouseup/down/move ANYwhere on doc
document.addEventListener('mousemove', mousemove, true);
document.addEventListener('mouseup',   mouseup,   true);
document.addEventListener('keydown', keydown, true);
document.addEventListener('keyup',   keyup,   true);
const divDW = document.getElementById("divDocView");
divDW.addEventListener("mouseleave", mouseleave, true);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// Toplevel MouseHandler stuff below here ///////////////////////////////////////////////////////////////////////////


// so if I click AND HOLD left/middle/right mousebutton then I keep getting key and mouse events even when I leave the 
// browser window, but NOT if click+hold is NOT down!
// this doesnt work on buttons 3 and 4, only on 0,1,2 (left,middle,right)

FG.kmStates = {
    clientX:  -9999999,      // to track mouse position at ALL times (while in browserspace of course) 
    clientY:  -9999999,
    btnLeft:  false,
    btnMid:   false,
    btnRight: false,
    keyAlt:   false,
    keyCtrl:  false,
    keyShift: false,
    keyMeta:  false,
    target:   null,     // the element the mouse is presently over (or null)  (NOT always a dch!)
    dch:      null,     // the dch the target belongs to  (IF, else null)
};

function mouseleave(evt) {
    // console.log("left");
}


function dragMaskDiv() {
    let kmask = FG.kmStates.mask;
    const deltaX = FG.kmStates.clientX - kmask.startX;
    const deltaY = FG.kmStates.clientY - kmask.startY;

    if (kmask.lrMode.includes("L")) {
        kmask.el.style.left       = (kmask.left      + deltaX) + "px";
        kmask.divGhost.style.left = (kmask.divGhostL + deltaX) + "px";
    }
    if (kmask.lrMode.includes("R")) {
        kmask.el.style.right      = (kmask.right     - deltaX) + "px";
        kmask.divGhost.style.left = (kmask.divGhostL + deltaX) + "px";
    }
    if (kmask.tbMode.includes("T")) {
        kmask.el.style.top       = (kmask.top           + deltaY) + "px";
        kmask.divGhost.style.top = (kmask.divGhostT     + deltaY) + "px";
    }
    if (kmask.tbMode.includes("B")) {
        kmask.el.style.bottom    = (kmask.bottom    - deltaY) + "px";
        kmask.divGhost.style.top = (kmask.divGhostT + deltaY) + "px";
    }
}


function sizeMaskDiv() {
    let kmask = FG.kmStates.mask;
    const deltaX = FG.kmStates.clientX - kmask.startX;
    const deltaY = FG.kmStates.clientY - kmask.startY;
console.log(kmask.nesw, kmask.lrMode, kmask.tbMode); 
    if (kmask.nesw.includes("w")) {                                         // move west wall
        if (kmask.lrMode == "LW") {                                   // if el has style.left+style.width
            kmask.el.style.left       = (kmask.left       + deltaX) + "px";
            kmask.el.style.width       = (kmask.width     - deltaX) + "px";
            kmask.divGhost.style.left = (kmask.divGhostL  + deltaX) + "px";
            kmask.divGhost.style.width = (kmask.divGhostW - deltaX) + "px";
        }
        if (kmask.lrMode == "RW") {                                   // if el has style.right+style.width
            kmask.el.style.width       = (kmask.width     - deltaX) + "px";
            kmask.divGhost.style.left  = (kmask.divGhostL + deltaX) + "px";
            kmask.divGhost.style.width = (kmask.divGhostW - deltaX) + "px";
        }
        if (kmask.lrMode == "LR") {                                   // if el has style.left+style.right
            kmask.el.style.left        = (kmask.left      + deltaX) + "px";
            kmask.divGhost.style.left  = (kmask.divGhostL + deltaX) + "px";
            kmask.divGhost.style.width = (kmask.divGhostW - deltaX) + "px";
        }
    }
    if (kmask.nesw.includes("n")) {                                         // move north wall
        if (kmask.tbMode == "TH") {                                   // if el has style.top+style.height
            kmask.el.style.top          = (kmask.top       + deltaY) + "px";
            kmask.el.style.height       = (kmask.height    - deltaY) + "px";
            kmask.divGhost.style.top    = (kmask.divGhostT + deltaY) + "px";
            kmask.divGhost.style.height = (kmask.divGhostH - deltaY) + "px";
        }
        if (kmask.tbMode == "BH") {                                   // if el has style.right+style.height
            kmask.el.style.height       = (kmask.height    - deltaY) + "px";
            kmask.divGhost.style.top    = (kmask.divGhostT + deltaY) + "px";
            kmask.divGhost.style.height = (kmask.divGhostH - deltaY) + "px";
        }
        if (kmask.tbMode == "TB") {                                   // if el has style.top+style.right
            kmask.el.style.top          = (kmask.top       + deltaY) + "px";
            kmask.divGhost.style.top    = (kmask.divGhostL + deltaY) + "px";
            kmask.divGhost.style.height = (kmask.divGhostH - deltaY) + "px";
        }
    }
    if (kmask.nesw.includes("e")) {                                         // move east wall
        if (kmask.lrMode == "LW") {                                   // if el has style.left+style.width
            kmask.el.style.width       = (kmask.width     + deltaX) + "px";
            kmask.divGhost.style.width = (kmask.divGhostW + deltaX) + "px";
        }
        if (kmask.lrMode == "RW") {                                   // if el has style.right+style.width
            kmask.el.style.right       = (kmask.right     - deltaX) + "px";
            kmask.el.style.width       = (kmask.width     + deltaX) + "px";
            kmask.divGhost.style.width = (kmask.divGhostW + deltaX) + "px";
        }
        if (kmask.lrMode == "LR") {                                   // if el has style.left+style.right
            kmask.el.style.right       = (kmask.right     - deltaX) + "px";
            kmask.divGhost.style.width = (kmask.divGhostW + deltaX) + "px";
        }
    }
    if (kmask.nesw.includes("s")) {                                         // move north wall
        if (kmask.tbMode == "TH") {                                   // if el has style.top+style.height
            kmask.el.style.height       = (kmask.height    + deltaY) + "px";
            kmask.divGhost.style.height = (kmask.divGhostH + deltaY) + "px";
        }
        if (kmask.tbMode == "BH") {                                   // if el has style.right+style.height
            kmask.el.style.bottom     = (kmask.bottom    - deltaY) + "px";
            kmask.el.style.height       = (kmask.height    + deltaY) + "px";
            kmask.divGhost.style.height = (kmask.divGhostH + deltaY) + "px";
        }
        if (kmask.tbMode == "TB") {                                   // if el has style.top+style.right
            kmask.el.style.top          = (kmask.top       + deltaY) + "px";
            kmask.divGhost.style.top    = (kmask.divGhostL + deltaY) + "px";
            kmask.divGhost.style.height = (kmask.divGhostH - deltaY) + "px";
        }
    }
}


function doCmdStateDrawing(orig, changes) { // only called when FG.kmStates.mask = set
    let kmask = FG.kmStates.mask;
    let el = null;
    const div = document.getElementById("divDocView");

    if (FG.kmStates.btnLeft) {  // if mouseLeft down, use existing el
        if (!orig.btnLeft) {
            kmask.startX = FG.kmStates.clientX;     // capture info about mouse startpos and boxsizing info
            kmask.startY = FG.kmStates.clientY;
        }
        el = kmask.el;          // ref the dch el for working with below
    } else {                    // else find dch el to use
        const list = document.elementsFromPoint(FG.kmStates.clientX, FG.kmStates.clientY);
        for (let idx = 1; idx < list.length; idx++) {  // find topmost dchEl
            const tmp = list[idx];
            if (tmp._dchMouseOp == "dchComponent") {
                if (tmp._dchHandler != FG.curDoc.rootDch) { // do not allow them to select/move the docRoot!
                    if (kmask.el && kmask.el != tmp) {      // if there was a dch el already selected but it's not this one any more
                        if (kmask.divGhost) {               // remove any exhisting gost
                            div.removeChild(FG.kmStates.mask.divGhost);
                            delete FG.kmStates.mask.divGhost;
                        }
                    }
                    kmask.el = el = tmp;
                    kmask.nesw = "";    // set this right away to prevent possible tripup later on
                }
                break;
            }
        }
    }

    if (!el || el != kmask.el) {    // if we were over a dch el but we're not any more
        if (kmask.divGhost) {
            div.removeChild(FG.kmStates.mask.divGhost);
            delete FG.kmStates.mask.divGhost;
        }
    }

    let rect;
    if (el) {
        rect = el.getBoundingClientRect();
    }
    if (el && !FG.kmStates.mask.divGhost) {     // we're over an element but no ghost was created yet
        // let rect = window.getComputedStyle(el);
        let ghost = document.createElement("div");
        ghost.style.position = "fixed";   // fixed to ignore all other div-inside-div measurings
        ghost.style.left    = rect.x + "px";
        ghost.style.top     = rect.y + "px";
        ghost.style.width   = rect.width + "px";
        ghost.style.height  = rect.height + "px";
        ghost.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
        div.insertBefore(ghost, kmask.divMask);    // insert new div UNDER the divMask
        kmask.divGhost = ghost;
        kmask.divGhostL = rect.x;
        kmask.divGhostT  = rect.y;
        kmask.divGhostW = rect.width;
        kmask.divGhostH = rect.height;
        kmask.lrMode = "";
        kmask.tbMode = "";
        if (el.style.left)  {  kmask.lrMode += "L"; kmask.left  = parseInt(el.style.left);  }
        if (el.style.right) {  kmask.lrMode += "R"; kmask.right = parseInt(el.style.right); }
        if (el.style.width) {  kmask.lrMode += "W"; kmask.width = parseInt(el.style.width); }     // not used, only care about LR

        if (el.style.top)    {  kmask.tbMode += "T"; kmask.top    = parseInt(el.style.top);    }
        if (el.style.bottom) {  kmask.tbMode += "B"; kmask.bottom = parseInt(el.style.bottom); }
        if (el.style.height) {  kmask.tbMode += "H"; kmask.height = parseInt(el.style.height); }  // not used, only care about TB

    }
    if (el) {                            // if we're over a dch...
        if (!FG.kmStates.btnLeft) {      // and mouseLeft NOT down...
            const slop = 6;              // compute the cursortype (as kmask.nesw)
            rect.r = rect.x + rect.width - 1;
            rect.b = rect.y + rect.height - 1;
            const irect = {
                x: rect.x + slop,
                y: rect.y + slop,
                r: rect.r - slop,
                b: rect.b - slop,
            };
            kmask.nesw = "";
            if (FG.kmStates.clientY >= rect.y && FG.kmStates.clientY <= irect.y) {
                kmask.nesw += "n"
            }
            if (FG.kmStates.clientY <= rect.b && FG.kmStates.clientY >= irect.b) {
                kmask.nesw += "s"
            }
            if (FG.kmStates.clientX <= rect.r && FG.kmStates.clientX >= irect.r) {
                kmask.nesw += "e"
            }
            if (FG.kmStates.clientX >= rect.x && FG.kmStates.clientX <= irect.x) {
                kmask.nesw += "w"
            }
            
            if (kmask.nesw.length > 0) {
                div.style.cursor = kmask.nesw + "-resize";
            } else {
                div.style.cursor = "grab";
            }
        } else {                            // if mouseLeft IS down...
            if (kmask.nesw.length > 0) {    // and over an edge or corner...
                sizeMaskDiv();
            } else {
                dragMaskDiv();
            }
        }
    } else {                    // if NOT over a dch...
        div.style.cursor = "";
    }
}


function onStateChange(orig, changes) { // detect commandState change and create a faux invis window over entire divDocView
    const div = document.getElementById("divDocView");
    let oldCmd = (orig.keyCtrl && orig.keyAlt);                  // get old and new <RSTODO configurable> commandStates (currently ctrl+alt)
    let newCmd = (FG.kmStates.keyCtrl && FG.kmStates.keyAlt);
    if (oldCmd != newCmd) {                                // if commandState changed
        if (newCmd) {                                      // if commandState started     
            const el = document.createElement("div");
            el.style.position = "absolute";
            el.style.inset = "0px";
            div.appendChild(el);
            FG.kmStates.mask = {
                divMask: el,
            };
        } else {
            div.style.cursor = "";      // undo all cursor settings when commandState released

            if (FG.kmStates.mask) {
                if (FG.kmStates.mask.divGhost) {
                    div.removeChild(FG.kmStates.mask.divGhost);
                }
                if (FG.kmStates.mask.divMask) {
                    div.removeChild(FG.kmStates.mask.divMask);
                }
                delete FG.kmStates.mask;
            }
        }
    }
    if (FG.kmStates.mask) {      // if we're doing commandState gfx
        doCmdStateDrawing(orig, changes);
    }
}


function setKMState(states) {
    let orig = Object.assign({}, FG.kmStates);       // clone the original FG.kmStates before changing them
    let changes = {};
    for (const key in states) {                         // get a list of ONLY what changed
        if (FG.kmStates[key] != states[key]) {
            FG.kmStates[key] = states[key];             // if changed, update FG.kmStates AND push into changes[] 
            changes[key] = states[key];
        }
    }
    if (Object.keys(changes).length) {
        onStateChange(orig, changes);           // if anything changed, call the handler
    }
}


function keydown(evt) {
    const states = {};
    if      (evt.key == "Control") { states["keyCtrl"]   = true; }
    else if (evt.key == "Alt")     { states["keyAlt"]    = true; }
    else if (evt.key == "Shift")   { states["keyShift"]  = true; }
    else if (evt.key == "Meta")    { states["keyMeta"]   = true; }
    setKMState(states);
}

function keyup(evt) {
    const states = {};
    if      (evt.key == "Control") { states["keyCtrl"]   = false; }
    else if (evt.key == "Alt")     { states["keyAlt"]    = false; }
    else if (evt.key == "Shift")   { states["keyShift"]  = false; }
    else if (evt.key == "Meta")    { states["keyMeta"]   = false; }
    setKMState(states);
}


let sizerStartPos = null;         // 'sizerStartPos' = mouse Operation (presently only for click+drag of divHandlers)
function mousedown(evt) {
    const states = {};
    if      (evt.button == 0) {  states["btnLeft"]  = true; }
    else if (evt.button == 1) {  states["btnMid"]   = true; }
    else if (evt.button == 2) {  states["btnRight"] = true; }
    setKMState(states);

    if (evt.target.id == "divIndexDocSizer") {  // record info for mouseMove ops
        let m = {                       // create and init 'global' sizerStartPos object
            startX:      evt.screenX,   // initial evt.screenX and Y (when mouse was pressed)
            startY:      evt.screenY,
        };

        let style = getComputedStyle(evt.target);
        m.dragBarLeft = parseInt(style.left);
        m.dragBarWidth = parseInt(style.width);
        evt.target.style.cursor = "grabbing";

        sizerStartPos = m;    // assign m to sizerStartPos to continue handling this op
    }
}


function mousemove(evt) {
    setKMState({"clientX": evt.clientX, "clientY": evt.clientY});

    if (sizerStartPos) {
        const m = sizerStartPos;
        const deltaX = (evt.screenX - m.startX);
        const deltaY = (evt.screenY - m.startY);
        const tmp = m.dragBarLeft + deltaX;
        if (tmp > 48 && tmp < 1200 ) {       // prevent overshrinking/expanding 
            const elL = document.getElementById("divIndexView");
            const elM = document.getElementById("divIndexDocSizer");
            const elR = document.getElementById("divDocView");

            elR.style.left  = (m.dragBarLeft + m.dragBarWidth + deltaX) + "px";  // set left  of divDocView
            elM.style.left  = (m.dragBarLeft + deltaX) + "px";                   // set left  of divIndexDocSizer
            elL.style.width = (m.dragBarLeft + deltaX) + "px";                   // set width of divIndexView
        }

        evt.stopPropagation();
        evt.preventDefault();
    }
}


function mouseup(evt) {
    const states = {};
    if      (evt.button == 0) {  states["btnLeft"]  = false; }
    else if (evt.button == 1) {  states["btnMid"]   = false; }
    else if (evt.button == 2) {  states["btnRight"] = false; }
    setKMState(states, evt.target);

    if (sizerStartPos) {
        const el = document.getElementById("divIndexDocSizer");
        el.style.cursor = "";
        sizerStartPos = null;
    }
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


