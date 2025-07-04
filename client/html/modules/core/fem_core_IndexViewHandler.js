import { DFContextMenu } from "/public/classes/DFContextMenu.js";
import { DFDialog }      from "/public/classes/DFDialog.js";

import { DCW_BASE } from "/modules/core/fem_core_DCW_BASE.js";

import { DFListenerTracker } from "/public/classes/DFListenerTracker.js";

import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";
import { DFDict } from "/public/classes/DFDict.mjs";

let _dlgTmp;    // used to exfer exploded file to _onCtxImport2_onDlgButton()  {?name?,{dchList:},error}
async function _onCtxImport2_onDlgButton(btnLabel, formData) {  // import file: btn pressed in 2nd dialog (child/sibling and rename)
    debugger; let result = true;
    const newDocInfo = {};
    if (formData.isSubmit) {
        if (formData.docName.length == 0) {
            alert("Document name cannot be empty");
            return false;
        }
        if (!_dlgTmp.insertAtEnd && !formData.placement) {
            alert("Please choose whether to import as child or as beneath.");
            return false;
        }

        newDocInfo.docName = formData.docName;

        let encoder = new DFEncoder();
        let tmp = {
            dchList: _dlgTmp.dchList,
        };
        _dlgTmp = undefined;             // clear this from memory now!
        newDocInfo.doc = encoder.encode(tmp);  // encodes only the {dchlist:[]}, no uuid,name,version

        newDocInfo.asChild = (formData.placement == "child");     // based on the radiobutton
        debugger; result = await insertDoc(newDocInfo);   // result=true=done+closeDialog false=error occurred
        if (!result) {
            alert("Something went wrong with import...!");  // RSTODO should NEVER!!! but still we need better error management
        }
    }
    FG.kmStates.modal = false;
    _dlgTmp = undefined;            // clear this from memory here AND above (above=so its not around during the whole insertDoc() op)
    return true;
}
function _makeCtxImport2_form(name) {
    let form = `<form><p><h2>Import document from file</h2></p>`;
    if (name) {
form += `
    <p><h3>Choose where to import document</h3></p>
    <div id="radioGroup">
        <label>
            <input type="radio" name="placement" value="child">
            As child of <b>${name}</b>
        </label>
        <br>
        <label>
            <input type="radio" name="placement" value="sibling">
            Beneath <b>${name}</b>
        </label>
    </div>
    <br>`;
    }
form += `
    <label>Named:</label>&nbsp;<input type="text" name="docName">
    <br><br><br>
</form>`;
    return form;
}


async function onCtxImport2(file) {     // user has selected file, now exlode it and asChild/asSibling and what to name it
    let docName = file.name;
    if (!docName.endsWith(".jldoc")) {
        alert("Filename must end with .jldoc");     // we only enforce it so we can chop it off with impunity
        return false;
    }
    docName = docName.substring(0, docName.length - 6);

    const abuf = await file.arrayBuffer();
    const u8a = new Uint8Array(abuf);

    _dlgTmp = await FF.upgradeDoc(u8a);     // upgrade from file, (dont yet know version so can't pass it in)

    const formFields = {
        "docName": docName
    }

    let name = "";
    if (FG.curDoc) {
        const info = FF.getDocInfo(FG.curDoc.uuid); // get info about current doc to insert this one as child of or beneath
        name = info.name;
    }
    if (!name) {
        _dlgTmp.insertAtEnd = true;
    }

    FG.kmStates.modal = true;
    let dlg = new DFDialog({ onButton: _onCtxImport2_onDlgButton });
    dlg.open({form:_makeCtxImport2_form(name), fields:formFields, buttons: {"Cancel": false, "Import": true}});
}
async function onCtxImport() {
    let dlg;
    const tracker = new DFListenerTracker();
    async function onDlgButton(btnLabel, dict) {        // only button option here is "Cancel"
        tracker.removeAll();
        FG.kmStates.modal = false;
        return true;
    }

    function handleFiles(files) {
        tracker.removeAll();
        FG.kmStates.modal = false;
        dlg.close();
        if (files.length == 1) {
            onCtxImport2(files[0]);
        }
    }
    async function preRun(frm)  {
        const drop = document.getElementById("__dlgDrop")
        const file = document.getElementById("__dlgFile");
        tracker.add(drop, 'click', () => {         // click --> open file dlg and go!
            file.click();
        });

        tracker.add(file, 'change', (evt) => {     // (from file dlg) change --> file input selection
            handleFiles(evt.target.files);
        });
    
        tracker.add(drop, 'dragover', (evt) => {   // dragover/leave visual feedback
            evt.preventDefault();
            drop.classList.add('hover');
        });
        tracker.add(drop, 'dragleave', () => {
            drop.classList.remove('hover');
        });
        tracker.add(drop, 'drop', (evt) => {        // drop --> get filepath and go!
            evt.preventDefault();
            drop.classList.remove('hover');
            handleFiles(evt.dataTransfer.files);
        });
    }

    
    const style = `
<style>
    #__dlgDrop {
        border: 2px dashed #888;
        padding: 40px;
        text-align: center;
        color: #555;
        font-family: sans-serif;
        cursor: pointer;
        margin-bottom: 20px;
    }
    #__dlgDrop.hover {
        border-color: #0b79d0;
        background-color: #f0faff;
    }
  </style>
`
    const form = `
<form>
    <div id="__dlgDrop">
    Drag & Drop files here or click to browse
    <input type="file" id="__dlgFile" style="display:none;">
</div></form>`;

    FG.kmStates.modal = true;
    dlg = new DFDialog({ preRun:preRun, onButton: onDlgButton });
    dlg.open({form:form, styles:[style], buttons: {"Cancel": true}});
}


