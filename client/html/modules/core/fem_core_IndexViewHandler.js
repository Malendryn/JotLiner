import { DFContextMenu } from "/modules/classes/DFContextMenu.js";
import { DFDialog }      from "/modules/classes/DFDialog.js";

const indexMenuEntries = [
//   action,      entryText,             tooltipText
    {action:"newDocAtSame",  label:"New document",            tip:"Insert a new document below the selected one"},
    {action:"newDocAsChild", label:"New child document",      tip:"Insert a new document as a child of the selected one"},
    {action:"",              label:"",                        tip:""},
    {action:"renameDoc",     label:"Rename document",         tip:"Rename the selected document"},
    {action:"",              label:"",                        tip:""},
    {action:"indent",        label:"> Make child of",         tip:"Make document a child of the document above it"},
    {action:"dedent",        label:"< Move to parent level",  tip:"Move document up to parent's level"},
    {action:"",              label:"",                        tip:""},
    {action:"export",        label:"Export Document",         tip:"Export document to a local file"},
    {action:"",              label:"",                        tip:""},
    {action:"delete",        label:"Delete Document",         tip:"Delete document under cursor (and all its children)"},
];
    
    
async function onCtxExport() {
    let exporter = new FG.DocExporter();
    const str = await exporter.export(FG.curDoc.rootDch);
    console.log(FF.__FILE__(), "RSTODO");
    console.log(str);
}


async function onCtxDelete() {
    const info = FF.getDocInfo(FG.curDoc.uuid);
    let yes = window.confirm("Delete document '" + info.name + "', are you sure?");
    if (yes) {
        let hasChildren = false;
        for (let idx = 0; idx < FG.docTree.length; idx++) {
            if (FG.docTree[idx].__parent == info.uuid) {
                hasChildren = true;
                break;
            }
        }
        if (hasChildren) {
            yes = window.confirm("This will delete all children of '" + info.name + "' too.\nAre you SURE?");
        }
        if (yes) {
            let pkt = WS.makePacket("DeleteDoc")
            pkt.uuid = FG.curDoc.uuid;
            pkt = await WS.sendWait(pkt)    // delete doc, wait for confirmation
            await FF.loadDocTree();         // go fetch and reconstruct index pane  (clears doc internally!)
        }
    }
}


function onIdxContextMenuAction(action) {
    FG.kmStates.modal = false;
    switch (action) {
        case "newDocAtSame":    {   openDocInfoPopup(false);    break; }
        case "newDocAsChild":   {   openDocInfoPopup(true);     break; }
        case "renameDoc":       {   openDocRenamePopup();       break; }
        case "export":          {   onCtxExport();              break; }
        case "delete":          {   onCtxDelete();              break; }
    }
}


FF.newDoc = async () => {
    await FF.waitDirty();
    await FF.clearDoc();
    
    // then create a new doc by adding a single BOX handler as the docRoot
    const dch = await FG.DCH_BASE.create("BOX", null, null);	// blowout any loaded handlers and create toplevel DOC object
    dch.__sysDiv.style.left   = "0px";	// note DO NOT use 'inset' here as we expect to read dch.__sysDiv.style.top/bottom/etc during exportDoc()
    dch.__sysDiv.style.top    = "0px";	// toplevel BOX must always have TRBL set to 0's to fill entire screen!
    dch.__sysDiv.style.right  = "0px";
    dch.__sysDiv.style.bottom = "0px";
    dch.__sysDiv.style.backgroundColor = "lightgrey";	// RSTODO make this a user-definable scheme/style
    FG.curDoc = {
        uuid:    FF.makeUUID(),
        rootDch: dch,
        dirty:   false,
    };
};
    
    
function makeNewDocForm(asChild) {
    let childTxt = (asChild) ? "child " : "";
    return `
<form>
    <b>Insert new ${childTxt}document</b><br>
    <label>Document name</label>
    <input type="text" name="docname">
</form>`;
}


