// TKMEvtHandlers = Toplevel Keyboard and Mouse Event Handlers

document.addEventListener("contextmenu", onTkmContextMenu, { capture: true, passive: false }); // listen for contextmenu specifically
//   window.addEventListener("blur",        onTkmBlur);                                           // listen for 'leaving browser' specifically
document.addEventListener("mousedown",   onTkmMousedown,   { capture: true, passive: false }); // listen for mouseup/down/move ANYwhere on doc
document.addEventListener("mousemove",   onTkmMouseMove,   { capture: true, passive: false });
document.addEventListener("mouseup",     onTkmMouseUp,     { capture: true, passive: false });
document.addEventListener("keydown",     onTkmKeyDown,     { capture: true, passive: false });
document.addEventListener("keyup",       onTkmKeyUp,       { capture: true, passive: false });


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// Toplevel MouseHandler stuff below here ///////////////////////////////////////////////////////////////////////////


// so if I click AND HOLD left/middle/right mousebutton then I keep getting key and mouse events even when I leave the 
// browser window, but NOT if click+hold is NOT down!
// this doesnt work on buttons 3 and 4, only on 0,1,2 (left,middle,right)

FG.kmStates = {
    mode:     0,       // 0= no alt+shift, 1 = alt+shift, 2=alt+shift, then alt OR shift released then pressed again
    clientX:  0,        // to track mouse position at ALL times (while in browserspace of course) 
    clientY:  0,
    inDocView:false,    // set when mouse moves over/away from divDocView rect
    btnLeft:  false,    // currentState of mouseButtons
    btnMid:   false,
    btnRight: false,
    keyAlt:   false,    // currentState of controlKeys
    keyCtrl:  false,
    keyShift: false,
    keyMeta:  false,    // on windows this is the 'Win' key
    modal:    false,    // true when any menu, contextmenu, or dialog is open, else false
    dch:      null,     // the dch the target belongs to  (IF, else null)
    mask:     null, /*{ // set when cmdKeys are both pressed (keyShift+keyAlt)
        ghost: {
            div: <div>, // ghost rectangle (greyed rectangle showing hovered-over element even if partially hidden)
            L:0,
            T:0,
            W:0,
            H:0,
        }
        divMask:  <div>, // mask rectangle (covers entire divDocView) so we can intercept all clicks/moves
        left:     set to pixelInt if lrMode has 'L' in it
        top:      set to ...
        width:    set to ...
        height:   set to ...
        lrMode:   "LW", "WR", or "LR"
        nesw:     "n", "ne", "e", "se", "s", "sw", "w", "nw" <-- when mouse near edge of divGhost, this lets us set the appropriate cursor
XDELX        startX:   if btnLeft goes down, capture mousepos here
XDELX        startY:
        lastX:    track position of mouse from one call to next for delta movement
        lastY:
        tbMode:   "TH", "HB", or "TB"
    }*/
    // target:   null,     // the element the mouse is presently over (or null)  (NOT always a dch!)  ... not used any more??? 
};


