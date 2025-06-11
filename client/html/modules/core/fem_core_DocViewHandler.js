// DocViewHandler = Toplevel Keyboard and Mouse Event Handlers

import { DCW_BASE } from "/modules/core/fem_core_DCW_BASE.js";

let el = document.getElementById("divDocView");
// el.addEventListener("focus",       onTkmDocViewFocus, true);                                           // listen for 'leaving browser' specifically
// el.addEventListener("blur",        onTkmDocViewBlur, true);                                           // listen for 'leaving browser' specifically
// el.addEventListener("mouseleave",  onTkmDocViewLeave, true);
// el.addEventListener("mouseenter",  onTkmDocViewEnter, true);
document.addEventListener("contextmenu", onTkmContextMenu, { capture: true, passive: false }); // listen for contextmenu specifically
document.addEventListener("mousedown",   onTkmMousedown,   { capture: true, passive: false }); // listen for mouseup/down/move ANYwhere on doc
document.addEventListener("mousemove",   onTkmMouseMove,   { capture: true, passive: false });
document.addEventListener("mouseup",     onTkmMouseUp,     { capture: true, passive: false });
document.addEventListener("keydown",     onTkmKeyDown,     { capture: true, passive: false });
document.addEventListener("keyup",       onTkmKeyUp,       { capture: true, passive: false });

// function onTkmDocViewFocus(evt) {
//     console.log(FF.__FILE__(), "onTkmDocViewFocus")
// }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//// Toplevel MouseHandler stuff below here ///////////////////////////////////////////////////////////////////////////


// so if I click AND HOLD left/middle/right mousebutton then I keep getting key and mouse events even when I leave the 
// browser window, but NOT if click+hold is NOT down!
// this doesnt work on buttons 3 and 4, only on 0,1,2 (left,middle,right)

FG.ghosts = {     // mode1 ghost info
    divGhost: null,
    nesw:     "",   //"n", "ne", "e", "se", "s", "sw", "w", "nw" <-- when mouse near edge of divGhost, this lets us set the appropriate cursor
    showOOB:  false,    // if true when mode 2, set false and show OOB's,  if false when mode NOT2, set true and clear OOBs 
};

FG.kmStates = {
    mode:     0,        // 0= no alt+shift, 1 = alt+shift, 2=alt+shift, then alt OR shift released then pressed again
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
    keyZ:     false,    // moves us to mode=2
    modal:    false,    // true when any menu, contextmenu, or dialog is open, else false
    dcw:      null,     // the current dcw, (ONLY if mode1 or mode2, null when mode0)
};
FG.kmPrior = null;  // clone of FG.kmStates prior to onStateChange() so we can test if something JUST changed

function frmSetEl(code, val, enable) {     // set checkbox enAbled/unAbled AND set value
    debugger; let elC = document.getElementById("dawIBCkBox" + code);
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
    debugger; formChanged = true;
    const dcw = FG.kmStates.dcw;
    let ss = dcw._s_sysDiv.style;
    const val = parseInt(evt.target.value) || 0;
    switch(evt.target.id.charAt(10)) {    // dawIBInputL, dawIBInputW, etc...
        case 'L':   { ss.left   = val + "px";  break; }     // counter the zX before setting
        case 'W':   { ss.width  = val + "px";  break; }
        case 'R':   { ss.right  = val + "px";  break; }
        case 'T':   { ss.top    = val + "px";  break; }
        case 'H':   { ss.height = val + "px";  break; }
        case 'B':   { ss.bottom = val + "px";  break; }
    }

    let rect = dcw._s_sysDiv.getBoundingClientRect();
    FF.moveDivAbsolute(FG.ghosts.divGhost, rect.left, rect.top);
}