function openDocRenamePopup() {
    async function _onDlgButton(btnLabel, dict) {
        if (dict) {
            if (dict.docname.length == 0) {                 // validate
                alert("Document name cannot be empty");
                return false;
            }
    
            let pkt = WS.makePacket("RenameDoc")
            pkt.dict = {
                name:       dict.docname,   // name of doc
                uuid:       FG.curDoc.uuid, // uuid of doc
            }
            pkt = await WS.sendWait(pkt)    // insert new doc, wait for confirmation
            await FF.loadDocTree();         // go fetch and reconstruct index pane
            debugger; await FF.selectAndLoadDoc(FG.curDoc.uuid, false);  // keep current doc as all we did was rename it
        }
        FG.kmStates.modal = false;
        return true;
    }

    const form = `
<form>
    <b>Rename document</b><br>
    <label>Document name</label>
    <input type="text" name="docname">
</form>`;

    const info = FF.getDocInfo(FG.curDoc.uuid);
    let dict = {
        "docname": info.name
    }

    FG.kmStates.modal = true;
    _dialog = new DFDialog({ onButton: _onDlgButton });        // new popup
    _dialog.open(form, dict);
}


function openDocInfoPopup(asChild) {
    let dict = {
        "docname": ""
    }

    async function _onDlgButton(btnLabel, dict) {
        if (dict) {
            if (dict.docname.length == 0) {                 // validate
                alert("Document name cannot be empty");
                return false;
            }

            let info;
            if (!FG.curDoc) {                   // setup info for use in pkt.dict.parent below
                info = { uuid:'', parent:'' };
            } else {
                info = FG.curDoc && FF.getDocInfo(FG.curDoc.uuid);
            }

            await FF.newDoc();                // initialize system with an empty document and new uuid

            let exporter = new FG.DocExporter();
            let pkt = WS.makePacket("NewDoc")
            pkt.dict = {
                name:       dict.docname,   // name of doc
                uuid:       FG.curDoc.uuid, // uuid of doc
                version:    FG.VERSION,     // version of doc
                after:      (asChild) ? ''        : info.uuid,      // ifChild, set after to none, else to selected
                parent:     (asChild) ? info.uuid : info.parent,    // ifChild, set parent to selected, else selecteds parent
                doc:        await exporter.export(FG.curDoc.rootDch),
            }
            pkt = await WS.sendWait(pkt)    // insert new doc, wait for confirmation
            await FF.loadDocTree();         // go fetch and reconstruct index pane
            debugger; await FF.selectAndLoadDoc(FG.curDoc.uuid, true);    // 'forget' current doc and force-load new one
        }
        FG.kmStates.modal = false;
        return true;
    }

    let form = makeNewDocForm(asChild);
    FG.kmStates.modal = true;
    _dialog = new DFDialog({ onButton: _onDlgButton });        // new popup
    _dialog.open(form, dict);
}
let _dialog;