// had to use <div> instead of <form> else the style="..." stuff didn't work at-all!
const anchorForm = `
	<style>
		.enAbled {
			font-family:monospace;
			width:8px;
			background-color:lightgreen;
		}
		.unAbled {
			font-family:monospace;
			width:8px;
			background-color:red;
		}
	</style>
	<div id="popDlgDCHAnchor" style="position:relative;width:396px;height:326px;background-color:lightblue;">
		<div style="position:absolute;top:84px;left:98px;width:200px;height:160px;border:1px solid black;background-color: lightgrey;"></div>

		<svg>
<!--
don't remember what 'daw' was supposed to stand for...
dawAHL (AHR/AHT/AHB) is arrowhead facing Left, Right, Top, Bottom
			
-->
			<defs>	<!-- arrowhead shapes-->
				<marker id="dawAHL" viewBox="-10 -5 10 5" refX="0" refY="0" markerWidth="5" markerHeight="10" orient="auto">
					<path d="M0,-5L-10,0L0,5" fill="#000" />
				</marker>
				<marker id="dawAHR" viewBox="0 -5 10 5" refX="0" refY="0" markerWidth="5" markerHeight="10" orient="auto">
					<path d="M0,-5L10,0L0,5" fill="#000" />
				</marker>
				<marker id="dawAHT" viewBox="-5 0 5 10" refX="0" refY="0" markerWidth="10" markerHeight="5" orient="180">
					<path d="M0,10L5,0L-5,0" fill="#00F" />
				</marker>
				<marker id="dawAHB" viewBox="0 -5 10 10" refX="0" refY="0" markerWidth="10" markerHeight="5" orient="auto">
					<path d="M0,-5L10,0L0,5" fill="#F00" />
				</marker>
			</defs>
		</svg>


		<svg id="dawInnerArrowT" width="20" height="100" style="position:absolute;top:5px;left:120px;">
			<line x1="10" y1="10" x2="10" y2="66" stroke="#F00" stroke-width="2" marker-start="url(#dawAHT)" marker-end="url(#dawAHB)" />
		</svg>
		<div style="position:absolute;top:20px;left:110px;"><input id="dawIBCkBoxT" type="text" class="unAbled" value="X" readonly><label>top</label><br></div>
		<input id="dawIBInputT" type="number"   style="padding:0;position:absolute;top:40px;left:100px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

		<svg id="dawInnerArrowH" width="20" height="200" style="position:absolute;top:86px;left:120px;">
			<line x1="10" y1="10" x2="10" y2="146" stroke="#F00" stroke-width="2" marker-start="url(#dawAHT)" marker-end="url(#dawAHB)" />
		</svg>
		<div style="position:absolute;top:160px;left:102px;"><input id="dawIBCkBoxH" type="text" class="unAbled" value="X" readonly><label>height</label><br></div>
		<input id="dawIBInputH" type="number"   style="padding:0;position:absolute;top:180px;left:100px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

		<svg id="dawInnerArrowB" width="20" height="100" style="position:absolute;top:248px;left:120px;">
			<line x1="10" y1="10" x2="10" y2="66" stroke="#F00" stroke-width="2" marker-start="url(#dawAHT)" marker-end="url(#dawAHB)" />
		</svg>
		<div style="position:absolute;top:260px;left:100px;"><input id="dawIBCkBoxB" type="text" class="unAbled" value="X" readonly><label>bottom</label><br></div>
		<input id="dawIBInputB" type="number"   style="padding:0;position:absolute;top:280px;left:100px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">




		<svg id="dawIBArrowL" width="100" height="20" style="position:absolute;top:115px;left:5px;">
			<line x1="10" y1="10" x2="80" y2="10" stroke="#000" stroke-width="2" marker-start="url(#dawAHL)" marker-end="url(#dawAHR)" />
		</svg>
		<div style="position:absolute;top:105px;left:33px;"><input id="dawIBCkBoxL" type="text" class="unAbled" value="X" readonly><label>left</label><br></div>
		<!-- <input id="dawIBCkBoxL" type="checkbox" style="background-color:red;padding:0;position:absolute;top:105px;left:18px;width:60px;height:20px;" value="x"> -->
		<input id="dawIBInputL" type="number"   style="padding:0;position:absolute;top:125px;left:18px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

		<svg id="dawIBArrowW" width="200" height="20" style="position:absolute;top:115px;left:105px;">
			<line x1="10" y1="10" x2="180" y2="10" stroke="#000" stroke-width="2" marker-start="url(#dawAHL)" marker-end="url(#dawAHR)" />
		</svg>
		<div style="position:absolute;top:105px;left:180px;"><input id="dawIBCkBoxW" type="text" class="enAbled" value="&#10004;" readonly><label>width</label><br></div>
		<!-- <input id="dawIBCkBoxW" type="checkbox" style="padding:0;position:absolute;top:105px;left:218px;width:60px;height:20px;" value="x"> -->
		<input id="dawIBInputW" type="number"   style="padding:0;position:absolute;top:125px;left:174px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

		<svg id="dawIBArrowR" width="100" height="20" style="position:absolute;top:115px;left:302px;">
			<line x1="10" y1="10" x2="80" y2="10" stroke="#000" stroke-width="2" marker-start="url(#dawAHL)" marker-end="url(#dawAHR)" />
		</svg>
		<div style="position:absolute;top:105px;left:322px;"><input id="dawIBCkBoxR" type="text" class="enAbled" value="&#10004;" readonly><label>right</label><br></div>
		<!-- <input id="dawIBCkBoxR" type="checkbox" style="padding:0;position:absolute;top:105px;left:318px;width:60px;height:20px;" value="x"> -->
		<input id="dawIBInputR" type="number"   style="padding:0;position:absolute;top:125px;left:316px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

	</div>
`;

function frmSetEl(code, val, enable) {     // set checkbox enAbled/unAbled AND set value
    let elC = document.getElementById("dawIBCkBox" + code);
    let elI = document.getElementById("dawIBInput" + code);
    if (enable) {
        elC.className = "enAbled";
        elC.value = "✔";
        elI.disabled = false;
        elI.value = val;
        elI.style.backgroundColor = "";                // these are not working!  why not?
    } else {
        elC.className = "unAbled";
        elC.value = "X";
        elI.disabled = true;
        elI.value = "";
        elI.style.backgroundColor = "rgb(187, 187, 187)"; // these are not working!  why not?
    }
}
function onFormInput(evt) {                         // if an inputBox's value changed
    formChanged = true;
    const dch = FG.kmStates.dch;
    let ss = dch.__sysDiv.style;
    const val = parseInt(evt.target.value);
    switch(evt.target.id.charAt(10)) {    // dawIBInputL, dawIBInputW, etc...
        case 'L':   { ss.left   = val + "px";  break; }     // counter the zX before setting
        case 'W':   { ss.width  = val + "px";  break; }
        case 'R':   { ss.right  = val + "px";  break; }
        case 'T':   { ss.top    = val + "px";  break; }
        case 'H':   { ss.height = val + "px";  break; }
        case 'B':   { ss.bottom = val + "px";  break; }
    }

    let rect = dch.__sysDiv.getBoundingClientRect();
    FF.moveDivAbsolute(FG.kmStates.mask.divGhost, rect.left, rect.top);
}


let formChanged;
let formOrigVals;
function onFormClick(evt) {
    if (evt.target.id.startsWith("dawIBCkBox")) {       // if a checkbox was clicked...
        formChanged = true;
        const dch = FG.kmStates.dch;
        const pRect = dch.__parent.host.getBoundingClientRect();    // get the scroll-sized div, not the DCH div
        const rect = dch.__sysDiv.getBoundingClientRect();

        const id = evt.target.id;
        const box = { 
            L: (rect.left - pRect.left) + "px", 
            W: rect.width + "px", 
            R: (pRect.width - (rect.left - pRect.left) + rect.width) + "px",
            T: (rect.top - pRect.top) + "px", 
            H: rect.height + "px", 
            B: (pRect.height - (rect.top - pRect.top) + rect.height) + "px",
        };
        let code;
        let ss = dch.__sysDiv.style;
        switch(id.charAt(10)) {    // dawIBCkBoxL, dawIBCkBoxW, etc...
            case 'L':   { code = ['L', 'W', 'R']; ss.left   = '';  ss.width  = box.W;  ss.right  = box.R;  break; }
            case 'W':   { code = ['W', 'L', 'R']; ss.width  = '';  ss.left   = box.L;  ss.right  = box.R;  break; }
            case 'R':   { code = ['R', 'L', 'W']; ss.right  = '';  ss.left   = box.L;  ss.width  = box.W;  break; }
            case 'T':   { code = ['T', 'H', 'B']; ss.top    = '';  ss.height = box.H;  ss.bottom = box.B;  break; }
            case 'H':   { code = ['H', 'T', 'B']; ss.height = '';  ss.top    = box.T;  ss.bottom = box.B;  break; }
            case 'B':   { code = ['B', 'T', 'H']; ss.bottom = '';  ss.top    = box.T;  ss.height = box.H;  break; }
        }
        frmSetEl(code[0], '', false);
        frmSetEl(code[1], '', true);
        frmSetEl(code[2], '', true);
        setFormVals();
    }
}


