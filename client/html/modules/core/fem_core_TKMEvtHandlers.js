// TKMEvtHandlers = Toplevel Keyboard and Mouse Event Handlers

document.addEventListener('mousedown', mousedown, true);    // listen for mouseup/down/move ANYwhere on doc
document.addEventListener('mousemove', mousemove, true);
document.addEventListener('mouseup',   mouseup,   true);
document.addEventListener('keydown', keydown, true);
document.addEventListener('keyup',   keyup,   true);
const divDW = document.getElementById("docWrapper");
divDW.addEventListener("mouseleave", mouseleave, true);

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// Toplevel MouseHandler stuff below here ///////////////////////////////////////////////////////////////////////////
let mouseOp = null; // 'mouseOp' = mouse Operation (presently only for click+drag of divHandlers)


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
    console.log("left");
}


function onStateChange(orig, changes) {
// RSBEGIN logic to display ctrl+alt+hovered DCHrect with dashed-lines
//    consider drawing a new rect over the DCHRect so that 
//     1) it shows 'outside/!hidden' over the BOX its in
//     2) we wont have to track the condition of the original DCH style data
// * ALSO gotta get the resize by grabbing walls/corners working too!

// we don't actually use 'changes' here, we may never!  but it's good to have on hand just in case!

    let oldCmd = (orig.keyCtrl && orig.keyAlt);                  // get old and new <RSTODO configurable> commandStates
    let newCmd = (FG.kmStates.keyCtrl && FG.kmStates.keyAlt);
    if (oldCmd != newCmd) {                                // if commandState changed
        if (newCmd) {                                      // if commandState started     
            const el = document.getElementById()
            FG.kmStates.maskDiv = document.createElement("div");
        }
        if (!newCmd) {                                       // if commandState stopped
            if (orig.dch)        { orig.dch._div.style.borderStyle        = "solid";    }
        } else {
            if (orig.dch != FG.kmStates.dch && orig.dch) { // if WAS over a dch and it's not the same one as now
                orig.dch._div.style.borderStyle = "solid";    
            }
            if (FG.kmStates.dch) { FG.kmStates.dch._div.style.borderStyle = "dashed";   }
        }
    }
// RSEND logic

    // console.log(`changed!  ${JSON.stringify(changes)}`);
}

// const style = window.getComputedStyle(tmp);     // get curbackgrd color and darken it by rgb 24,24,24
// let bgColor = style.backgroundColor;
// bgColor = FF.parseRgba(bgColor);
// bgColor.r = Math.max(0, bgColor.r - 24);
// bgColor.g = Math.max(0, bgColor.g - 24);
// bgColor.b = Math.max(0, bgColor.b - 24);
// bgColor = "rgb(" + bgColor.r + "," + bgColor.g + "," + bgColor.b + ")";


function setKeyState(states) {
    let orig = Object.assign({}, FG.kmStates);       // clone the original FG.kmStates before changing them
    let changes = [];
    for (const key in states) {                         // get a list of ONLY what changed
        if (FG.kmStates[key] != states[key]) {
            FG.kmStates[key] = states[key];             // if changed, update FG.kmStates AND push into changes[] 
            changes.push(key);
        }
    }
    if (changes.length) {
        onStateChange(orig, changes);           // if anything changed, call the handler
    }
}

//RSTODO CHANGETO-NEW-WAY: use document.elementsFromPoint and drill-down-from-top to find first dch-controlled one
function setMouseState(states, target) {
    let orig = Object.assign({}, FG.kmStates);       // clone the original FG.kmStates before changing them
    let changes = [];
    if (target != FG.kmStates.target) {         // since this stuff is mildly intensive do it only when element mouse is over changed
        FG.kmStates.target = target;
        changes.push("target");
        while (target && (target?._dchMouseOp) === undefined) {  // climb <el> parents to find _dchMouseOp
            target = target.parentNode;
        }
        let dch = (target) ? target._dchHandler : null;
        if (dch != orig.dch) {
            changes.push("dch");
            FG.kmStates.dch = dch;
        }
    }

    for (const key in states) {                   // get a list of what changed
        if (FG.kmStates[key] != states[key]) {
            FG.kmStates[key] = states[key];
            changes.push(key);
        }
    }
    if (changes.length) {
        onStateChange(orig, changes);           // if anything changed, call the handler
    }
}


function keydown(evt) {
    const states = {};
    if      (evt.key == "Control") { states["keyCtrl"]   = true; }
    else if (evt.key == "Alt")     { states["keyAlt"]    = true; }
    else if (evt.key == "Shift")   { states["keyShift"]  = true; }
    else if (evt.key == "Meta")    { states["keyMeta"]   = true; }
    setKeyState(states);
}

