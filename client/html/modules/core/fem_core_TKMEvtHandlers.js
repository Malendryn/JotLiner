document.addEventListener('mousedown', mousedown, true);
document.addEventListener('keydown', keydown, true);
document.addEventListener('keyup',   keyup,   true);



///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// Toplevel MouseHandler stuff below here ///////////////////////////////////////////////////////////////////////////
let mouseOp = null; // 'mouseOp' = mouse Operation (presently only for click+drag of divHandlers)

const dIDDel2 = document.getElementById("divIndexDocSizer");
dIDDel2.addEventListener('mousedown', onDIDDMouseDown);

function onDIDDMouseDown(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    document.addEventListener('mousemove', mousemove, true);
    document.addEventListener('mouseup',   mouseup,   true);

    const style = getComputedStyle(evt.target);

    mouseOp = { 
        type:     "idx<>doc",
        downX:     evt.screenX,
        idxEl:     document.getElementById("divIndexView"),    // handle to divIndexView
        dragEl:    evt.target,                                 // handle to divIndexDocSizer
        docEl:     document.getElementById("divDocView"),      // handle to divDocView
        dBarLeft:  parseInt(style.left),                       // leftPx and widthPx of dragbar
        dBarWidth: parseInt(style.width),
    };



    mouseOp.dragEl.style.cursor = "grabbing";
}

function onDIDDMouseMove(evt) {
    if (m.dBarLeft != -999999) {
    }
}

function onDIDDMouseUp(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    console.log("UUU");
    m.dragLeft = -999999;
    mouseOp.dragEl.style.cursor = "";
}


    
function keydown(evt) {
    // evt.ctrlKey,  evt.key, etc...
}
function keyup(evt) {
}

function mousedown(evt) {
    mouseOp = { 
        type:     "docDivMover" ,
        downX:    0,        // initial evt.screenX and Y (when mouse was pressed)
        downY:    0,
        targetEl: null,     // the div (after climbing tree) to move
        downRect: {         // 'moving/shaping' info
            lrMode: "",         // "L", "R", or "LR"
            tbMode: "",         // "T", "B", or "TB"
            left:   0,          // initial vals of rect to move/shape
            right:  0,
            width:  0,
            top:    0,
            bottom: 0,
            height: 0,
        },
    };
    let m = mouseOp;   // just for brevity below

//RSTODO WHEN moving a handled element and not its contents, 
//     HERE we have to walk 'mouseOp.targetEl' UP to the this._div object that 'owns' the contents of the handler
//     and THAT becomes the el to move (seperate from the mouseOp.targetEl so mousemove ?)
    m.targetEl = /*discovered el goes here*/evt.target;
    let handlerDiv = m.targetEl;
    try {
        while (handlerDiv.hasOwnProperty("dchHandler") != true) { // climb the branch to find the right parent
            handlerDiv = handlerDiv.parentNode;
        }
    }
    catch (err) {} // couldn't find a dchHandler, therefore this element does not belong to my doc

    if (!handlerDiv) {
        mouseOp = null;
        return;
    }

    if (!evt.ctrlKey) {
        mouseOp = null;
        return;
    }
    evt.stopPropagation();
    evt.preventDefault();
    document.addEventListener('mousemove', mousemove, true);
    document.addEventListener('mouseup',   mouseup,   true);
    
    m.targetEl = handlerDiv;

    // const tmp = window.getComputedStyle(m.targetEl);
    m.downRect = {
        lrMode: "",
        tbMode: ""
    };
    if (m.targetEl.style.left)  {  m.downRect.lrMode += "L"; m.downRect.left  = parseInt(m.targetEl.style.left);  }
    if (m.targetEl.style.right) {  m.downRect.lrMode += "R"; m.downRect.right = parseInt(m.targetEl.style.right); }
    if (m.targetEl.style.width) {  m.downRect.lrMode += "W"; m.downRect.width = parseInt(m.targetEl.style.width); }     // not used, only care about LR

    if (m.targetEl.style.top)    {  m.downRect.tbMode += "T"; m.downRect.top    = parseInt(m.targetEl.style.top);    }
    if (m.targetEl.style.bottom) {  m.downRect.tbMode += "B"; m.downRect.bottom = parseInt(m.targetEl.style.bottom); }
    if (m.targetEl.style.height) {  m.downRect.tbMode += "H"; m.downRect.height = parseInt(m.targetEl.style.height); }  // not used, only care about TB

    m.downX = evt.screenX;
    m.downY = evt.screenY;
}


function mousemove(evt) {
    if (mouseOp) {
        const m = mouseOp;
        evt.stopPropagation();
        evt.preventDefault();
        const deltaX = (evt.screenX - m.downX);
        const deltaY = (evt.screenY - m.downY);
        if (m.type == "docDivMover") {
            if (m.downRect.lrMode.includes("L")) {
                m.targetEl.style.left = (m.downRect.left  + deltaX) + "px";
            }
            if (m.downRect.lrMode.includes("R")) {
                m.targetEl.style.right = (m.downRect.right - deltaX) + "px";
            }
            if (m.downRect.tbMode.includes("T")) {
                m.targetEl.style.top = (m.downRect.top     + deltaY) + "px";
            }
            if (m.downRect.tbMode.includes("B")) {
                m.targetEl.style.bottom = (m.downRect.bottom  - deltaY) + "px";
            }
        } else if (m.type == "idx<>doc") {
            const tmp = m.dBarLeft + deltaX;
            if (tmp > 48 && tmp < 1200 ) {       // prevent overshrinking/expanding 
                const elL = document.getElementById("divIndexView");
                const elR = document.getElementById("divDocView");
        
                m.docEl.style.left  = (m.dBarLeft + m.dBarWidth + deltaX) + "px";  // set left  of divDocView
                m.dragEl.style.left = (m.dBarLeft + deltaX) + "px";                // set left  of divIndexDocSizer
                m.idxEl.style.width = (m.dBarLeft + deltaX) + "px";                // set width of divIndexView
            }
        }
    }    
}


function mouseup(evt) {
    if (mouseOp) {
        evt.stopPropagation();
        evt.preventDefault();
        document.removeEventListener('mousemove', onDIDDMouseMove);
        document.removeEventListener('mouseup',   onDIDDMouseUp);
        mouseOp = null;
    }
}






function clicky(event) {
    console.log("click=", event.target, true);
}