function setFormVals() {
    const dch = FG.kmStates.dch;
    const ss = dch.__sysDiv.style;
    frmSetEl("L", (parseInt(ss.left) || 0),   ss.left.length   > 0);
    frmSetEl("W", (parseInt(ss.width) || 0),  ss.width.length  > 0);
    frmSetEl("R", (parseInt(ss.right) || 0),  ss.right.length  > 0);
    frmSetEl("T", (parseInt(ss.top) || 0),    ss.top.length    > 0);
    frmSetEl("H", (parseInt(ss.height) || 0), ss.height.length > 0);
    frmSetEl("B", (parseInt(ss.bottom) || 0), ss.bottom.length > 0);
}


function preRun(form) {
    formChanged = false;
    const dch = FG.kmStates.dch;
    formOrigVals = {
        left:   dch.__sysDiv.style.left,
        width:  dch.__sysDiv.style.width,
        right:  dch.__sysDiv.style.right,
        top:    dch.__sysDiv.style.top,
        height: dch.__sysDiv.style.height,
        bottom: dch.__sysDiv.style.bottom,
    };
    setFormVals();
    form.addEventListener("click", onFormClick);
    form.addEventListener("input", onFormInput);
}
function postRun(form) {
    form.removeEventListener("input", onFormInput);
    form.removeEventListener("click", onFormClick);
}

function onPopupClose(dict) {
    if (!dict) {
        const ss = FG.kmStates.dch.__sysDiv.style;
        ss.left   = formOrigVals.left;
        ss.width  = formOrigVals.width;
        ss.right  = formOrigVals.right;
        ss.top    = formOrigVals.top;
        ss.height = formOrigVals.height;
        ss.bottom = formOrigVals.bottom;
        console.log(FF.__FILE__(), "onPopupClose: .update() should only be called when mode=2 and we're dragging the infinite canvas!");
        FG.kmStates.dch.update();       // nothing should've changed at this point BUT it calls autoSave()!
    } else {
        if (formChanged) {
            FF.autoSave(0);
        }
    }
    FG.kmStates.modal = false;  // HACK!  popupHandler clears this for us but we MUST have it cleared for onStateChange()!
    onStateChange({});      // just to bump an update so mask & ghost clear
}
function onContextDCHProps() {
    const dict={};//{foo:"bar"};
    FF.openPopup(anchorForm, dict, onPopupClose, preRun, postRun);
}