async function _onCtxExport_onDlgButton(btnLabel, dict) {
    let url;
    let countdown = 63;  // ~1 full second at 16ms/frame
    function flushExport() {
        if (countdown > 0) {
            countdown--;
            requestAnimationFrame(flushExport);
        } else {
            URL.revokeObjectURL(url);
        }
    }

    if (dict.isSubmit) {
        let mod = await FF.loadModule("./modules/core/fem_core_DocStreamer.js");
        let streamer = new mod.DocStreamer();
        const u8a = await streamer.export();      // wraps a stream with data from FF.curDoc into a Uint8Array
    
        const blob = new Blob([u8a], { type: "application/octet-stream" });
        url = URL.createObjectURL(blob);

        let tmp = document.createElement("a");
        tmp.href = url;
        tmp.download = dict.fileName;
        tmp.style.display = "none";
        document.body.appendChild(tmp);
        tmp.click();
        document.body.removeChild(tmp);
        requestAnimationFrame(flushExport);
        FG.kmStates.modal = false;
        return true;
    }
    return false;
}
async function onCtxExport() {
    const info = FF.getDocInfo(FG.curDoc.uuid);
    const form = `
<form>
    <b>Export document:</b> ${info.name}<br>
    <label>Save as: </label>
    <input type="text" name="fileName">
</form>`;
    FG.kmStates.modal = true;
    _dialog = new DFDialog({ onButton: _onCtxExport_onDlgButton });
    _dialog.open({form:form, fields:{"fileName":info.name + ".jldoc"}});
}


async function onCtxDelete() {
    const info = FF.getDocInfo(FG.curDoc.uuid);
    let yes = window.confirm("Delete document '" + info.name + "', are you sure?");
    if (yes) {
        let hasChildren = false;
        for (let idx = 0; idx < FG.docTree.length; idx++) {
            if (FG.docTree[idx].parent == info.id) {
                hasChildren = true;
                break;
            }
        }
        if (hasChildren) {
            yes = window.confirm("This will delete all children of '" + info.name + "' too.\nAre you SURE?");
        }
        if (yes) {
            FF.autoSave("DelDoc", FG.curDoc.uuid, 0);
        }
    }
}


function onIdxContextMenuAction(action) {
    FG.kmStates.modal = false;
    switch (action) {
        case "newDocAtSame":    {   openNewDocDialog(false);    break; }
        case "newDocAsChild":   {   openNewDocDialog(true);     break; }
        case "renameDoc":       {   openDocRenamePopup();       break; }
        case "import":          {   onCtxImport();              break; }
        case "export":          {   onCtxExport();              break; }
        case "delete":          {   onCtxDelete();              break; }
    }
}


function makeNewDocForm(asChild) {
    let childTxt = (asChild) ? "child " : "";
    return `
<form>
    <b>Insert new ${childTxt}document</b><br>
    <label>Document name</label>
    <input type="text" name="docName">
</form>`;
}


