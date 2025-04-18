document.addEventListener('mousedown', mousedown, true);
document.addEventListener('mousemove', mousemove, true);
document.addEventListener('mouseup',   mouseup,   true);
document.addEventListener('keydown', keydown, true);
document.addEventListener('keyup',   keyup,   true);
window.addEventListener('click', clicky, true);     // true=no one can stop me, muahaha!

let mouseOp = null; // 'mouseOp' = mouse Operation (presently only for click+drag of divHandlers)
    
function keydown(evt) {
    // evt.ctrlKey,  evt.key, etc...
}
function keyup(evt) {
}

function mousedown(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    mouseOp = {};
    let m = mouseOp;   // just for brevity below

//RSTODO WHEN moving a handled element and not its contents, 
//     HERE we have to walk 'mouseOp.targetEl' UP to the this.div object that 'owns' the contents of the handler
//     and THAT becomes the el to move (seperate from the mouseOp.targetEl so mousemove ?)
    m.targetEl = /*discovered el goes here*/evt.target;
    let handlerDiv = m.targetEl;
    try {
        while (handlerDiv.hasOwnProperty("dchHandlerDiv") != true) { // climb the branch to find the right parent
            handlerDiv = handlerDiv.parentNode;
        }
    }
    catch (err) {} // couldn't find a dchHandlerDiv, therefore this element does not belong to my doc

    if (!handlerDiv) {
        mouseOp = null;
        return;
    }

    if (!evt.ctrlKey) {
        mouseOp = null;
        return;
    }

    m.targetEl = handlerDiv;

    const tmp = window.getComputedStyle(m.targetEl);

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
        evt.stopPropagation();
        evt.preventDefault();
        const deltaX = (evt.screenX - mouseOp.downX);
        const deltaY = (evt.screenY - mouseOp.downY);

        if (mouseOp.downRect.lrMode.includes("L")) {
            mouseOp.targetEl.style.left = (mouseOp.downRect.left  + deltaX) + "px";
        }
        if (mouseOp.downRect.lrMode.includes("R")) {
            mouseOp.targetEl.style.right = (mouseOp.downRect.right - deltaX) + "px";
        }
        if (mouseOp.downRect.tbMode.includes("T")) {
            mouseOp.targetEl.style.top = (mouseOp.downRect.top     + deltaY) + "px";
        }
        if (mouseOp.downRect.tbMode.includes("B")) {
            mouseOp.targetEl.style.bottom = (mouseOp.downRect.bottom  - deltaY) + "px";
        }
    }    
}
function mouseup(evt) {
    if (mouseOp) {
        evt.stopPropagation();
        evt.preventDefault();
        mouseOp = null;
    }
}






function clicky(event) {
    console.log("click=", event.target, true);
}