FF.getDCHName = function (dch) {
    for (const key in DCH) {            // get it's dchName by searching for it in the loaded DCH ComponentHandlers
        if (dch instanceof DCH[key].dchClass) {  
            return key;
        }
    }
    return null;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function openDCHContextMenu() {      // based on the dch the mouse is over when rightmouse was pressed...
   let dch = FG.kmStates.dch;   // the actual dch instance

    const dchName = FF.getDCHName(dch);  // the name (as found in the globalThis.DCH{} )

    const entries = [];
    if (dch.__children) {           // if rightclicked dchHandler allows children...  (is a BOX)
        for (const key in DCH) {    // add all the addable dch's to the menuEntries
            const dchClass = DCH[key].dchClass;
            if (dchClass.menuText !== null) {   
                entries.push(["insert_" + key, "Insert new " + dchClass.menuText, dchClass.menuTooltip]);
            }
        }
    }
    entries.push(["", "", ""]);
    entries.push(["export", "Export Element", "Export node (and all children) under cursor to local file"]);


    if (dch != FG.curDoc.rootDch) {     // never allow deleting the topmost BOX element from this menu
        entries.push(["delete",   "Delete node (and all children)", "Delete document element under mouse and all children inside it"]);
        entries.push(["", "", ""]);     // nor allow changing the styles
        entries.push(["setProps", "Properties", "Modify the anchors, border, background color, etc"]);
    }

    const rect = dch.__sysDiv.getBoundingClientRect();
    const startX = FG.kmStates.clientX - rect.left; // calc mouseXY relative to dch.__sysDiv rect
    const startY = FG.kmStates.clientY - rect.top;
    async function callback(action) { 
        if (action.startsWith("insert_")) {
            let dchName = action.substr(7);
            const style = {L:startX, T:startY, W:100, H:100};
            const nuDch = await FG.DCH_BASE.create(dchName, dch, style);  // create handler, assign parent, create <div>, set style
            dch.__children.push(nuDch);
            FF.autoSave();          // autosave after 5 secs
        }
        switch (action) {                                     // 'go do' whatever was clicked
            case "export":
                let exp = await FF.loadModule("./modules/core/fem_core_DocExporter.js");
                exp = new exp.DocExporter();    //RSNOTE DOES NOT detach! ONLY exports!!!!
                let str = await exp.export(dch);
                console.log(str);
                break;
            case "delete":
                const dchName = FF.getDCHName(dch);
                let yes = window.confirm("Delete node '" + dchName + ", are you sure?");
                if (!yes) {
                    return;
                }
                if (dch.__children && dch.__children.length > 0) {  // if dch is a BOX
                    yes = window.confirm("This node has children that will be deleted too.\nAre you SURE?");
                    if (!yes) {
                        return;
                    }
                }
                await dch.destroy();
                FF.autoSave();
                break;
            case "setProps":
                onContextDCHProps();
                break;
        }
    }

    FF.openContextMenu(entries, callback);
}


FF.getDchAt = function(clientX, clientY) {
    const list = document.elementsFromPoint(clientX, clientY);
    for (let idx = 1; idx < list.length; idx++) {  // find topmost dchEl
        const tmp = list[idx];
        if (tmp._dchMouseOp == "dchComponent") {
            return tmp._dchHandler;
        }
    }
    return null;
}

function setKBModeTitlebarText(dch) {
    dch = FF.getBoxAroundDch(dch);      // we dont care about the dch, only the BOX around it (or self if is a BOX)
    let el = document.getElementById("__tmpKBModeTitlebar");
    if (el) {
        let txt = `
<div style="display:flex;align-items:center;height:100%;"><!-- center vertically-->
    Command Mode: ${FG.kmStates.mode}`;

if (FG.kmStates.mode > 0 && dch && FF.getDCHName(dch) == "BOX") {
    txt += ",&nbsp; &nbsp; Canvas Offset &nbsp; &nbsp; X: " + dch.zX + ", &nbsp; &nbsp; Y: " + dch.zY;
}
    txt += `
</div>`;

        el.innerHTML = txt;
    }
}


function setKBModeToolbarText(dch) {
    if (!dch) {
        return;
    }
    let el = document.getElementById("__tmpKBModeToolbar");
    if (el) {
        let txt = `
<style>
    .aT {                        /* T for Text */
        display:    inline-block;
        width:      60px;
        text-align: right;
        /* background-color: lightgreen; */
    }
    .aD {                        /* D for Data */
        display:    inline-block;
        width:      50px;
        text-align: left;
        padding-left:8px;
        /* background-color: orange; */
        height:     1em;
    }
</style>
<div style="display:flex;align-items:center;height:100%;"><!-- center vertically-->
    DCH Type: ${FF.getDCHName(dch)}`;

    function foo(wrd, val, show) {
        let bgc;
        if (show) {
            bgc="white"
        } else {
            bgc="#CCCCCC"
        }
        txt += `    <span  style="background-color:${bgc};"><span class="aT">${wrd}:</span><span class="aD"">${val}</span></span>
`;
    }

try{
//     let P = dch.__parent.host.getBoundingClientRect();  // get the parent's scrollbox this dch lives inside of
//     let H = dch.__sysDiv.getBoundingClientRect();       // get the dch-to-display's bounding box

// // console.log(P.left, H.left, zX, P.left - H.left     - zX, P.left - H.left)
//     const box = {
//         left:     H.left   - P.left,
//         width:    H.width,
//         right:  -(H.right  - P.right),
//         top:      H.top    - P.top,
//         height:   H.height,
//         bottom: -(H.bottom - P.bottom),
//     }

    function getstylVal(val) {
        let qq = parseInt(val);
        if (isNaN(qq)) {
            return "---";
        }
        return qq;
    }
    const box = {
        left:     getstylVal(dch.__sysDiv.style.left),
        width:    getstylVal(dch.__sysDiv.style.width),
        right:    getstylVal(dch.__sysDiv.style.right),
        top:      getstylVal(dch.__sysDiv.style.top),
        height:   getstylVal(dch.__sysDiv.style.height),
        bottom:   getstylVal(dch.__sysDiv.style.bottom),
    }
    for (const key in box) {
        foo(key, box[key], dch.__sysDiv.style[key]);
    }
} catch (e) {
    debugger;
}
    txt += `
</div>`;

        el.innerHTML = txt;
    }
}


function showGhost(dch) {
    let ghost = document.getElementById("__ghostDiv");
    if (!dch) {
        // console.log(FF.__FILE__(), "showGhost:  deleting ghostDiv");
        if (FG.kmStates.mask) {
            if (FG.kmStates.mask.divGhost) {
                FG.kmStates.mask.divGhost.remove();
                delete FG.kmStates.mask.divGhost;
            }
        }
        return;
    }
    if (!ghost) {
        // console.log(FF.__FILE__(), "showGhost:  creating ghostDiv");
        ghost = document.createElement("div");
        ghost.id = "__ghostDiv";
        ghost.style.position = "fixed";   // fixed to ignore all other div-inside-div measurings
        ghost.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
        const docDiv = document.getElementById("divDocView");
        docDiv.insertBefore(ghost, FG.kmStates.mask.divMask);    // insert new div UNDER the divMask
        FG.kmStates.mask.divGhost = ghost;
    }
    let rect = dch.__sysDiv.getBoundingClientRect();
    ghost.style.left    = rect.x + "px";
    ghost.style.top     = rect.y + "px";
    ghost.style.width   = rect.width + "px";
    ghost.style.height  = rect.height + "px";
}


function doDchOpMode1(orig) { // only called when cmdCombo is pressed (FG.kmStates.mask = set)
    let kmask = FG.kmStates.mask;
    let dch = null; // mouseUP = currently hovered dch/null, mouseDOWN = dch under mouse btn pressed/null
    const docDiv = document.getElementById("divDocView");

    if (FG.kmStates.btnLeft) {                              // if mouseLeft down, use existing hovered-over sysDiv
        dch = FG.kmStates.dch;
        if (dch && !orig.btnLeft) {                         // if over a valid dch && mouseleft wasn't down but is now down
//            setKMStateMode(1);    // we SHOULD already BE mode 1
            // setKBModeToolbarText(dch);
            kmask.lastX  = FG.kmStates.clientX;     // capture initial mouse startpos
            kmask.lastY  = FG.kmStates.clientY;
        }
    } else {                                                // mouseleft NOT down, find dch currently hovering over
        if (orig.btnLeft) {                         // if mouseleft WAS down but is now released
            // setKMStateMode(0);
        }
        dch = FF.getDchAt(FG.kmStates.clientX, FG.kmStates.clientY);
        if (dch == FG.curDoc.rootDch) {                         // in mode1, do not allow them to select/move the docRoot!
            dch = null;
        }
        if (FG.kmStates.dch != FG.curDoc.rootDch) {      
            if (dch && dch != FG.kmStates.dch) {                // if there was a dch already selected but it's not this one any more
                if (kmask.divGhost) {                           // remove any exhisting ghost
                    // docDiv.removeChild(FG.kmStates.mask.divGhost);
                    // console.log(FF.__FILE__(), "doDchOpMode1: deleting divGhost");
                    FG.kmStates.mask.divGhost.remove();
                    delete FG.kmStates.mask.divGhost;
                }
            }
            FG.kmStates.dch = dch;
            kmask.nesw = "";                        // clear this right away to prevent possible tripup later on
            setKBModeTitlebarText(FG.kmStates.dch); // fire 'first time' to get data on screen (else wont show til mousemove)
            setKBModeToolbarText(FG.kmStates.dch);
        }
    }
    if (!dch || dch != FG.kmStates.dch) {    // if we were over a dch but we're not any more (or it changed)
        if (kmask.divGhost) {
            showGhost(null);                 // delete the current ghost
        }
    }
    if (!dch) {         // there's no dch under the mouse,  nothing to do!
        docDiv.style.cursor = "";
        return;
    }
// dch now refs the FG.kmStates.dch currently hovered over

    if (FG.kmStates.btnRight) {  // if contextMenu button down, ...
        let tmp = document.getElementById("sysContextMenu");
        if (!tmp) {     // only open if a menu isn't already open
            openDCHContextMenu();
        }
        return;
    }
    if (!FG.kmStates.mask.divGhost) {     // we're over an element but no ghost was created yet
        showGhost(dch);
        kmask.lrMode = "";
        kmask.tbMode = "";
        if (dch.__sysDiv.style.left)  {  kmask.lrMode += "L"; kmask.left  = parseInt(dch.__sysDiv.style.left);  }
        if (dch.__sysDiv.style.right) {  kmask.lrMode += "R"; kmask.right = parseInt(dch.__sysDiv.style.right); }
        if (dch.__sysDiv.style.width) {  kmask.lrMode += "W"; kmask.width = parseInt(dch.__sysDiv.style.width); }     // not used, only care about LR

        if (dch.__sysDiv.style.top)    {  kmask.tbMode += "T"; kmask.top    = parseInt(dch.__sysDiv.style.top);    }
        if (dch.__sysDiv.style.bottom) {  kmask.tbMode += "B"; kmask.bottom = parseInt(dch.__sysDiv.style.bottom); }
        if (dch.__sysDiv.style.height) {  kmask.tbMode += "H"; kmask.height = parseInt(dch.__sysDiv.style.height); }  // not used, only care about TB

    }
    if (!FG.kmStates.btnLeft) {      // and mouseLeft NOT down...
        let rect = dch.__sysDiv.getBoundingClientRect();
        const slop = 6;              // figure out if mouse is over a dch border and set kmask.nesw accordingly
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
        
        if (kmask.nesw.length > 0) {                // set cursor based on mouse over border or content
            docDiv.style.cursor = kmask.nesw + "-resize";
        } else {
            docDiv.style.cursor = "grab";
        }
    } else {                            // if mouseLeft IS down...
        const deltaX = FG.kmStates.clientX - kmask.lastX;
        const deltaY = FG.kmStates.clientY - kmask.lastY;
        if (deltaX || deltaY) {
            kmask.lastX = FG.kmStates.clientX;      // update last mousepos to current
            kmask.lastY = FG.kmStates.clientY;
            if (kmask.nesw.length > 0) {            // if over an edge or corner, resize...
                FF.sizeDivRelative(dch.__sysDiv, kmask.nesw, deltaX, deltaY);
                FF.sizeDivRelative(kmask.divGhost, kmask.nesw, deltaX, deltaY);
            } else {                                // ...else move
                FF.moveDivRelative(dch.__sysDiv, deltaX, deltaY);
                FF.moveDivRelative(kmask.divGhost, deltaX, deltaY);
            }
        }

// FG.kmStates.dch.__parent.update();      // update scrollRegion of parent (no longer matters as update() only applies in mode2 now!)
        FF.autoSave();          // autosave after n secs
        setKBModeToolbarText(FG.kmStates.dch);
    }
}
function doDchOpMode2(orig) { // only called when cmdCombo is pressed (FG.kmStates.mask = set)
// note, we did this without using kmask.divMask AT ALL! (can we remove from doDchOpMode1 too?)

    let kmask = FG.kmStates.mask;
    let dch = null; // mouseUP = currently hovered dch/null, mouseDOWN = dch under mouse btn pressed/null
    const docDiv = document.getElementById("divDocView");

    if (FG.kmStates.btnLeft) {                     // if mousleft down, use existing hovered-over dch
        dch = FG.kmStates.dch;
        if (dch && !orig.btnLeft) {                // if over a valid dch && mouseleft wasn't down but is now down
            // setKBModeTitlebarText(dch);
            kmask.lastX = FG.kmStates.clientX;     // capture initial mouse startpos
            kmask.lastY = FG.kmStates.clientY;
        }
    } else {
        if (orig.btnLeft) {                        // if mouseleft WAS down but is now released
// RSTODO
        }
        dch = FF.getDchAt(FG.kmStates.clientX, FG.kmStates.clientY);    // get dch under cursor
        dch = FF.getBoxAroundDch(dch);                                  // get parent BOX (or self if is a BOX)
        FG.kmStates.dch = dch;

        setKBModeTitlebarText(FG.kmStates.dch); // fire 'first time' to get data on screen (else wont show til mousemove)
        setKBModeToolbarText(FG.kmStates.dch);
    }
    showGhost(dch);                 // delete the current ghost (if any)
    // if (!dch || dch != FG.kmStates.dch) {    // if we were over a dch but we're not any more (or it changed)
    //     if (kmask.divGhost) {
    //         showGhost(null);                 // delete the current ghost
    //     }
    // }
    if (!dch) {         // there's no dch under the mouse,  nothing to do!
        docDiv.style.cursor = "";
        return;
    }
// dch now refs the BOX the FG.kmStates.dch currently hovered over resides within (or self if is a BOX)

    if (FG.kmStates.btnRight) {     // if contextMenu button down, ...
//RSTODO
    }
    if (!FG.kmStates.mask.divGhost) {     // we're over an element but no ghost was created yet
        showGhost(dch);
    }

    if (!FG.kmStates.btnLeft) {      // and mouseLeft NOT down...
    } else {                         // if mouseLeft IS down...
        const deltaX = FG.kmStates.clientX - kmask.lastX;
        const deltaY = FG.kmStates.clientY - kmask.lastY;
        if (deltaX || deltaY) {
            kmask.lastX = FG.kmStates.clientX;      // update last mousepos to current
            kmask.lastY = FG.kmStates.clientY;
            dch.zX += deltaX;
            dch.zY += deltaY;
            dch.update();
        }
    }
    setKBModeTitlebarText(dch);
}


function disableAllShadowHosts(yesno) { // if yes, disable(prevent pointer events) the shadowRoot rect and give it 0.5 alpha, else enable it
    function findAllShadowHosts(root) {
        const found = [];
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT, null, false);
        while (walker.nextNode()) {
            const el = walker.currentNode;
            if (el.shadowRoot) {          // if this is a shadow DOM root node
                found.push(el);
            }
        }
        return found;
    }
    const div = document.getElementById("divDocView");
    let found = findAllShadowHosts(div);
    for (let idx = 0; idx < found.length; idx++) {
        const el = found[idx];
        if (yesno) {
            el.classList.add("disable");
        } else {
            el.classList.remove("disable");
        }
    }
}