function openDocRenamePopup() {
    async function onDlgButton(btnLabel, dict) {
        if (dict.isSubmit) {
            if (dict.docName.length == 0) {
                alert("Document name cannot be empty");
                return false;
            }
            await FF.autoSave("ModDoc", {name:dict.docName}, 0);
        }
        FG.kmStates.modal = false;
        return true;
    }

    const form = `
<form>
    <b>Rename document</b><br>
    <label>Document name</label>
    <input type="text" name="docName">
</form>`;

    const info = FF.getDocInfo(FG.curDoc.uuid);
    let dict = {
        "docName": info.name
    }

    FG.kmStates.modal = true;
    _dialog = new DFDialog({ onButton: onDlgButton });
    _dialog.open({form:form, fields:dict});
}

// insert a new doc AND select/open it
// dict={docName, ?doc(u8a) if import, else null if new, asChild};
// returns true=success, false=fail
async function insertDoc(dict) {
    let info;
    if (FG.curDoc) {                    // if doc selected we need its id and parent
        info = FF.getDocInfo(FG.curDoc.uuid);
    } else {
        info = { id:0, parent:0 };      // else insert at very END (at server, 0 matches no id so goes at end)
    }

    const parent = (dict.asChild) ? info.id : info.parent;  // ifChild, set parent to selected, else selecteds parent
    const after  = (dict.asChild) ? 0       : info.id;      // ifChild, set after to 0, else to selected

    await FF.autoSave("AddDoc", {name: dict.docName, parent:parent, after:after }, 0);
    return true;
}


function openNewDocDialog(asChild) {
    let dict = {
        "docName": ""
    }

    async function onDlgButton(btnLabel, dict) {    // on btnPress when inserting new document
        if (dict.isSubmit) {
            if (dict.docName.length == 0) {
                alert("Document name cannot be empty");
                return false;
            }
            dict.asChild = asChild;              // taken from funcParam(asChild)

            await insertDoc(dict);
        }
        FG.kmStates.modal = false;
        return true;
    }

    let form = makeNewDocForm(asChild);
    FG.kmStates.modal = true;
    _dialog = new DFDialog({ onButton: onDlgButton });        // new popup
    _dialog.open({form:form, fields:dict});
}
let _dialog;

const _indexContextMenu = new DFContextMenu();


function openIndexContextMenu(uuid) {
    let tmp = [];
        tmp.push(    {action:"newDocAtSame",  label:"New document",            tip:"Insert a new document below the selected one"        });
        if (uuid) {
            tmp.push({action:"newDocAsChild", label:"New child document",      tip:"Insert a new document as a child of the selected one"});
            tmp.push({action:"",              label:"",                        tip:""                                                    });
            tmp.push({action:"renameDoc",     label:"Rename document",         tip:"Rename the selected document"                        });
            tmp.push({action:"",              label:"",                        tip:""                                                    });
            tmp.push({action:"indent",        label:"> Make child of",         tip:"Make document a child of the document above it"      });
            tmp.push({action:"dedent",        label:"< Move to parent level",  tip:"Move document up to parent's level"                  });
        }
        tmp.push(    {action:"",              label:"",                        tip:""                                                    });
        tmp.push(    {action:"import",        label:"Import Document",         tip:"Import document from local file"                     });
        if (FG.curDoc) {
            tmp.push({action:"export",        label:"Export Document",         tip:"Export document to a local file"                     });
            tmp.push({action:"",              label:"",                        tip:""                                                    });
            tmp.push({action:"delete",        label:"Delete Document",         tip:"Delete selected document (and all its children)"     });
        }

    FG.kmStates.modal = true;
    _indexContextMenu.open(tmp, onIdxContextMenuAction, FG.kmStates.clientX, FG.kmStates.clientY);
}


// begin .js initialization ///////////////////////////////////////////////////////////////////////////////////////////
let div = document.getElementById("divIndexView");
const style = window.getComputedStyle(div);     // get backgrd color of divIndexView and darken it by rgb 24,24,24
let bgColorSel, bgColorRaw = style.backgroundColor;   // keep it 'for later' (see FF.selectAndLoadDoc())
bgColorSel = FF.parseRgba(bgColorRaw);                // parse the "rgba(24, 36,48, 0.69)"  into {r,g,b,a}
bgColorSel.r = Math.max(0, bgColorSel.r - 24);        // now reduce each r,g,b by 24 making sure it doesn't go negative
bgColorSel.g = Math.max(0, bgColorSel.g - 24);
bgColorSel.b = Math.max(0, bgColorSel.b - 24);
bgColorSel = "rgb(" + bgColorSel.r + "," + bgColorSel.g + "," + bgColorSel.b + ")"; // finally rebuild it into "rgb(r,g,b)"