function keyup(evt) {
    const states = {};
    if      (evt.key == "Control") { states["keyCtrl"]   = false; }
    else if (evt.key == "Alt")     { states["keyAlt"]    = false; }
    else if (evt.key == "Shift")   { states["keyShift"]  = false; }
    else if (evt.key == "Meta")    { states["keyMeta"]   = false; }
    setKeyState(states);
}

function mousedown(evt) {
    const states = {};
    if      (evt.button == 0) {  states["btnLeft"]  = true; }
    else if (evt.button == 1) {  states["btnMid"]   = true; }
    else if (evt.button == 2) {  states["btnRight"] = true; }
    setMouseState(states, evt.target);

    if (evt.button != 0) {  // ONLY care about leftmouse button
        return;
    }

    let div = evt.target;                                   // get the <el> under mouseclick
    let op;
    while (div && (op = div?._dchMouseOp) === undefined) {  // climb <el> parents to find _dchMouseOp
        div = div.parentNode;
    }

    if (!op) {                      // if <el> not associated with a _dchMouseOp, ...
        return;
    }

// known _dchMouseOps:
//   "dchToolBtn"     // the <div> containing buttons dropdowns etc in the <divToolbar> at top of screen
//   "idx<>doc"       // the <divIndexDocSizer> dragbar between the <divIndexView> and the <divDocView>
//   "dchComponent"   // parent of any <el> inside a dch <div> (found by walking up the parents until encountered)

    if (op == "dchToolBtn") {       // toolbar buttons handle themselves
        return;
    }

// record info for mouseMove ops
    let m = {                       // create and init 'global' mouseOp object
        op:          op,            // record the _dchMouseOp.
        startX:      evt.screenX,   // initial evt.screenX and Y (when mouse was pressed)
        startY:      evt.screenY,
        altKey:      evt.altKey,    // keystates AT moment of mousedown
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
    // document.addEventListener('mousemove', mousemove, true);
    // document.addEventListener('mouseup',   mouseup,   true);
}


function mousemove(evt) {
    setMouseState({"clientX": evt.clientX, "clientY": evt.clientY}, evt.target);

    if (mouseOp) {
        const m = mouseOp;
        const deltaX = (evt.screenX - m.startX);
        const deltaY = (evt.screenY - m.startY);

        if (m.op == "dchComponent") {       // if we are dragging a dch's <div>
            dragDchDiv(m, deltaX, deltaY);
        } else if (m.op == "idx<>doc") {    // if we are dragging the index<>doc resizer bar
            dragIdxDocResizer(m, deltaX, deltaY);
        } else {                            // INVALID _dchMouseOp !!!
            console.log("fem_core_TKMEvtHandlers.js:mousemove() INVALID _dchMouseOp '" + m.op + "'");
            return;                         // return and process normally
        }
        evt.stopPropagation();
        evt.preventDefault();
    } else if ((evt.ctrlKey && evt.altKey)) {  
        console.log(document.elementsFromPoint(evt.clientX, evt.clientY).length);
        evt.stopPropagation();
        evt.preventDefault();
        return;
    }

}


function mouseup(evt) {
    const states = {};
    if      (evt.button == 0) {  states["btnLeft"]  = false; }
    else if (evt.button == 1) {  states["btnMid"]   = false; }
    else if (evt.button == 2) {  states["btnRight"] = false; }
    setMouseState(states, evt.target);
    if (!mouseOp) {
        return;
    }

    // document.removeEventListener('mousemove', mousemove);
    // document.removeEventListener('mouseup',   mouseup);
    mouseOp.targetEl.style.cursor = "";

    let m = mouseOp;
    mouseOp = null;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function dragDchDiv(m, deltaX, deltaY) {
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
}


function dragIdxDocResizer(m, deltaX, deltaY) {
    const tmp = m.dragBarLeft + deltaX;
    if (tmp > 48 && tmp < 1200 ) {       // prevent overshrinking/expanding 
        const elL = document.getElementById("divIndexView");
        const elR = document.getElementById("divDocView");

        elR.style.left    = (m.dragBarLeft + m.dragBarWidth + deltaX) + "px";  // set left  of divDocView
        m.targetEl.style.left = (m.dragBarLeft + deltaX) + "px";                // set left  of divIndexDocSizer
        elL.style.width   = (m.dragBarLeft + deltaX) + "px";                // set width of divIndexView
    }
}