function setKMStateMode(mode) {     // set kmStates.mode and also add/remove the __tmpKBModeTitlebar/Toolbar
    FG.kmStates.mode = mode;
    if (mode == 0) {
        let el = document.getElementById("__tmpKBModeToolbar");
        if (el) {
            el.remove();
        }
        el = document.getElementById("__tmpKBModeTitlebar");
        if (el) {
            el.remove();
            // el = document.getElementById("tbContent");
            // el.style.display = "";      // revert back to the display style in index.css
        }
        disableAllShadowHosts(false);      // enable shadow DOMS once again
        const docDiv = document.getElementById("divDocView");
        docDiv.style.cursor = "";          // undo all cursor settings when commandState released

        // let qq = "####  .mask=" + ((FG.kmStates.mask == null) ? "null" : "{..}");
        if (FG.kmStates.mask) {            // if there was a mask and/or ghost, nuke em!
            if (FG.kmStates.mask.divGhost) {
                // qq += "  deleting .mask.divGhost";
                // docDiv.removeChild(FG.kmStates.mask.divGhost);     // remove ghost div
                FG.kmStates.mask.divGhost.remove();     // remove ghost div
            }
            if (FG.kmStates.mask.divMask) {
                // qq += "  deleting .mask.divMask";
                // docDiv.removeChild(FG.kmStates.mask.divMask);       // remove mask div
                FG.kmStates.mask.divMask.remove();       // remove mask div
                // clearAllButtons();
            }
            // console.log(FF.__FILE__(), qq);
            FG.kmStates.mask = null;                     // nullout mask
        }
    } else {
        let el = document.getElementById("__tmpKBModeTitlebar");
        if (!el) {
            el = document.createElement("div");
            el.id = "__tmpKBModeTitlebar";
            el.style.position = "absolute";
            el.style.width = "100%";
            el.style.height = "100%";
            el.style.backgroundColor = "white";
            let tBar = document.getElementById("divTitleBar");
            tBar.appendChild(el);
            // let el2 = document.getElementById("tbContent"); // other box causes problems so just hide it
            // el2.style.display = "none";
        }
        el = document.getElementById("__tmpKBModeToolbar");
        if (!el) {
            el = document.createElement("div");    
            el.id = "__tmpKBModeToolbar";
            el.style.position = "absolute";
            el.style.width = "100%";
            el.style.height = "100%";
            // el.style.zIndex = "99999999";
            el.style.backgroundColor = "white";
            let tBar = document.getElementById("divToolbar");
            tBar.appendChild(el);
        }
        setKBModeTitlebarText(FG.kmStates.dch);
        setKBModeToolbarText(FG.kmStates.dch);
    }
}
// sets/zeros FG.kmStates.mode based on cmdKeys pressed/released OR toggled
// sets/nulls FG.kmStates.mask {divMask} if cmdState changed (bothkeys down or bothkeys up ONLY) (mode1/2 doesnt matter)
function onStateChange(orig) {  // detect commandState change and create a faux invis window over entire divDocView
    if (FG.kmStates.modal) {            // a modal operation is happening, ignore state activities after this point
        return;
    }
    const docDiv = document.getElementById("divDocView");

    if (!FG.kmStates.keyAlt && !FG.kmStates.keyShift) {     // if both keys are up, clear the mode
        setKMStateMode(0);
    }
    let oldCmd = (orig.keyAlt && orig.keyShift);                  // get old and new <RSTODO configurable> commandStates (currently ctrl+alt)
    let newCmd = (FG.kmStates.keyAlt && FG.kmStates.keyShift);
    // console.log(FF.__FILE__(), "kmStates", FG.kmStates.keyCtrl, FG.kmStates.keyAlt, FG.kmStates.keyShift);
    if (oldCmd != newCmd) {                                // if commandState changed
        if (newCmd) {                                      // if commandState started  (ctrl+alt pressed)
            if (!FG.kmStates.inDocView) {
                return;
            }
            FG.kmStates.mode = 1 + ((FG.kmStates.mode) % 2);  // toggle between mode1 and 2
            // console.log(FF.__FILE__(), "kmStates.mode =", FG.kmStates.mode);
            setKMStateMode(FG.kmStates.mode);

            disableAllShadowHosts(true);
            let maskEl = document.getElementById("__divMask");
            if (!maskEl) {
                maskEl = document.createElement("div");  // create the overlay mask
                maskEl.id = "__divMask";
                maskEl.style.position = "absolute";
                maskEl.style.inset = "0px";
                docDiv.appendChild(maskEl);
                // console.log(FF.__FILE__(), "creating mask");
                FG.kmStates.mask = {
                    divMask: maskEl,
                    divGhost: null,
                };
            }
        } else {                            // if EITHER cmdKey released!
        }
    }
    if (FG.kmStates.modal) {            // a modal operation is happening, ignore state activities after this point
        return;
    }

    if (FG.kmStates.mask) {             // if mask is present (any cmdKey was raised)
        if (FG.kmStates.mode == 1) {    
            doDchOpMode1(orig);
        } else if (FG.kmStates.mode == 2) {
            doDchOpMode2(orig);
        }
    } else {
        if (FG.kmStates.btnLeft && FG.kmStates.btnLeft != orig.btnLeft) {
            const dch = FF.getDchAt(FG.kmStates.clientX, FG.kmStates.clientY);
            if (dch) {
                const div = document.getElementById("divToolbar");
                for (const child of div.children) {
                    child.style.display="none";         // hide all toolbars then...
                }
                if (dch.hasToolbar) {
                    dch.toolbar.style.display = "block";                    
                }
            }
        }
    }
}