let draggedItem       = null;                             // ptr to <li> currently being dragged (or null if not)
let placeholder       = document.createElement('div');    // create the thin-black-line that shows where a dragDrop will go on dragEnd
placeholder.className = 'placeholder';

div.addEventListener('click',       onLeftClick);      // testfor clickOn deadspace (no <UL> els) and desel curDoc
div.addEventListener("contextmenu", onContextMenu);

let ul = document.createElement("ul");                 // create the topmost <ul> for the index view & attach all listeners
ul.id = "divIndexViewUL";
ul.addEventListener('dragstart',   onDragStart);
ul.addEventListener('dragover',    onDragOver);
ul.addEventListener('dragend',     onDragEnd);
ul.addEventListener('click',       onClickULItem);
div.appendChild(ul);
// end .js initialization ///////////////////////////////////////////////////////////////////////////////////////////


async function showDocTree() { // build <UL> to display in left index pane
    let ul = document.getElementById("divIndexViewUL");
    ul.innerHTML = "";                                      // blow out any prior menus

    let opened = LS.openIndexes;

    let nuOpened = [];
    for (let idx = 0; idx < FG.docTree.length; idx++) {
        let curr = FG.docTree[idx];
        let next = FG.docTree[idx + 1];

        let li = document.createElement("li");  // create '<li id="01" draggable="true">...</li>'
        ul.appendChild(li);
        curr.li = li;                           // attach it to the FG.docTree item

        li._docTreeId = curr.id;
        li._docUuid   = curr.uuid;                // store the docUuid on the <li>
        li.draggable  = "true";

        if (next && next.depth > curr.depth) {              // if next entry is child of this one...
            let tmp = document.createElement("span");       // add <span class="arrow"></span>
            tmp.classList.add("arrow");
            if (opened.includes(curr.id)) {
                li.classList.add("expanded");              // set this arrow to 'expanded' state
                nuOpened.push(curr.id);
            }
            li.appendChild(tmp);
            li.append(curr.name);                           // add the doc name BEFORE the new <ul>
            ul = document.createElement("ul");              // create a new ul and use it as parent for future <li>s 
            li.appendChild(ul);
        } else {
            li.append(curr.name);                           // add the doc name WITHOUT a new <ul>
        }

        if (next) {             // if next entry depth is less than curr depth (is a 'step out' entry)
            for (let idx = 0; idx < curr.depth - next.depth; idx++) {  // (could be multiple stepouts)
                ul = ul.parentNode.parentNode;      // stepout to parent <li> then to it's parent <ul>
            }
        }
    } // end for
    LS.openIndexes = nuOpened;
}


FF.selectAndLoadDoc = async function(uuid, force=false) {   // now ALWAYS reselects (in case of server needed to reload docTree)
    let ul = document.getElementById("divIndexViewUL");
    ul.querySelectorAll("*").forEach((node) => {
        node.style.backgroundColor = bgColorRaw;             // clear bgColor of all elements in <ul>, including children
    });

    if (uuid.length > 0) {
        const info = FF.getDocInfo(uuid);
        if (info) {
            if (FG.curDoc) {
                await FF.flushAll();                     // process any pending autoSave's immediately
            }
            FF.loadDoc(uuid, force);      /*NO await!*/  //  reload doc if needed or forced...
            let node = info.li;
            while (node.parentElement) {                // make sure all <LI> above curSel are expanded!
                node = node.parentElement;
                if (node.id == "divIndexViewUL") {      // if reached the top of the docTree
                    break;
                }
                if (node.tagName === "LI") {            // expand all parent<li> of selected uuid (needed by "AddDoc"->"ModDocTree")
                    node.classList.add("expanded");
                }
            }
            info.li.style.backgroundColor = bgColorSel;      //...mark treeEntry as 'selected'
        }
    } else {
        await FF.clearDoc();
    }
}


