// TKMEvtHandlers = Toplevel Keyboard and Mouse Event Handlers

document.addEventListener("mousedown",   onTkmMousedown, true);    // listen for mouseup/down/move ANYwhere on doc
document.addEventListener("contextmenu", onTkmContextMenu, true);  // listen for contextmenu specifically
  window.addEventListener("blur",        onTkmBlur, true);         // listen for 'leaving browser' specifically
document.addEventListener("mousemove",   onTkmMouseMove, true);
document.addEventListener("mouseup",     onTkmMouseUp,   true);
document.addEventListener("keydown",     onTkmKeyDown, true);
document.addEventListener("keyup",       onTkmKeyUp,   true);

// const div = document.getElementById("divDocView");
// div.addEventListener("mouseleave", mouseleave, true);
// function mouseleave(evt) {
//     // console.log("left");
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// Toplevel MouseHandler stuff below here ///////////////////////////////////////////////////////////////////////////


// so if I click AND HOLD left/middle/right mousebutton then I keep getting key and mouse events even when I leave the 
// browser window, but NOT if click+hold is NOT down!
// this doesnt work on buttons 3 and 4, only on 0,1,2 (left,middle,right)

FG.kmStates = {
    clientX:  0,        // to track mouse position at ALL times (while in browserspace of course) 
    clientY:  0,
    btnLeft:  false,    // currentState of mouseButtons
    btnMid:   false,
    btnRight: false,
    keyAlt:   false,    // currentState of controlKeys
    keyCtrl:  false,
    keyShift: false,
    keyMeta:  false,    // on windows this is the 'Win' key
    modal:    false,    // true when any menu, contextmenu, or dialog is open, else false
    dch:      null,     // the dch the target belongs to  (IF, else null)
    mask:     null, /* {
        divGhost: <div>, // ghost rectangle (greyed rectangle showing hovered-over element even if partially hidden)
        divGhostL:0,
        divGhostT:0,
        divGhostW:0,
        divGhostH:0,
        divMask:  <div>, // mask rectangle (covers entire divDocView) so we can intercept all clicks/moves
        el:       <el>,  // dch element currently hovered over
        left:     set to pixelInt if lrMode has 'L' in it
        top:      set to ...
        width:    set to ...
        height:   set to ...
        lrMode:   "LW", "WR", or "LR"
        nesw:     "n", "ne", "e", "se", "s", "sw", "w", "nw" <-- when mouse near edge of divGhost, this lets us set the appropriate cursor
        startX:   if btnLeft goes down, capture mousepos here
        startY:
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
		<div style="position:absolute;top:20px;left:110px;"><input id="disableT" type="text" class="unAbled" value="X" readonly><label>top</label><br></div>
		<input id="dawIBInputT" type="number"   style="padding:0;position:absolute;top:40px;left:100px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

		<svg id="dawInnerArrowH" width="20" height="200" style="position:absolute;top:86px;left:120px;">
			<line x1="10" y1="10" x2="10" y2="146" stroke="#F00" stroke-width="2" marker-start="url(#dawAHT)" marker-end="url(#dawAHB)" />
		</svg>
		<div style="position:absolute;top:160px;left:102px;"><input id="disableH" type="text" class="unAbled" value="X" readonly><label>height</label><br></div>
		<input id="dawIBInputH" type="number"   style="padding:0;position:absolute;top:180px;left:100px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

		<svg id="dawInnerArrowB" width="20" height="100" style="position:absolute;top:248px;left:120px;">
			<line x1="10" y1="10" x2="10" y2="66" stroke="#F00" stroke-width="2" marker-start="url(#dawAHT)" marker-end="url(#dawAHB)" />
		</svg>
		<div style="position:absolute;top:260px;left:100px;"><input id="disableB" type="text" class="unAbled" value="X" readonly><label>bottom</label><br></div>
		<input id="dawIBInputB" type="number"   style="padding:0;position:absolute;top:280px;left:100px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">




		<svg id="dawIBArrowL" width="100" height="20" style="position:absolute;top:115px;left:5px;">
			<line x1="10" y1="10" x2="80" y2="10" stroke="#000" stroke-width="2" marker-start="url(#dawAHL)" marker-end="url(#dawAHR)" />
		</svg>
		<div style="position:absolute;top:105px;left:33px;"><input id="disableL" type="text" class="unAbled" value="X" readonly><label>left</label><br></div>
		<!-- <input id="dawIBCkBoxL" type="checkbox" style="background-color:red;padding:0;position:absolute;top:105px;left:18px;width:60px;height:20px;" value="x"> -->
		<input id="dawIBInputL" type="number"   style="padding:0;position:absolute;top:125px;left:18px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

		<svg id="dawIBArrowW" width="200" height="20" style="position:absolute;top:115px;left:105px;">
			<line x1="10" y1="10" x2="180" y2="10" stroke="#000" stroke-width="2" marker-start="url(#dawAHL)" marker-end="url(#dawAHR)" />
		</svg>
		<div style="position:absolute;top:105px;left:180px;"><input id="disableW" type="text" class="enAbled" value="&#10004;" readonly><label>width</label><br></div>
		<!-- <input id="dawIBCkBoxW" type="checkbox" style="padding:0;position:absolute;top:105px;left:218px;width:60px;height:20px;" value="x"> -->
		<input id="dawIBInputW" type="number"   style="padding:0;position:absolute;top:125px;left:174px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

		<svg id="dawIBArrowR" width="100" height="20" style="position:absolute;top:115px;left:302px;">
			<line x1="10" y1="10" x2="80" y2="10" stroke="#000" stroke-width="2" marker-start="url(#dawAHL)" marker-end="url(#dawAHR)" />
		</svg>
		<div style="position:absolute;top:105px;left:322px;"><input id="disableR" type="text" class="enAbled" value="&#10004;" readonly><label>right</label><br></div>
		<!-- <input id="dawIBCkBoxR" type="checkbox" style="padding:0;position:absolute;top:105px;left:318px;width:60px;height:20px;" value="x"> -->
		<input id="dawIBInputR" type="number"   style="padding:0;position:absolute;top:125px;left:316px;width:60px;height:20px;" value="-99999" min="-99999" max="99999">

	</div>
`;


function frmSetEl(form, code, posn, enable) {
    let el = form.querySelector("#disable" + code);
    if (enable) {
        el.className = "enAbled";
        el.value = "✔";
    } else {
        el.className = "unAbled";
        el.value = "X";
    }
    if (posn != null) {
        el = form.querySelector("#dawIBInput" + code);
        el.value = posn.toString();
    }
}
function doFormClick(evt) {
    const id = evt.target.id;
    if (id.startsWith("disable")) {
        let el, code;
        switch(id.charAt(7)) {  // L,W,R T,H,B
            case 'L':   {   code = ['L', 'W', 'R']; break;  }
            case 'W':   {   code = ['W', 'L', 'R']; break;  }
            case 'R':   {   code = ['R', 'L', 'W']; break;  }
            case 'T':   {   code = ['T', 'H', 'B']; break;  }
            case 'H':   {   code = ['H', 'T', 'B']; break;  }
            case 'B':   {   code = ['B', 'T', 'H']; break;  }
        }

        frmSetEl(evt.currentTarget, code[0], null, false);
        frmSetEl(evt.currentTarget, code[1], null, true);
        frmSetEl(evt.currentTarget, code[2], null, true);
    }
}
function preRun(form) {
    const dch = FG.kmStates.dch;
    const rect = dch._div.getBoundingClientRect();
    frmSetEl(form, "L", parseInt(dch._div.style.left),   dch._div.style.left.length   > 0);
    frmSetEl(form, "W", parseInt(dch._div.style.width),  dch._div.style.width.length  > 0);
    frmSetEl(form, "R", parseInt(dch._div.style.right),  dch._div.style.right.length  > 0);
    frmSetEl(form, "T", parseInt(dch._div.style.top),    dch._div.style.top.length    > 0);
    frmSetEl(form, "H", parseInt(dch._div.style.height), dch._div.style.height.length > 0);
    frmSetEl(form, "B", parseInt(dch._div.style.bottom), dch._div.style.bottom.length > 0);

    form.addEventListener("click", doFormClick);
}
function postRun(form) {
    form.removeEventListener("click", doFormClick);
}
function onPopupClose(dict) {
}
function onContextDCHProps() {
    const dict={};//{foo:"bar"};
    FF.openPopup(anchorForm, dict, onPopupClose, preRun, postRun);
}


FF.getDCHName = function (dch) {
    for (const key in DCH) {            // get it's dchName by searching for it in the loaded DCH ComponentHandlers
        if (dch instanceof DCH[key]) {  
            return key;
        }
    }
    return null;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
function openDCHContextMenu() {      // based on the el the mouse is over when rightmouse was pressed...
   let dch = FG.kmStates.dch;   // the actual dch instance

    const dchName = FF.getDCHName(dch);  // the name (as found in the globalThis.DCH{} )

    const entries = [];
    if (dch.children !== null) {                // if rightclicked dchHandler allows children...
        for (const key in DCH) {                // add all the addable dch's to the menuEntries
            const dchClass = DCH[key];
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

    const rect = dch._div.getBoundingClientRect();
    const startX = FG.kmStates.clientX - rect.left; // calc mouseXY relative to dch._div rect
    const startY = FG.kmStates.clientY - rect.top;
    async function callback(action) { 
        if (action.startsWith("insert_")) {
            let dchName = action.substr(7);
            const style = {L:startX, T:startY, W:100, H:100};
            const nuDch = await FG.DCH_BASE.create(dchName, dch, style);  // create handler, assign parent, create <div>, set style
            dch.children.push(nuDch);
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
                if (dch.children && dch.children.length > 0) {
                    yes = window.confirm("This node has children that will be deleted too.\nAre you SURE?");
                    if (!yes) {
                        return;
                    }
                }
                dch.destroy();
                FF.autoSave();
                break;
            case "setProps":
                onContextDCHProps();
                break;
        }
    }

    FF.openContextMenu(entries, callback);
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
    FF.autoSave();          // autosave after 5 secs
}


function sizeMaskDiv() {
    let kmask = FG.kmStates.mask;
    const deltaX = FG.kmStates.clientX - kmask.startX;
    const deltaY = FG.kmStates.clientY - kmask.startY;
// console.log(kmask.nesw, kmask.lrMode, kmask.tbMode); 
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
    FF.autoSave();          // autosave after 5 secs
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


function doCmdStateDrawing(orig) { // only called when FG.kmStates.mask = set
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
        FG.kmStates.dch = FF.getDchAt(FG.kmStates.clientX, FG.kmStates.clientY);
        const tmp = FG.kmStates.dch && FG.kmStates.dch._div;
        if (FG.kmStates.dch != FG.curDoc.rootDch) { // do not allow them to select/move the docRoot!
            if (kmask.el && kmask.el != tmp) {      // if there was a dch el already selected but it's not this one any more
                if (kmask.divGhost) {               // remove any exhisting gost
                    div.removeChild(FG.kmStates.mask.divGhost);
                    delete FG.kmStates.mask.divGhost;
                }
            }
            kmask.el = el = tmp;
            kmask.nesw = "";    // set this right away to prevent possible tripup later on
        }
        // const list = document.elementsFromPoint(FG.kmStates.clientX, FG.kmStates.clientY);
        // for (let idx = 1; idx < list.length; idx++) {  // find topmost dchEl
        //     const tmp = list[idx];
        //     if (tmp._dchMouseOp == "dchComponent") {
        //         FG.kmStates.dch = tmp._dchHandler;
        //         if (tmp._dchHandler != FG.curDoc.rootDch) { // do not allow them to select/move the docRoot!
        //             if (kmask.el && kmask.el != tmp) {      // if there was a dch el already selected but it's not this one any more
        //                 if (kmask.divGhost) {               // remove any exhisting gost
        //                     div.removeChild(FG.kmStates.mask.divGhost);
        //                     delete FG.kmStates.mask.divGhost;
        //                 }
        //             }
        //             kmask.el = el = tmp;
        //             kmask.nesw = "";    // set this right away to prevent possible tripup later on
        //         }
        //         break;
        //     }
        // }
    }
    if (FG.kmStates.btnRight && FG.kmStates.dch) {  // if contextMenu button down, ...
        let tmp = document.getElementById("sysContextMenu");
        if (!tmp) {     // only open if a menu isn't already open
            openDCHContextMenu();
        }
        return;
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


function onStateChange(orig) {  // detect commandState change and create a faux invis window over entire divDocView
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
                FG.kmStates.mask = null;
            }
        }
    }
    if (FG.kmStates.modal) {            // a modal operation is happening, ignore state activities after this point
        return;
    }

    if (FG.kmStates.mask) {             // if we're doing commandState gfx and no dialog/menu's are open
        doCmdStateDrawing(orig);
    } else {
        if (FG.kmStates.btnLeft && FG.kmStates.btnLeft != orig.btnLeft) {
            const dch = FF.getDchAt(FG.kmStates.clientX, FG.kmStates.clientY);
            if (dch) {
                const div = document.getElementById("divToolbar");
                for (const child of div.children) {
                    child.style.display="none";         // hide all toolbars then...
                }
                if (dch.hasToolbar) {
                    dch._tBar.style.display = "block";                    
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

function clearAllButtons() {
    const states = {          // inject an 'all buttons released' statechange
        "btnLeft":  false,
        "btnMid":   false,
        "btnRight": false,
        "keyAlt":   false,
        "keyCtrl":  false,
        "keyMeta":  false,
        "keyShift": false,
    };
    setKMState(states);
}


function setKMState(states) {
    let orig = Object.assign({}, FG.kmStates);       // clone the original FG.kmStates before changing them
    let changed = false;

    const valX = "clientX" in states ? states.clientX : null;
    const valY = "clientY" in states ? states.clientY : null;
    if (valX != null || valY != null) {
        let flag = true;
        const div = document.getElementById("divDocView");
        const rect = div.getBoundingClientRect();
        if (valX != null) {
            if (valX < rect.left || valX > rect.right) {
                flag = false;
            }
        }
        if (valY != null) {
            if (valY < rect.top || valY > rect.bottom) {
                flag = false;
            }
        }
        if (!flag) {
            clearAllButtons();
            return;
        }
    }
    
    // debugStates(states);

    for (const key in states) {                      // test field-by-field to see if anything changed
        if (FG.kmStates[key] != states[key]) {
            FG.kmStates[key] = states[key];          // if changed, update FG.kmStates and set changed flag
            changed = true;
        }
    }
    if (changed) {
        onStateChange(orig);                // if anything changed, call the handler
    }
}


function onTkmKeyDown(evt) {
    const states = {};
    if      (evt.key == "Control") { states["keyCtrl"]   = true; }
    else if (evt.key == "Alt")     { states["keyAlt"]    = true; }
    else if (evt.key == "Shift")   { states["keyShift"]  = true; }
    else if (evt.key == "Meta")    { states["keyMeta"]   = true; }
    setKMState(states);
}

function onTkmKeyUp(evt) {
    const states = {};
    if      (evt.key == "Control") { states["keyCtrl"]   = false; }
    else if (evt.key == "Alt")     { states["keyAlt"]    = false; }
    else if (evt.key == "Shift")   { states["keyShift"]  = false; }
    else if (evt.key == "Meta")    { states["keyMeta"]   = false; }
    setKMState(states);
}

function onTkmBlur(evt) {       // this hardly EVER happens but just in case it makes a difference when it does...
    // console.log(FF.__FILE__());
    // clearAllButtons();   // BAD!  caused buttonrelease during drag IF clicked in! nogood!
}
function onTkmContextMenu(evt) {
//    FG.kmStates.btnRight = false;   // manually force the state of the button to false cuz closing ctxmenu doesn't send a mouseup msg!
    if (FG.kmStates.modal || (FG.kmStates.keyCtrl && FG.kmStates.keyAlt)) { // if menu/popup isopen or ctrl+alt, ...
        evt.stopPropagation();
        evt.preventDefault();
    }
    clearAllButtons();
}


let sizerStartPos = null;         // 'sizerStartPos' = mouse Operation (presently only for click+drag of divHandlers)
function onTkmMousedown(evt) {
    if (evt.target.id == "divIndexDocSizer") {  // if clicked on the sizerBar
        let m = {                       // create and init 'global' sizerStartPos object
            startX:      evt.screenX,   // initial evt.screenX and Y (when mouse was pressed)
            startY:      evt.screenY,
        };

        let style = getComputedStyle(evt.target);
        m.dragBarLeft = parseInt(style.left);
        m.dragBarWidth = parseInt(style.width);
        evt.target.style.cursor = "grabbing";

        sizerStartPos = m;    // assign m to sizerStartPos to continue handling this op
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