function debugStates(states) {
    const wrds = ["btnLeft", "btnMid", "btnRight", "keyAlt", "keyCtrl", "keyShift", "keyMeta", "modal"];
    let ss = "";
    let flag = false;
    for (let idx = 0; idx < wrds.length; idx++) {
        const wrd = wrds[idx];
        let old = ((FG.kmStates[wrd]) ? "T" : "F");
        let nuu;

        ss +=wrd + ":" + old;
        if (wrd in states) {
            flag = true;
            nuu = ((states[wrd]) ? "T" : "F");
            ss += nuu;
        } else {
            ss += " ";
        }
        ss += "  ";
    }
    if (flag) { console.log(ss); }
}

function clearAllButtons(callSetKMState = true) {
    // console.log("CAB");
    const states = {          // inject an 'all buttons released' statechange
        "btnLeft":  false,
        "btnMid":   false,
        "btnRight": false,
        "keyAlt":   false,
        "keyCtrl":  false,
        "keyMeta":  false,
        "keyShift": false,
    };
    setKMStateMode(0);

    if (callSetKMState) {
        setKMState(states);
    }
}

function setKMState(states) {
    let orig = Object.assign({}, FG.kmStates);       // clone the original FG.kmStates before changing them
    let changed = false;

       for (const key in states) {                   // test field-by-field to see if anything changed
        if (FG.kmStates[key] != states[key]) {
            FG.kmStates[key] = states[key];          // if changed, update FG.kmStates and set changed flag
            changed = true;
        }
    }

// if mouse moved from inside to outside (or vica/versa) the scope of divDocView
    if ("inDocView" in states && states.inDocView == false && states.inDocView != orig.inDocView) {   
        clearAllButtons(false);                  // false to prevent recursive calling of setKMState()
// debugger;//            return;
    }
    // debugStates(states);


    if (changed) {
        onStateChange(orig);                // if anything changed, call the handler
    }
}