const _indexContextMenu = new DFContextMenu();
function openIndexContextMenu() {
    let tmp = Object.assign([], indexMenuEntries);
    if (FG.curDoc == null) {
        tmp.splice(1);   // lose all but newDocAtSame
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

    for (let idx = 0; idx < FG.docTree.length; idx++) {
        let curr = FG.docTree[idx];
        let next = FG.docTree[idx + 1];

        let li = document.createElement("li");  // create '<li id="01" draggable="true">...</li>'
        ul.appendChild(li);
        curr.li = li;                           // attach it to the FG.docTree item

        li.id = curr.id.toString();
        li._docUuid = curr.uuid;                // store the docUuid on the <li>
        li.draggable = "true";

        if (next && next.depth > curr.depth) {              // if next entry is child of this one...
            let tmp = document.createElement("span");       // add <span class="arrow"></span>
            tmp.classList.add("arrow");
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
    }
}


FF.selectAndLoadDoc = async function(uuid, force=false) {   // now ALWAYS reselects (in case of server needed to reload docTree)
    let ul = document.getElementById("divIndexViewUL");
    ul.querySelectorAll("*").forEach((node) => {
        node.style.backgroundColor = bgColorRaw;             // clear bgColor of all elements in <ul>, including children
    });


    
    if (uuid.length > 0) {
        const info = FF.getDocInfo(uuid);
        if (info) {
            if (FG.curDoc && FG.curDoc.dirty) {        // if dirty, force immediate save and wait for dirtyflag to clear
                FF.autoSave(0);                 
                await FF.waitDirty();
            }
            if (await FF.loadDoc(uuid, force)) {            // but ONLY reload doc if forced...
                info.li.style.backgroundColor = bgColorSel;    //...change treeEntry background to 'selected'
            }
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
            evt.target.parentNode.classList.toggle("expanded");    // toggle the expanded state of the arrow's parent <li>
        } else {
            FF.selectAndLoadDoc(evt.target._docUuid);
        }
    }
}


async function onLeftClick(evt) {     // desel any sel,  sel current one under mouse, then load it in docView
    evt.preventDefault();
    if (!FG.kmStates.modal) {
        await FF.selectAndLoadDoc('');
    }
}


async function onContextMenu(evt) {     // desel any sel,  sel current one under mouse, then open a context menu
    evt.preventDefault();
    if (!FG.kmStates.modal) {
        const uuid = getDocTreeLIUuid(evt);
        debugger; await FF.selectAndLoadDoc(uuid);
        FG.kmStates.clientX = evt.clientX;  // update kmStates mousepos HERE cuz it now ONLY updates when over dch window
        FG.kmStates.clientY = evt.clientY;
        openIndexContextMenu();
    }
}

function onDragStart(evt) {             // RSTODO RSFIX RSBUG these are for dragging the leftpane entries up/down in the list, 
    // console.log(FF.__FILE__(), "onDragStart");
    draggedItem = evt.target;
    evt.dataTransfer.effectAllowed = 'move';
    evt.target.classList.add('dragging');
    // console.log(`ODS TF1(${evt.target.id},${draggedItem.id})`);
}

function onDragOver(evt) {
    console.log(FF.__FILE__(), "onDragOver", evt.target.id);
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
    console.log(FF.__FILE__(), "onDragOver RSTODO finish this! (update order/depth changes serverside and reload docTree");
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

    const parents = {'': []};               // start with an empty toplevel (for when absolutely no recs exist yet)
    for (let idx = 0; idx < pkt.list.length; idx++) {   // break list down into {}-by-parents
        const entry = pkt.list[idx];
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
            if (parents.hasOwnProperty(entry.uuid)) {
                ++depth;
                doParentsOf(entry.uuid);
                --depth;
            }
        }
    }
    doParentsOf('');

    FG.docTree = nuTree;

    console.log(FF.__FILE__(), "RSTODO RSQUERY is this safe? -- commented out FF.clearDoc if FG.curDoc.uuid no good");
    // if (FG.curDoc) {                                    // if we had a doc currently selected
    //     if (FF.getDocInfo(FG.curDoc.uuid) == null) {    // and it disappeared from list
    //         await FF.clearDoc();                        // nuke it!
    //     }
    // }
    showDocTree();
}


FF.loadDoc = async function(uuid, force=false) {                    // returns T/F if doc loaded. (sets curDoc.uuid and .rootDch if True)
    if (!force && FG.curDoc && FG.curDoc.uuid == uuid) {  //doc already loaded (RSTODO may need to change when we intro 'bump')
        // console.log(FF.__FILE__(), "FF.loadDoc curDoc=RETURN=true");
        return true;
    }

    let tmp = FF.getDocInfo(uuid);      // if uuid !in index, abort!  (should NEVER happen!!!)
    if (tmp == null) {
        // console.log(FF.__FILE__(), "FF.loadDoc curDoc=RETURN=false");
        return false;
    }

    let pkt = WS.makePacket("GetDoc");
    pkt.uuid = uuid;
    pkt = await WS.sendWait(pkt);

    await FF.clearDoc();                          // remove any current doc

    if (pkt.doc == null) {                  // could not load doc, therefore can't set as curDoc
        console.log(FF.__FILE__(), "FF.loadDoc curDoc=RETURN=false");
        return false;
    }

    const imp = new FG.DocImporter();

    FG.curDoc = { 
        uuid:    uuid, 
        rootDch: await imp.attach(pkt.doc, null),  // now build-and-attach doc to the system as new root doc!
        dirty:   false,
    };

    localStorage.setItem("curDBDoc:" + FG.curDBName, uuid); // set uuid as currently selected/loaded doc

    // console.log(FF.__FILE__(), "FF.loadDoc curDoc=", FG.curDoc);
    return true;
}