let formChanged;
let formOrigVals;
function onFormClick(evt) {
    debugger; if (evt.target.id.startsWith("dawIBCkBox")) {       // if a checkbox was clicked...
        formChanged = true;
        const dcw = FG.kmStates.dcw;
        // const pRect = dcw.__parent.host.getBoundingClientRect();    // get the infinite-sized div, not the DCH div
        const pRect = dcw.__parent._s_sysDiv.getBoundingClientRect();
        const rect = dcw._s_sysDiv.getBoundingClientRect();

        const id = evt.target.id;
        const box = { 
            L: (rect.left - pRect.left)  + "px", 
            W: rect.width  + "px", 
            R: (pRect.right - rect.right) + "px",
            T: (rect.top - pRect.top)    + "px", 
            H: rect.height + "px", 
            B: (pRect.bottom - rect.bottom) + "px",
        };
        let code;
        let ss = dcw._s_sysDiv.style;
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
    debugger; const dcw = FG.kmStates.dcw;
    const ss = dcw._s_sysDiv.style;
    frmSetEl("L", (parseInt(ss.left) || 0),   ss.left.length   > 0);
    frmSetEl("W", (parseInt(ss.width) || 0),  ss.width.length  > 0);
    frmSetEl("R", (parseInt(ss.right) || 0),  ss.right.length  > 0);
    frmSetEl("T", (parseInt(ss.top) || 0),    ss.top.length    > 0);
    frmSetEl("H", (parseInt(ss.height) || 0), ss.height.length > 0);
    frmSetEl("B", (parseInt(ss.bottom) || 0), ss.bottom.length > 0);
}


const anchorStyle = `<style>
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
</style>`;
const anchorForm = `
	<form id="popDlgDCHAnchor" style="position:relative;width:396px;height:326px;background-color:lightblue;">
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
		<input id="dawIBInputT" type="number" min="-99999" max="99999" style="padding:0;position:absolute;top:40px;left:100px;width:60px;height:20px;">

		<svg id="dawInnerArrowH" width="20" height="200" style="position:absolute;top:86px;left:120px;">
			<line x1="10" y1="10" x2="10" y2="146" stroke="#F00" stroke-width="2" marker-start="url(#dawAHT)" marker-end="url(#dawAHB)" />
		</svg>
		<div style="position:absolute;top:160px;left:102px;"><input id="dawIBCkBoxH" type="text" class="unAbled" value="X" readonly><label>height</label><br></div>
		<input id="dawIBInputH" type="number" min="20" max="99999" style="padding:0;position:absolute;top:180px;left:100px;width:60px;height:20px;">

		<svg id="dawInnerArrowB" width="20" height="100" style="position:absolute;top:248px;left:120px;">
			<line x1="10" y1="10" x2="10" y2="66" stroke="#F00" stroke-width="2" marker-start="url(#dawAHT)" marker-end="url(#dawAHB)" />
		</svg>
		<div style="position:absolute;top:260px;left:100px;"><input id="dawIBCkBoxB" name="cboxB" type="text" class="unAbled" value="X" readonly><label>bottom</label><br></div>
		<input id="dawIBInputB" name="inputB" type="number" min="-99999" max="99999"style="padding:0;position:absolute;top:280px;left:100px;width:60px;height:20px;">

		<svg id="dawIBArrowL" width="100" height="20" style="position:absolute;top:115px;left:5px;">
			<line x1="10" y1="10" x2="80" y2="10" stroke="#000" stroke-width="2" marker-start="url(#dawAHL)" marker-end="url(#dawAHR)" />
		</svg>
		<div style="position:absolute;top:105px;left:33px;"><input id="dawIBCkBoxL" name="cboxL" type="text" class="unAbled" value="X" readonly><label>left</label><br></div>
		<input id="dawIBInputL" name="inputL" type="number" min="-99999" max="99999"style="padding:0;position:absolute;top:125px;left:18px;width:60px;height:20px;">

		<svg id="dawIBArrowW" width="200" height="20" style="position:absolute;top:115px;left:105px;">
			<line x1="10" y1="10" x2="180" y2="10" stroke="#000" stroke-width="2" marker-start="url(#dawAHL)" marker-end="url(#dawAHR)" />
		</svg>
		<div style="position:absolute;top:105px;left:180px;"><input id="dawIBCkBoxW" name="cboxW" type="text" class="enAbled" value="&#10004;" readonly><label>width</label><br></div>
		<input id="dawIBInputW" name="inputW" type="number" min="20" max="99999" style="padding:0;position:absolute;top:125px;left:174px;width:60px;height:20px;">

		<svg id="dawIBArrowR" width="100" height="20" style="position:absolute;top:115px;left:302px;">
			<line x1="10" y1="10" x2="80" y2="10" stroke="#000" stroke-width="2" marker-start="url(#dawAHL)" marker-end="url(#dawAHR)" />
		</svg>
		<div style="position:absolute;top:105px;left:322px;"><input id="dawIBCkBoxR" name="cboxR" type="text" class="enAbled" value="&#10004;" readonly><label>right</label><br></div>
		<input id="dawIBInputR" name="inputR" type="number" min="-99999" max="99999" style="padding:0;position:absolute;top:125px;left:316px;width:60px;height:20px;">
	</form>
`;
let dlg;
function onContextDCHLayout() {
    debugger; async function _preRun(form) {
        formChanged = false;
        const dcw = FG.kmStates.dcw;
        formOrigVals = {
            left:   dcw._s_sysDiv.style.left,
            width:  dcw._s_sysDiv.style.width,
            right:  dcw._s_sysDiv.style.right,
            top:    dcw._s_sysDiv.style.top,
            height: dcw._s_sysDiv.style.height,
            bottom: dcw._s_sysDiv.style.bottom,
        };
        setFormVals();
        form.addEventListener("click", onFormClick);
        form.addEventListener("input", onFormInput);
    }
    async function _onBtn(btnLabel, dict) {
        debugger; if (!dict.isSubmit) {
            const ss = FG.kmStates.dcw._s_sysDiv.style;
            ss.left   = formOrigVals.left;      // if dict == null, cancel was clicked, so restore original values
            ss.width  = formOrigVals.width;
            ss.right  = formOrigVals.right;
            ss.top    = formOrigVals.top;
            ss.height = formOrigVals.height;
            ss.bottom = formOrigVals.bottom;
            formChanged = false;                // unset the changed state
        }
        return true;                // tell dialog to close no matter what button was pressed
    }
    async function _postRun(form) {
        debugger; form.removeEventListener("input", onFormInput);
        form.removeEventListener("click", onFormClick);
        if (formChanged) {
            FF.autoSave(0);         // save immediately
        }
        FG.kmStates.modal = false;  // MUST be cleared before onStateChange()!
        onStateChange({});          // just to bump an update so ghost clears
    }
    
    FG.kmStates.modal = true;
    dlg = new DFDialog({ preRun: _preRun, postRun: _postRun, onButton: _onBtn });
    dlg.open({form:anchorForm, styles:[anchorStyle]}); // _preRun handles populating form so no fields passed in here
}


function onContextDCHProps() {
/*
RSTODO: In here we have to query the dch handler itself and allow them to define their own dialog, so how best to do that?

(we may need to do a spinwatch on the dialog's existence within the html so that when it goes away we clear the .modal flag)
because we can't rely on the dch to do it itself
*/    
    async function _preRun(form) {
    }
    async function _onBtn(btnLabel, dict) {
        return true;                // tell dialog to close no matter what button was pressed
    }
    async function _postRun(form) {
        debugger; FG.kmStates.modal = false;  // MUST be cleared before onStateChange()!
        onStateChange({});          // just to bump an update so ghost clears
    }
    
    debugger; FG.kmStates.modal = true;
    dlg = new DFDialog({ preRun: _preRun, postRun: _postRun, onButton: _onBtn });
    dlg.open({form:"<form>temporary</form>"});
}


FF.getDchName = function (dch) {
    for (const key in DCH) {            // get it's dchName by searching for it in the loaded DCH ComponentHandlers
        if (dch instanceof DCH[key].dchClass) {  
            return key;
        }
    }
    return null;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { DFContextMenu } from "/public/classes/DFContextMenu.js";
import { DFDialog }      from "/public/classes/DFDialog.js";

const _dchContextMenu = new DFContextMenu();
function openDCHContextMenu() {      // based on the dch the mouse is over when rightmouse was pressed...
    debugger; let dcw = FG.kmStates.dcw;

    const entries = [];
    if (FF.getDchName(dcw._s_dch) != "BOX") {
        for (const key in DCH) {    // add all the addable dch's to the menuEntries
            const dchClass = DCH[key].dchClass;
            if (dchClass.pluginName !== null) {   
                entries.push({ action:"insert_" + key, label:"Insert new " + dchClass.pluginName, tip:dchClass.pluginTooltip});
            }
        }
    }
    entries.push({action:"", label:"", tip:""});
    entries.push({action:"export", label:"Export Element", tip:"Export node (and all children) under cursor to local file"});


    if (dcw != FG.curDoc.rootDcw) {     // never allow deleting the topmost BOX element from this menu
        entries.push({action:"delete", label:"Delete node (and all children)", tip:"Delete document element under mouse and all children inside it"});
        entries.push({action:"", label:"", tip:""});     // nor allow changing the styles
        entries.push({action:"setLayout", label:"Layout, anchors and depth", tip:"Modify the node's position and anchors, and change the front to back depth"});
        entries.push({action:"setProps", label:"Properties", tip:"Modify the anchors, border, background color, etc"});
    }

    const rect = dcw._s_sysDiv.getBoundingClientRect();
    const startX = FG.kmStates.clientX - rect.left; // calc mouseXY relative to dcw._s_sysDiv rect
    const startY = FG.kmStates.clientY - rect.top;
    
    async function onContextMenuClose(action) { 
        FG.kmStates.modal = false;
        if (action.startsWith("insert_")) {
            let dchName = action.substr(7);
console.log(FF.__FILE__(), "nuDch X=", startX, ", Y=", startY);
            const style = {L:startX, T:startY, W:100, H:100};
            debugger; /* doublecheck!*/ const nuDcw = await DCW_BASE.create(dcw, style);  // create nuDcw, parentTo dcw, set style
            await nuDcw.attachDch(dchName);
            // dcw._s_children.push(nuDch);
            FF.autoSave();
        }
        switch (action) {                                     // 'go do' whatever was clicked
            case "export":
/*RSTODO 2.0*/  debugger; let extracter = new FG.DocExtracter();    //RSNOTE DOES NOT detach! ONLY extracts!!!!
                let str = await extracter.extract(dcw, true);
                console.log(str);
                break;
            case "delete":
                const dchName = FF.getDchName(dcw._s_dch);
                let yes = window.confirm("Delete node '" + dchName + ", are you sure?");
                if (!yes) {
                    return;
                }
                if (dcw._s_children && dcw._s_children.length > 0) {
                    yes = window.confirm("This node has children that will be deleted too.\nAre you SURE?");
                    if (!yes) {
                        return;
                    }
                }
                setKMStateMode(0);  // obliterate all ghosting and modeing 
                await dcw.destroy();
                FF.autoSave();
                break;
            case "setLayout":
                onContextDCHLayout();
                break;
            case "setProps":
                onContextDCHProps();
                break;
        }
    }

    FG.kmStates.modal = true;
    _dchContextMenu.open(entries, onContextMenuClose, FG.kmStates.clientX, FG.kmStates.clientY);
}


function getDcwAt(clientX, clientY) {
    if (!FG.kmStates.inDocView) {
        return null;
    }
    const list = document.elementsFromPoint(clientX, clientY);
    for (let idx = 1; idx < list.length; idx++) {  // find topmost dcwEl
        const tmp = list[idx];
        if (tmp._dcw) {          // is <el> under mouse a  dcw?
            return tmp._dcw;
        }
    }
    return null;
}


function setKBModeTitlebarText(dcw) {
    if (!dcw) {    // dcw can be null when first entering mode 1/2 from mode0
        return;
    }
    let el = document.getElementById("__tmpKBModeTitlebar");
    if (el) {
        let txt = `
<div style="display:flex;align-items:center;height:100%;">
    Node: ${dcw._s_dch.constructor.pluginName} &nbsp; &nbsp; Mode: `;

        let ss;
        if (FG.kmStates.mode == 2) {
            txt += "Infinite Pan";
        } else {
            txt += "Drag/Resize";
        }

        txt += `</div>`;

        el.innerHTML = txt;
    }
}


const __skbmtbtxtStyle = /*setup the styles used by the setKBModeToolbarText() func*/`
<style>
    .aT {                        /* T for Text */
        display:    inline-block;
        width:      60px;
        text-align: right;
    }
    .aD {                        /* D for Data */
        display:    inline-block;
        width:      50px;
        text-align: left;
        padding-left:8px;
        height:     1em;
    }
</style>
`;
function __mkSkbmtbtxtFld(wrd, val, show) { // create the <span>s to display val in the toolbar
    let bgc;
    if (show) {
        bgc="white"
    } else {
        bgc="#CCCCCC"
    }
    return `    <span  style="background-color:${bgc};"><span class="aT">${wrd}:</span><span class="aD"">${val}</span></span>`;
}

function setKBModeToolbarText(dcw) {
    if (!dcw) {    // dcw can be null when first entering mode 1/2 from mode0
        return;
    }
    let el = document.getElementById("__tmpKBModeToolbar");
    if (el) {
        let txt = __skbmtbtxtStyle + `
<div style="display:flex;align-items:center;height:100%;">`;

        let ss;
        if (FG.kmStates.mode == 2) {
            txt += "Offset: &nbsp; &nbsp; X: " + dcw._s_dch.zX + ", &nbsp; &nbsp; Y: " + dcw._s_dch.zY

        } else {
            function getstylVal(val) {      // return a num or '---' if isNaN
                let qq = parseInt(val);
                if (isNaN(qq)) {
                    return "---";
                }
                return qq;
            }
            const box = {
                left:     getstylVal(dcw._s_sysDiv.style.left),
                width:    getstylVal(dcw._s_sysDiv.style.width),
                right:    getstylVal(dcw._s_sysDiv.style.right),
                top:      getstylVal(dcw._s_sysDiv.style.top),
                height:   getstylVal(dcw._s_sysDiv.style.height),
                bottom:   getstylVal(dcw._s_sysDiv.style.bottom),
            }
            for (const key in box) {
                txt += __mkSkbmtbtxtFld(key, box[key], dcw._s_sysDiv.style[key]); // create the <span>s to display val in the toolbar
            }
        }
        txt += `</div>`;

        el.innerHTML = txt;
    }
}


FF.getAllDcw = function() {
    if (!FG.curDoc) {
        return [];
    }
    let dcw = FG.curDoc.rootDcw;
    let list = [dcw];                     // add rootDcw right away

    function getKids(dcw) {
        if (dcw._s_children && dcw._s_children.length > 0) {
            for (let child of dcw._s_children) {
                list.push(child);           // add child, and get it's kids next too
                getKids(child);
            }
        }
    }
    getKids(dcw);
    return list;
}


function getChildrenBoundingRect(dcw) {
    let rect = {
        L: 999999999,
        R: 0,
        T: 999999999,
        B: 0,
    }
    for (const tmp of dcw._s_children) {
        const box = tmp._s_sysDiv.getBoundingClientRect();
        if (box.left < rect.L)               { rect.L = box.x;                }
        if ((box.left + box.width) > rect.R) { rect.R = box.left + box.width; }
        if (box.top < rect.T)                { rect.T = box.top;              }
        if ((box.top + box.height) > rect.B) { rect.B = box.top + box.height; }
    }
    return rect;
}


function showOOB() {
    // console.log(FF.__FILE__(), "showOOB");
    FG.ghosts.showOOB = true;
    const dcwList = FF.getAllDcw();
    for (const dcw of dcwList) {
        if (FF.getDchName(dcw._s_dch) == "BOX") {  // only do this to BOXes
            let pRect = dcw._s_sysDiv.getBoundingClientRect();
            let cRect = getChildrenBoundingRect(dcw);
            // console.log(FF.__FILE__(), dcw._s_sysDiv.id.padStart(8, '-'), "parent=", JSON.stringify(pRect));
            // console.log(FF.__FILE__(), dcw._s_sysDiv.id.padStart(8, '-'), "childs=", JSON.stringify(cRect));

            dcw._s_sysDiv.classList.remove("border-T");
            dcw._s_sysDiv.classList.remove("border-R");
            dcw._s_sysDiv.classList.remove("border-B");
            dcw._s_sysDiv.classList.remove("border-L");

            if (FG.kmStates.mode != 0) {            // only show borders if mode 1 or 2
                if (cRect.T < pRect.top)    { dcw._s_sysDiv.classList.add("border-T"); }
                if (cRect.R > pRect.right)  { dcw._s_sysDiv.classList.add("border-R"); }
                if (cRect.B > pRect.bottom) { dcw._s_sysDiv.classList.add("border-B"); }
                if (cRect.L < pRect.left)   { dcw._s_sysDiv.classList.add("border-L"); }
            }
        }
    }
}
// function clearOOB() {
//     console.log(FF.__FILE__(), "clearOOB");
//     FG.ghosts.showOOB = false;
//     const dcwList = FF.getAllDcw();
//     for (const dcw of dcwList) {
//         dcw._s_sysDiv.classList.remove("border-T");
//         dcw._s_sysDiv.classList.remove("border-R");
//         dcw._s_sysDiv.classList.remove("border-B");
//         dcw._s_sysDiv.classList.remove("border-L");
//     }
// }
function showGhosts(dcw) {
    const mDiff = FG.kmStates.mode != FG.kmPrior.mode;  // did the current mode change?
    const dDiff = FG.kmStates.dcw  != FG.kmPrior.dcw;   // did the dcw under mouse change?
    // console.log(FF.__FILE__(), "showGhosts dcw=", dcw != null, "mode=", FG.kmStates.mode, "mDiff=", mDiff, "dDiff=", dDiff);
    showOOB();
    // if (FG.kmStates.mode != 2 && !FG.ghosts.showOOB) {  // if mode0 and not showing OOBs
    //     showOOB();
    // } else if (FG.kmStates.mode == 0 && FG.ghosts.showOOB) {  // if mode NOT 0 and IS showing OOBs
    //     clearOOB();
    // }
    if (mDiff || dDiff) {                               // if mode or dcw under mouse changed, clear all ghosts
        if (FG.ghosts.divGhost) {
            FG.ghosts.divGhost.remove();
            FG.ghosts.divGhost = null;      // RSTODO can we eliminate this 'divGhost' entirely now that we use __divGhost ?
        }
        let dcwList = FF.getAllDcw();       // also delete all child ghosts everywhere
        for (const tmp of dcwList) {
            if (tmp.__divGhost) {
                tmp.__divGhost.remove();
                delete tmp.__divGhost;
            }
        }
    }
    if (!dcw) {
        return;
    }
    let ghost = FG.ghosts.divGhost;
    if (!ghost) {
        // console.log(FF.__FILE__(), "showGhost:  creating ghostDiv");
        ghost = document.createElement("div");
        ghost.style.position = "fixed";   // fixed to ignore all other div-inside-div measurings
        const docDiv = document.getElementById("divDocView");
        docDiv.appendChild(ghost);
        FG.ghosts.divGhost = ghost;
        if (FG.kmStates.mode == 2) {    // we're in mode 2 and dch is guaranteed to be a box
            for (const child of dcw._s_children) {
                const el = document.createElement("div");
                el.style.position = "fixed";   // fixed to ignore all other div-inside-div measurings
                el.style.backgroundColor = "rgba(0, 0, 0, 0.25)";
                let rect = child._s_sysDiv.getBoundingClientRect();
                el.style.left    = rect.x + "px";
                el.style.top     = rect.y + "px";
                el.style.width   = rect.width + "px";
                el.style.height  = rect.height + "px";
                docDiv.appendChild(el);
                child.__divGhost = el;
            }
        }
    }

    if (FG.kmStates.mode == 1) {
        FG.ghosts.divGhost.style.backgroundColor = "rgba(0, 0, 0, 0.25)";       // mode1, darkern covering
    } else {
        FG.ghosts.divGhost.style.backgroundColor = "rgba(0, 0, 0, 0.15)";       // mode2, lighter covering
    }
    let rect = dcw._s_sysDiv.getBoundingClientRect();    // match the toplevel ghost to the selected dcw
    ghost.style.left    = rect.x + "px";
    ghost.style.top     = rect.y + "px";
    ghost.style.width   = rect.width + "px";
    ghost.style.height  = rect.height + "px";
    if (FG.kmStates.mode == 2) {                        // if mode2, move the ghosts of the children too
        for (const child of dcw._s_children) {
            rect = child._s_sysDiv.getBoundingClientRect();
            child.__divGhost.style.left    = rect.x + "px";
            child.__divGhost.style.top     = rect.y + "px";
            child.__divGhost.style.width   = rect.width + "px";
            child.__divGhost.style.height  = rect.height + "px";
        }
    }
}

function doDchOpMode1() { // only called when FG.kmStates.mode == 1 (mousemove etc, not JUST on modechange)
    if (!FG.kmStates.inDocView) {
        return;
    }
    if (!FG.curDoc) {
        return;
    }

    let dcw = null; // mouseUP = currently hovered dcw/null, mouseDOWN = dcw under mouse btn pressed/null
    const docDiv = document.getElementById("divDocView");

    if (FG.kmStates.dcw === FG.curDoc.rootDcw) {    // if rootDcw WAS selected (via mode2), THEN we came back here to mode1
        FG.kmStates.dcw = dcw = null;               // unset it (we don't 'mode1' on rootDcw ever!)
    }
    // console.log(FF.__FILE__(), "doDchOpMode1: dcw=", FG.kmStates.dcw);

    if (FG.kmStates.btnLeft) {                      // if mouseLeft down, stick with currently selected dcw
        dcw = FG.kmStates.dcw;
    } else {                                        // mouseleft NOT down, find dcw currently hovering over
        dcw = getDcwAt(FG.kmStates.clientX, FG.kmStates.clientY);
        // if (FG.kmStates.dcw != FG.curDoc.rootDcw) {      
            if (dcw && dcw != FG.kmStates.dcw) {                // if dcw @mouse !same as last time through here
                if (FG.ghosts.divGhost) {                           // remove any exhisting ghost
                    FG.ghosts.divGhost.remove();
                    FG.ghosts.divGhost = null;
                }
            }
            FG.kmStates.dcw = dcw;
            FG.ghosts.nesw = "";                      // clear this right away to prevent possible tripup later on
            setKBModeTitlebarText(FG.kmStates.dcw);     // fire 'first time' to get data on screen (else wont show til mousemove)
            setKBModeToolbarText(FG.kmStates.dcw);
        // }
    }
    showGhosts(dcw);                // show any changes to the ghosting state
    if (FG.kmStates.btnRight) {             // if contextMenu button down, ...
        let tmp = document.getElementById("sysContextMenu");
        if (!tmp) {     // only open if a menu isn't already open
            openDCHContextMenu();
        }
        return;
    }
    if (dcw == FG.curDoc.rootDcw) {         // in mode1, do not allow them to select/move the docRoot!
        dcw = null;
    }
    if (!dcw) {                             // there's no dcw under the mouse,  nothing to do!
        docDiv.style.cursor = "";
        return;
    }
// dcw now refs the FG.kmStates.dcw currently hovered over

    if (!FG.ghosts.divGhost) {     // we're over an element but no ghost was created yet
        showGhosts(dcw);              // create the ghost
    }
    if (!FG.kmStates.btnLeft) {      // and mouseLeft NOT down...
        let rect = dcw._s_sysDiv.getBoundingClientRect();
        const slop = 6;              // figure out if mouse is over a dcw border and set FG.ghosts.nesw accordingly
        rect.r = rect.x + rect.width - 1;
        rect.b = rect.y + rect.height - 1;
        const irect = {
            x: rect.x + slop,
            y: rect.y + slop,
            r: rect.r - slop,
            b: rect.b - slop,
        };
        FG.ghosts.nesw = "";
        if (FG.kmStates.clientY >= rect.y && FG.kmStates.clientY <= irect.y) {
            FG.ghosts.nesw += "n"
        }
        if (FG.kmStates.clientY <= rect.b && FG.kmStates.clientY >= irect.b) {
            FG.ghosts.nesw += "s"
        }
        if (FG.kmStates.clientX <= rect.r && FG.kmStates.clientX >= irect.r) {
            FG.ghosts.nesw += "e"
        }
        if (FG.kmStates.clientX >= rect.x && FG.kmStates.clientX <= irect.x) {
            FG.ghosts.nesw += "w"
        }
        
        if (FG.ghosts.nesw.length > 0) {                // set cursor based on mouse over border or content
            docDiv.style.cursor = FG.ghosts.nesw + "-resize";
        } else {
            docDiv.style.cursor = "grab";
        }
    } else {                            // if mouseLeft IS down...
        const deltaX = FG.kmStates.clientX - FG.kmPrior.clientX;
        const deltaY = FG.kmStates.clientY - FG.kmPrior.clientY;
        if (deltaX || deltaY) {
            if (FG.ghosts.nesw.length > 0) {            // if over an edge or corner, resize...
                FF.sizeDivRelative(dcw._s_sysDiv, FG.ghosts.nesw, deltaX, deltaY);
                FF.sizeDivRelative(FG.ghosts.divGhost, FG.ghosts.nesw, deltaX, deltaY);
                // dcw.onResize();
            } else {                                // ...else move
                FF.moveDivRelative(dcw._s_sysDiv, deltaX, deltaY);
                FF.moveDivRelative(FG.ghosts.divGhost, deltaX, deltaY);
                // dcw.onMove();
            }
        }

        FF.autoSave();          // autosave after n secs
        setKBModeToolbarText(FG.kmStates.dcw);
    }
}
function doDchOpMode2() { // only called when FG.kmStates.mode == 2  (mousemove etc, not JUST on modechange)
    debugger; let dcw = null; // mouseUP = currently hovered dcw/null, mouseDOWN = dcw under mouse btn pressed/null
    const docDiv = document.getElementById("divDocView");

    if (FG.kmStates.btnLeft) {                     // if mousleft down, use existing hovered-over dcw
        dcw = FG.kmStates.dcw;
    } else {
        dcw = getDcwAt(FG.kmStates.clientX, FG.kmStates.clientY);    // get dcw under cursor (even if it is the root!)
        dcw = FF.getBoxAroundDch(dcw);                                  // get parent BOX (or self if is a BOX)
        FG.kmStates.dcw = dcw;

        setKBModeTitlebarText(dcw); // fire 'first time' to get data on screen (else wont show til mousemove)
        setKBModeToolbarText(dcw);
    }
    showGhosts(dcw);                 // delete-or-show ghost over the BOX
    if (!dcw) {         // there's no dcw under the mouse,  nothing to do!
        docDiv.style.cursor = "";
        return;
    }
// dcw now refs the BOX the FG.kmStates.dcw currently hovered over resides within (or self if is a BOX)

    // if (!FG.ghosts.divGhost) {     // we're over an element but no ghost was created yet
    //     showGhosts(dcw);
    // }

    if (!FG.kmStates.btnLeft) {      // and mouseLeft NOT down...
    } else {                         // if mouseLeft IS down...
        const deltaX = FG.kmStates.clientX - FG.kmPrior.clientX;
        const deltaY = FG.kmStates.clientY - FG.kmPrior.clientY;
        if (deltaX || deltaY) {
            dcw._s_dch.zX += deltaX;
            dcw._s_dch.zY += deltaY;
            dcw.update();
            FF.autoSave();          // autosave after n secs
        }
    }
    setKBModeTitlebarText(dcw);
    setKBModeToolbarText(dcw);
}


function setKMStateMode(mode) {     // set kmStates.mode and also add/remove the __tmpKBModeTitlebar/Toolbar
    FG.kmStates.mode = mode;
    // disableAllShadowHosts(mode != 0);  // enable if 0, else disable all dcw shadow DOMS
    if (mode == 0) {
        let el = document.getElementById("__tmpKBModeToolbar");
        if (el) {
            el.remove();
        }
        el = document.getElementById("__tmpKBModeTitlebar");
        if (el) {
            el.remove();
        }
        const docDiv = document.getElementById("divDocView");
        docDiv.style.cursor = "";          // undo all cursor settings when commandState released

        if (FG.ghosts.divGhost) {
            showGhosts(null);
        }
        if (FG.kmStates.dcw) {
            FG.kmStates.dcw = null;                 // unset any selected dcw;
        }
    } else {
        if (FG.curDoc) {    // prevent titlebar being taken over when there's not even a selected doc
            let el = document.getElementById("__tmpKBModeTitlebar");
            if (!el) {
                el = document.createElement("div");
                el.id = "__tmpKBModeTitlebar";
                el.style.position = "absolute";
                el.style.width = "100%";
                el.style.height = "100%";
                el.style.backgroundColor = "white";
                let tBar = document.getElementById("divTitlebar");
                tBar.appendChild(el);
            }
            el = document.getElementById("__tmpKBModeToolbar");
            if (!el) {
                el = document.createElement("div");    
                el.id = "__tmpKBModeToolbar";
                el.style.position = "absolute";
                el.style.width = "100%";
                el.style.height = "100%";
                el.style.backgroundColor = "white";
                let tBar = document.getElementById("divToolbar");
                tBar.appendChild(el);
            }
            setKBModeTitlebarText(FG.kmStates.dcw);
            setKBModeToolbarText(FG.kmStates.dcw);
        }
    }
}

function getCmdMode(src = FG.kmStates) {      // alternately pass in FG.kmPrior
    if (src.keyAlt && src.keyShift) {
        if (src.keyZ) {
            return 2;       // alt+shift+z are pressed
        }
        return 1;           // alt+shift only
    }

    if (FG.kmStates.dcw) {  // mode=0, (alt+shift NOT pressed) close anything open
        setKMStateMode(0);
    }
    return 0;                               // if only one or neither are down
}


// sets/zeros FG.kmStates.mode based on cmdKeys pressed/released OR toggled
function onStateChange() {  // detect commandState change and create a faux invis window over entire divDocView
    if (FG.kmStates.modal) {            // a modal operation is happening, ignore state activities after this point
        return;
    }
    // const docDiv = document.getElementById("divDocView");
    let oldCMode = getCmdMode(FG.kmPrior);
    let newCMode = getCmdMode();
    // console.log(FF.__FILE__(), oldCMode, newCMode);

    if (oldCMode != newCMode) {             // if commandState changed
        setKMStateMode(newCMode);           // set kmStates.mode, add/rmv ghosts, title/toolbars, dis/enable shadow DOMs
    }

    if (FG.kmStates.mode == 1) {            // alt+shift pressed
        doDchOpMode1();
    } else if (FG.kmStates.mode == 2) {   // alt+shift+Z pressed
        doDchOpMode2();
    } else {
        if (FG.kmStates.btnLeft && FG.kmStates.btnLeft != FG.kmPrior.btnLeft) {  // show toolbar for dch, hide all others
            if (FG.curDoc) {
                const div = document.getElementById("divToolbar");          // hide all dch toolbars
                for (const child of div._s_children) {
                    child.style.display = "none";
                }
                FF.setToolbarHeight(FG.defaultToolbarHeight);               // reset default toolbar height
            }
            const dcw = getDcwAt(FG.kmStates.clientX, FG.kmStates.clientY); // are we over a dcw?
            if (dcw) {
                dcw.showToolbar();                                          // show its dch's toolbar
            }
        }
    }
}


function debugStates(states) {
    debugger; const wrds = ["btnLeft", "btnMid", "btnRight", "keyAlt", "keyCtrl", "keyShift", "keyMeta", "modal"];
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

    debugger; const states = {          // inject an 'all buttons released' statechange
        "btnLeft":  false,
        "btnMid":   false,
        "btnRight": false,
    };
    
    for (const key in FG.kmStates) {
        if (key.startsWith("key")) {
            states[key] = false;
        }
    }
    setKMStateMode(0);

    if (callSetKMState) {
        setKMState(states);
    }
}

function setKMState(states) {
    FG.kmPrior = Object.assign({}, FG.kmStates);     // clone the original FG.kmStates before changing them
    let changed = false;

    for (const key in states) {                      // test field-by-field to see if anything changed
        if (FG.kmStates[key] != states[key]) {
            FG.kmStates[key] = states[key];          // if changed, update FG.kmStates and set changed flag
            changed = true;
        }
    }

// if mouse moved from inside to outside (or vica/versa) the scope of divDocView
    if (FG.kmStates.inDocView != FG.kmPrior.inDocView) {   
        clearAllButtons(false);                  // false to prevent recursive calling of setKMState()
    }
    // debugStates(states);

    if (changed) {
        onStateChange();                         // if anything changed, call the handler
    }
}


function onTkmKeyDown(evt) {
    const states = {
        keyCtrl:  evt.ctrlKey,
        keyAlt:   evt.altKey,
        keyShift: evt.shiftKey,
        keyMeta:  evt.metaKey,
    };

    if (evt.key == 'z' || evt.key == 'Z') {
        states.keyZ = true;
    }
    setKMState(states);
}

function onTkmKeyUp(evt) {
    const states = {
        keyCtrl:  evt.ctrlKey,
        keyAlt:   evt.altKey,
        keyShift: evt.shiftKey,
        keyMeta:  evt.metaKey,
    };
    if (evt.key == 'z' || evt.key == 'Z') {
        states.keyZ = false;
    }
    setKMState(states);
}


function onTkmContextMenu(evt) {
    if (FG.kmStates.dcw == null) {      // if no dcw, this should be popping the system default context menu
        FG.kmStates.btnRight = false;   // so 'lose the right button' which it gets stuck on
    }

    if (FG.kmStates.modal || (FG.kmStates.keyAlt && FG.kmStates.keyShift)) { // if menu/popup isopen or alt+shift, ...
        evt.stopPropagation();
        evt.preventDefault();
    }
}


let sizerStartPos = null;         // 'sizerStartPos' = mouse Operation (presently only for click+drag of divHandlers)
function onTkmMousedown(evt) {
    if (FG.kmStates.modal) {
        return;
    }
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


function setInDocView(evt) {
    let el = document.getElementById("divDocView");
    let rect = el.getBoundingClientRect();
    FG.kmStates.inDocView = evt.clientX >= rect.left && evt.clientX <= rect.right
             && evt.clientY >= rect.top && evt.clientY <= rect.bottom;
}


FF.setSizerPos = function(pos) {
    if (pos > 48 && pos < 1200 ) {       // prevent overshrinking/expanding 
        const elL = document.getElementById("divIndexView");
        const elM = document.getElementById("divIndexDocSizer");
        const elR = document.getElementById("divDocView");
        let elMBox = elM.getBoundingClientRect();
        elL.style.width = (pos) + "px";                 // set width of divIndexView
        elM.style.left  = (pos) + "px";                 // set left  of divIndexDocSizer
        elR.style.left  = (pos + elMBox.width) + "px";  // set left  of divDocView
    }
}


function onTkmMouseMove(evt) {
    setInDocView(evt);                  // sets FG.kmStates.inDocView
    if (sizerStartPos) {                //check/move dragging sizerBar BEFORE checking inDocView
        const m = sizerStartPos;
        const deltaX = (evt.screenX - m.startX);
        FF.setSizerPos(m.dragBarLeft + deltaX);
        return;
    }
    
    // if NOT dragging the sizerbar
    if (!FG.kmStates.inDocView) {
        return;
    }
    setKMState({"clientX": evt.clientX, "clientY": evt.clientY});
}


function onTkmMouseUp(evt) {
    if (sizerStartPos) {                                // if was dragging the sizerbar
        const el = document.getElementById("divIndexDocSizer");
        el.style.cursor = "";

        const m = sizerStartPos;
        const deltaX = (evt.screenX - m.startX);
        LS.sliderPos = m.dragBarLeft + deltaX;          // store the posn before nulling
        sizerStartPos = null;
    } else {
        const states = {};
        if      (evt.button == 0) {  states["btnLeft"]  = false; }
        else if (evt.button == 1) {  states["btnMid"]   = false; }
        else if (evt.button == 2) {  states["btnRight"] = false; }
        setKMState(states);
    }
}


FF.moveDivRelative = function(el, deltaX, deltaY) {
    debugger; if (el) {
        const rect = FF.getRawRect(el);
        if (rect.lrMode.includes("L")) { el.style.left   = (rect.L + deltaX) + "px"; }
        if (rect.lrMode.includes("R")) { el.style.right  = (rect.R - deltaX) + "px"; }
        if (rect.tbMode.includes("T")) { el.style.top    = (rect.T + deltaY) + "px"; }
        if (rect.tbMode.includes("B")) { el.style.bottom = (rect.B - deltaY) + "px"; }
    }
}


FF.moveDivAbsolute = function(el, locX, locY) {
    debugger; if (el) {
        const rect = FF.getRawRect(el);
        if (rect.lrMode.includes("L")) { el.style.left   = locX + "px"; }
        if (rect.lrMode.includes("R")) { el.style.right  = locX + "px"; }
        if (rect.tbMode.includes("T")) { el.style.top    = locY + "px"; }
        if (rect.tbMode.includes("B")) { el.style.bottom = locY + "px"; }
    }
}


FF.sizeDivRelative = function(el, walls, deltaX, deltaY) {  // wall is n|ne|e|se|s|sw|w|nw
    debugger; if (!el) {
        return;
    }
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
    debugger; const rect = {
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


FF.getBoxAroundDcw = function(dcw) {
    debugger; if (dcw) {                                     // !!DO!! allow them to select/move the docroot! 
        let el = dcw._s_sysDiv;
        while (FF.getDchName(dcw._s_dch) != "BOX") {      // if dch != BOX, walk parentChain to find one
            try {
                dcw = dcw.__parent;
            } catch (err) {
                debugger;
            }
        }
    }
    return dcw;
}