function onTkmKeyDown(evt) {
    FG.kmStates.evt = evt;
    const states = {
        keyCtrl:  evt.ctrlKey,
        keyAlt:   evt.altKey,
        keyShift: evt.shiftKey,
        keyMeta:  evt.metaKey,
    };

    // if (states.keyShift && states.keyAlt) {
    //     debugger;
    // }

    setKMState(states);
}

function onTkmKeyUp(evt) {
    FG.kmStates.evt = evt;
    const states = {
        keyCtrl:  evt.ctrlKey,
        keyAlt:   evt.altKey,
        keyShift: evt.shiftKey,
        keyMeta:  evt.metaKey,
    };
    setKMState(states);
}

function onTkmBlur(evt) {       // this hardly EVER happens but just in case it makes a difference when it does...
    // console.log(FF.__FILE__());
    // clearAllButtons();   // BAD!  caused buttonrelease during drag IF clicked in! nogood!
}
function onTkmContextMenu(evt) {
    if (FG.kmStates.modal || (FG.kmStates.keyAlt && FG.kmStates.keyShift)) { // if menu/popup isopen or alt+shift, ...
        evt.stopPropagation();
        evt.preventDefault();
    }
}


let sizerStartPos = null;         // 'sizerStartPos' = mouse Operation (presently only for click+drag of divHandlers)
function onTkmMousedown(evt) {
    FG.kmStates.evt = evt;
    if (evt.target.id == "divIndexDocSizer") {  // if clicked on the sizerBar
        if (!FG.kmStates.modal) {               // and ONLY if a modal isn't open!
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
    } else {                                    // if clicked on something that's NOT the sizerBar
        // evt.stopPropagation();
        // evt.preventDefault();
        // return;
        const states = {};
        if      (evt.button == 0) {  states["btnLeft"]  = true; }
        else if (evt.button == 1) {  states["btnMid"]   = true; }
        else if (evt.button == 2) {  states["btnRight"] = true; }
        setKMState(states);
    }
}


function onTkmMouseMove(evt) {
    const docDiv = document.getElementById("divDocView");
    if (!FG.kmStates.modal) {
        setKMState({ "inDocView": docDiv.contains(evt.target) });
    }
    FG.kmStates.evt = evt;
    if (sizerStartPos) {        //if dragging the sizerBar
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
    } else {                    // if NOT dragging the sizerbar
        setKMState({"clientX": evt.clientX, "clientY": evt.clientY});
    }
}


function onTkmMouseUp(evt) {
    FG.kmStates.evt = evt;
    if (sizerStartPos) {
        const el = document.getElementById("divIndexDocSizer");
        el.style.cursor = "";
        sizerStartPos = null;
    } else {
        const states = {};
        if      (evt.button == 0) {  states["btnLeft"]  = false; }
        else if (evt.button == 1) {  states["btnMid"]   = false; }
        else if (evt.button == 2) {  states["btnRight"] = false; }
        setKMState(states, evt.target);
    }
}


FF.moveDivRelative = function(el, deltaX, deltaY) {  // from :588 
    const rect = FF.getRawRect(el);
    if (rect.lrMode.includes("L")) { el.style.left   = (rect.L + deltaX) + "px"; }
    if (rect.lrMode.includes("R")) { el.style.right  = (rect.R - deltaX) + "px"; }
    if (rect.tbMode.includes("T")) { el.style.top    = (rect.T + deltaY) + "px"; }
    if (rect.tbMode.includes("B")) { el.style.bottom = (rect.B - deltaY) + "px"; }
}


FF.moveDivAbsolute = function(el, locX, locY) {
    const rect = FF.getRawRect(el);
    if (rect.lrMode.includes("L")) { el.style.left   = locX + "px"; }
    if (rect.lrMode.includes("R")) { el.style.right  = locX + "px"; }
    if (rect.tbMode.includes("T")) { el.style.top    = locY + "px"; }
    if (rect.tbMode.includes("B")) { el.style.bottom = locY + "px"; }
}


FF.sizeDivRelative = function(el, walls, deltaX, deltaY) {  // wall is n|ne|e|se|s|sw|w|nw
    const rect = FF.getRawRect(el);
    const styl = el.style;
    if (walls.includes("w")) {                  // move west wall
        if (rect.lrMode == "LW") {                  // if sysDiv has style.left+style.width
            styl.left   = (rect.L + deltaX) + "px";
            styl.width  = (rect.W - deltaX) + "px";
        }
        if (rect.lrMode == "RW") {                  // if sysDiv has style.right+style.width
            styl.width  = (rect.W - deltaX) + "px";
        }
        if (rect.lrMode == "LR") {                  // if sysDiv has style.left+style.right
            styl.left   = (rect.L + deltaX) + "px";
        }
    }
    if (walls.includes("n")) {                  // move north wall
        if (rect.tbMode == "TH") {                      // if sysDiv has style.top+style.height
            styl.top    = (rect.T + deltaY) + "px";
            styl.height = (rect.H - deltaY) + "px";
        }
        if (rect.tbMode == "BH") {                      // if sysDiv has style.right+style.height
            styl.height = (rect.H - deltaY) + "px";
        }
        if (rect.tbMode == "TB") {                      // if sysDiv has style.top+style.right
            styl.top    = (rect.T + deltaY) + "px";
        }
    }
    if (walls.includes("e")) {                      // move east wall
        if (rect.lrMode == "LW") {                      // if sysDiv has style.left+style.width
            styl.width  = (rect.W + deltaX) + "px";
        }
        if (rect.lrMode == "RW") {                      // if sysDiv has style.right+style.width
            styl.right  = (rect.R - deltaX) + "px";
            styl.width  = (rect.W + deltaX) + "px";
        }
        if (rect.lrMode == "LR") {                      // if sysDiv has style.left+style.right
            styl.right  = (rect.R - deltaX) + "px";
        }
    }
    if (walls.includes("s")) {                      // move north wall
        if (rect.tbMode == "TH") {                      // if sysDiv has style.top+style.height
            styl.height = (rect.H + deltaY) + "px";
        }
        if (rect.tbMode == "BH") {                      // if sysDiv has style.right+style.height
            styl.bottom = (rect.B - deltaY) + "px";
            styl.height = (rect.H + deltaY) + "px";
        }
        if (rect.tbMode == "TB") {                      // if sysDiv has style.top+style.right
            styl.top    = (rect.T + deltaY) + "px";
        }
    }
}


FF.getRawRect = function(el) {
    const rect = {
        lrMode: "",
        tbMode: "",
        L: NaN,
        W: NaN,
        R: NaN,
        T: NaN,
        H: NaN,
        B: NaN,
    };
    let lrMode = "", tbMode = "";
    let left, width, right, top, height, bottom;

    const styl = el.style;
    if (styl.left)  {  rect.lrMode += "L"; rect.L = parseInt(styl.left);  }
    if (styl.right) {  rect.lrMode += "R"; rect.R = parseInt(styl.right); }
    if (styl.width) {  rect.lrMode += "W"; rect.W = parseInt(styl.width); }

    if (styl.top)    {  rect.tbMode += "T"; rect.T = parseInt(styl.top);    }
    if (styl.bottom) {  rect.tbMode += "B"; rect.B = parseInt(styl.bottom); }
    if (styl.height) {  rect.tbMode += "H"; rect.H = parseInt(styl.height); }
    return rect;
}


FF.getBoxAroundDch = function(dch) {
    if (dch) {                                     // !!DO!! allow them to select/move the docroot! 
        let el = dch.__sysDiv;
        while (FF.getDCHName(dch) != "BOX") {      // if dch != BOX, walk parentChain to find one
            let el = dch.__sysDiv;
            while (true) {
                el = el.parentNode;
                if (el._dchMouseOp == "dchComponent") {
                    dch = el._dchHandler;
                    break;
                }
            }
        }
    }
    return dch;
}