function getDocTreeLIUuid(evt) {    // return uuid of selected doc, or ''
    let target = evt.target;
    while (target && target.nodeName != "LI") { // we clicked on text inside <li> so walk parents to find <li>
        target = target.parentNode;
    }
    if (target) {
        return target._docUuid;
    }
    return '';
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// start mouse/kdb ops ////////////////////////////////////////////////////////////////////////////////////////////////
function onClickULItem(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    if (!FG.kmStates.modal) {
        if (evt.target.classList.contains("arrow")) {
            const etp = evt.target.parentNode;
            etp.classList.toggle("expanded");         // toggle the expanded state of the arrow's parent <li>
            FF.setIdxpanded(etp._docTreeId, etp.classList.contains("expanded"));
        } else {
            FF.selectAndLoadDoc(evt.target._docUuid);
        }
    }
}


async function onLeftClick(evt) {     // desel any sel,  sel current one under mouse, then load it in docView
    evt.preventDefault();
    if (!FG.kmStates.modal) {
        LS.curDoc = "";
        await FF.selectAndLoadDoc(LS.curDoc);
    }
}


async function onContextMenu(evt) {     // desel any sel,  sel current one under mouse, then open a context menu
    evt.preventDefault();
    if (!FG.kmStates.modal) {
        const uuid = getDocTreeLIUuid(evt);
        await FF.selectAndLoadDoc(uuid);
        FG.kmStates.clientX = evt.clientX;  // update kmStates mousepos HERE cuz it now ONLY updates when over dch window
        FG.kmStates.clientY = evt.clientY;
        openIndexContextMenu(uuid);
    }
}

function onDragStart(evt) {             // RSTODO RSFIX RSBUG these are for dragging the leftpane entries up/down in the list, 
    // console.log(__FILE__(), "onDragStart");
    draggedItem = evt.target;
    evt.dataTransfer.effectAllowed = 'move';
    evt.target.classList.add('dragging');
    // console.log(`ODS TF1(${evt.target.id},${draggedItem.id})`);
}

function onDragOver(evt) {
    console.log(__FILE__(), "onDragOver", evt.target.id);
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'move';

    let tf1 = (evt.target.nodeName === 'LI' && evt.target.id !== draggedItem.id);
    let tf2 = (evt.target.nodeName === 'LI' && evt.target !== draggedItem);


    // console.log(`ODO TF1(${evt.target.id},`,evt.target,`)=${tf1}, " TF2(${draggedItem.id},`,draggedItem,`)=${tf2}`);
    if (evt.target.nodeName === 'LI' && evt.target !== draggedItem) {
        // let list = document.getElementById("divIndexViewUL");
        let list = evt.target.parentNode;

        const bounding = evt.target.getBoundingClientRect();
        const offset = evt.clientY - bounding.top;

        // createPlaceholder();

        if (offset > bounding.height / 2) {
            list.insertBefore(placeholder, evt.target.nextSibling);
        } else {
            list.insertBefore(placeholder, evt.target);
        }
    }
}

// function onDrop(evt) {
// }

function onDragEnd(evt) {   // this is firing twice, donno why, but at least testing for !draggedItem prevents errors
    console.log(__FILE__(), "onDragOver RSTODO finish this! (update order/depth changes serverside and reload docTree");
    evt.preventDefault();
    evt.stopPropagation();              // prevent dragend on parent <ul>'s from firing
    let list = evt.target.parentNode;
    let prev = placeholder.previousElementSibling;
    let next = placeholder.nextElementSibling;
    
    const ul = placeholder.closest("ul");   // get the parent ul of 'wherever we are'
    if (placeholder.previousElementSibling) {
        ul.insertBefore(draggedItem, placeholder);
    } else {
        ul.insertBefore(draggedItem, placeholder.nextSibling);
    }

    evt.target.classList.remove('dragging');
    draggedItem = null;
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
}
// end mouse/kbd ops //////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
FF.loadDocTree = async function() {         // sets off the following chain of WS db calls...
    let pkt = WS.makePacket("GetDocTree")
    pkt = await WS.sendWait(pkt);           // SELECT * from docTree order by parent,listOrder
    let list;
    if (pkt.constructor.name == "Fault") {  // no db open, no doctree available
        list = [];
    } else {
        list = pkt.list;
    }

// convert recs into a parenTree of {parentId:[recsWithThatParentId]}
    const parents = {0: []};                // start with an empty toplevel (for when absolutely no recs exist yet)
    for (let idx = 0; idx < list.length; idx++) {   // break list down into {}-by-parents
        const entry = list[idx];
        if (!parents.hasOwnProperty(entry.parent)) {
            parents[entry.parent] = [];
        }
        parents[entry.parent].push(entry);
    }

    let nuTree = [];
    let depth = 0;
    function doParentsOf(which) {               // find all items whos parents are 'which' and all their children too
        const list = parents[which];
        while (list.length) {
            const entry = list.splice(0, 1)[0]; // remove-and-return first element from list
            entry.depth = depth;                // to make showing the list easier (see showDocTree)
            nuTree.push(entry);
            if (parents.hasOwnProperty(entry.id)) {
                ++depth;
                doParentsOf(entry.id);
                --depth;
            }
        }
    }
    doParentsOf('0');

    FG.docTree = nuTree;

    if (FG.curDoc) {                                    // if we had a doc currently selected
        if (FF.getDocInfo(FG.curDoc.uuid) == null) {    // and it disappeared from list
            await FF.clearDoc();                        // nuke it!
            LS.curDoc = "";
        }
    }
    showDocTree();
}


FF.loadDoc = async function(uuid, force=false) {          // returns T/F if doc loaded. (sets curDoc.uuid and .rootDcw if True)
    if (!force && FG.curDoc && FG.curDoc.uuid == uuid) {  //doc already loaded
        // console.log(__FILE__(), "FF.loadDoc curDoc=RETURN=true");
        return true;
    }

    await FF.clearDoc();            // remove any current doc & disable divDocView background

    const el = document.getElementById("divDocView");
    el.innerHTML = "Loading...";

    let pkt = WS.makePacket("GetDoc");
    pkt.uuid = uuid;
    pkt = WS.sendExpect(pkt, onPktGetDoc, pkt.uuid);

    return true;
}
async function onPktGetDoc(pkt, uuid) {         // response from a sendExpect()
    // we have changed loaded doc's and cleared any on screen,  then went to sleep waiting for this packet with the newly selected doc info

    await FF.clearDoc();                                // there SHOULD NOT BE a doc loaded!  but just in case...
    const el = document.getElementById("divDocView");   // immediately un-reset/un-disable the background in prep for docloading
    el.classList.remove("disabled");
    el.innerHTML = "";

    FG.curDoc = { 
        uuid:      pkt.uuid,
        name:      pkt.name,
        rootDcw:   null,
        bump:      pkt.bump,
    };

    LS.curDoc = uuid;

    pkt = WS.makePacket("ModDoc", {uuid:pkt.uuid, dcwFlatTree:pkt.dcwFlatTree, bump:pkt.bump});  // INJECT faux packet
    await pkt.onPktRecvd();     // INJECT: make it act like it received this as a ModDoc (instead of using DocAttacher.attach())

    // const attacher = new FG.DocAttacher();
    // // const meta = JSON.parse(pkt.data.meta);
    // const dcwFlatTree = JSON.parse(pkt.rec.dcwFlatTree);
    // const rootDcw = await attacher.attach(dcwFlatTree, null, false);    // this doc has no parent(null) so will become our new rootDcw

    // FG.curDoc = { 
    //     uuid:      uuid,
    //     name:      pkt.rec.name,
    //     rootDcw:   rootDcw,
    //     bump:      pkt.rec.bump,
    // };

    // LS.curDoc = uuid;
}


FF.upgradeDoc = async function(u8aDoc, version=null) {    // take binary stream and optional version and returns {uuid,?name?,{dchList:},error}
// we HAVE to pull this here-and-now (IF stream has it!) in order to know what 'explode_n.n_doc.js' to load
//     and if it doesn't have it, then the passed-in dict.version must be present.
    let dict = { doc:u8aDoc };
    if (u8aDoc[0] == 64) {    // 64 = '@'     // test for header,  if found extract what we know how to.
        let tmp = "";
        for (let idx = 1; idx < 32; idx++) {           // try to extract the @n.n; version from the doc
            const chr = String.fromCharCode(u8aDoc[idx]);
            if (chr == ';') {                          // if we havent hit a ';' by 32 bytes, we don't have a ver!
                ++idx;
                break;
            }
            if (!/^[0-9.]$/.test(chr)) {     // if not digits or '.', this is not a ver!
                tmp = "";                    // clear out anything gathered thus far
                break;
            }
            tmp += chr;
        }
        dict.version = tmp; // change to what the doc says, always, so we can upgrade it below
    }

    if (!dict.version) {    // no '@n.n;' at start of file, no version passed in from dbRec
        dict.error = "Unable to parse, stream has no header and no version was supplied";
        return dict;
    }

    const fname = `explode_${dict.version}_doc.js`;
    const mod = await FF.loadModule("/modules/converters/" + fname);
    dict = await mod.explode(dict);
    if (dict.error) {
        dict.error = `Error Upgrading document from v${version}: ${dict.error}`;
    }
    return dict;
}
        