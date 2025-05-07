
const indexMenuEntries = [
//   action,      entryText,             tooltipText
    ["newDocAtSame",  "New Document",            "Insert a new document below the selected one"],
    ["newDocAsChild", "New Child Document",      "Insert a new document as a child of the selected one"],
    ["indent",        "> Make child of",         "Make document a child of the document above it"],
    ["dedent",        "< Move to parent level",  "Move document up to parent's level"],
    ["",              "",                        ""],       // this will appear as a seperator line
    ["export",        "Export Document",         "Export document to a local file"],
    ["",              "",                        ""],       // this will appear as a seperator line
    ["delete",        "Delete Document",         "Delete document under cursor"],
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
            if (FG.docTree[idx].parent == info.uuid) {
                hasChildren = true;
                break;
            }
        }
        if (hasChildren) {
            let yes = window.confirm("This will delete all children of '" + info.name + "' too.\nAre you SURE?");
        }
        if (yes) {
            let pkt = WS.makePacket("DeleteDoc")
            pkt.uuid = FG.curDoc.uuid;
            pkt = await WS.sendWait(pkt)    // delete doc, wait for confirmation
            await FF.loadDocTree();         // go fetch and reconstruct index pane
            selectAndLoadDoc(FG.curDoc.uuid);
        }
    }
}


function onIdxContextMenuAction(action) {
    switch (action) {
        case "newDocAtSame":    {   openDocInfoPopup(false);    break; }
        case "newDocAsChild":   {   openDocInfoPopup(true);     break; }
        case "export":          {   onCtxExport();              break; }
        case "delete":          {   onCtxDelete();              break; }
    }
}


FF.newDoc = async () => {
    await FF.waitDirty();
    await FF.clearDoc();
    
    // then create a new doc by adding a single BOX handler as the docRoot
    const dch = await FG.DCH_BASE.create("BOX", null, null);	// blowout any loaded handlers and create toplevel DOC object
    dch._div.style.left   = "0px";	// note DO NOT use 'inset' here as we expect to read dch._div.style.top/bottom/etc during exportDoc()
    dch._div.style.top    = "0px";	// toplevel BOX must always have TRBL set to 0's to fill entire screen!
    dch._div.style.right  = "0px";
    dch._div.style.bottom = "0px";
    dch._div.style.backgroundColor = "lightgrey";	// RSTODO make this a user-definable scheme/style
    FG.curDoc = {
        uuid:    FF.makeUUID(),
        rootDch: dch,
        dirty:   false,
    };
};
    
    
function makeIViewForm(asChild) {
    let childTxt = (asChild) ? "child " : "";
    return `
    <form>
        <b>Insert new ${childTxt}document</b><br>
        <label>Document Name</label>
        <input type="text" name="docname">
    </form>
`;
}


function openDocInfoPopup(asChild) {
    let dict = {
        "docname": ""
    }

    async function onPopupClose(dict) {
        if (!dict) {        // if close was clicked
            return true;
        }
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
        const uuid = FG.curDoc.uuid;
        FG.curDoc = null;               // 'forget' current doc so selectAndLoadDoc doesn't skipover highlighting selection
        selectAndLoadDoc(uuid);
        return true;
    }

    let form = makeIViewForm(asChild);
    FF.openPopup(form, dict, onPopupClose);
}


function openIndexContextMenu() {
    let tmp = Object.assign([], indexMenuEntries);
    if (FG.curDoc == null) {
        tmp.splice(1);   // lose all but newDocAtSame
    }
    FF.openContextMenu(tmp, onIdxContextMenuAction);
}


// begin .js initialization ///////////////////////////////////////////////////////////////////////////////////////////
let div = document.getElementById("divIndexView");
const style = window.getComputedStyle(div);     // get backgrd color of divIndexView and darken it by rgb 24,24,24
let bgColor = style.backgroundColor;            // keep it in bgColor 'for later' (see selectAndLoadDoc())
bgColor = FF.parseRgba(bgColor);                // parse the "rgba(24, 36,48, 0.69)"  into {r,g,b,a}
bgColor.r = Math.max(0, bgColor.r - 24);        // now reduce each r,g,b by 24 making sure it doesn't go negative
bgColor.g = Math.max(0, bgColor.g - 24);
bgColor.b = Math.max(0, bgColor.b - 24);
bgColor = "rgb(" + bgColor.r + "," + bgColor.g + "," + bgColor.b + ")"; // finally rebuild it into "rgb(r,g,b)"


let draggedItem       = null;                             // ptr to <li> currently being dragged (or null if not)
let placeholder       = document.createElement('div');    // create the thin-black-line that shows where a dragDrop will go on dragEnd
placeholder.className = 'placeholder';

div.addEventListener('click',       onLeftClick);      // add left,right click listeners on entire divIndexView
div.addEventListener("contextmenu", onContextMenu);


async function showDocTree() { // build <UL> to display in left index pane
    let div = document.getElementById("divIndexView");
    div.innerHTML = "";     // wipe contents.  (there are no added event listeners to remove so this is safe)
    let ul = document.createElement("ul");
    ul.id = "divIndexViewUL";
    div.appendChild(ul);
 // build and insert <li> elements inside the <ul>
 //   <!--                     indent spacer                  arrow-if-children                  text to display -->
 //   <li id="01" draggable="true"><div style="width: 0px;"></div><div style="width:16px;">&gt;</div>Section 1</li>
 
    for (let idx = 0; idx < FG.docTree.length; idx++) {
        let curr = FG.docTree[idx];
        let next = FG.docTree[idx + 1];
        let showArrow = false;
        if (next) {
            if (next.depth > curr.depth) {               // step-in one
                showArrow = true;
            }
        }
        let li = document.createElement("li");  // create '<li id="01" draggable="true">...</li>'
        ul.appendChild(li);
        curr.li = li;                           // attach it to the FG.docTree item

        li.addEventListener('dragstart',   onDragStart);  // RSTODO improve on this, use the single document level listener instead
        li.addEventListener('dragover',    onDragOver);
        // li.addEventListener('drop',        onDrop);
        li.addEventListener('dragend',     onDragEnd);
        // li.addEventListener('click',       onLeftClick);
        // li.addEventListener('contextmenu', onRightClick);

        li.id = curr.id.toString();
        li._docUuid = curr.uuid;                // store the docUuid on the <li>
        li.draggable = "true";
        let tmp = document.createElement("div");    // append '<div style="width: 0px;"></div>'
        tmp.style.width = (curr.depth * 16) + "px";
        li.appendChild(tmp);
        tmp = document.createElement("div");    // append '<div style="width:16px;">&gt;</div>'
        tmp.style.width="16px";
        if (showArrow) {
            tmp.innerHTML = "&gt;";
        }
        li.appendChild(tmp);
        tmp = document.createElement("div");    // append 'Document Name'
        tmp.innerHTML = curr.name;
        li.appendChild(tmp);
    }
}


async function selectAndLoadDoc(uuid) {
    if (FG.curDoc) {
        if (FG.curDoc.uuid == uuid) {   // clicked on same entry, ignore
            return;
        }
        const info = FF.getDocInfo(FG.curDoc.uuid);
        info.li.style.backgroundColor = "";     // clear bgColor of prior selected element
    }

    if (uuid) {
        const info = FF.getDocInfo(uuid);
        if (info) {
            if (FG.curDoc && FG.curDoc.dirty) {        // if dirty, force immediate save and wait for dirtyflag to clear
                FF.autoSave(0);                 
                await FF.waitDirty();
            }
            if (await getDoc(uuid)) {                       // if doc loaded...
                info.li.style.backgroundColor = bgColor;    //...change treeEntry background to bgColor
            }
        }
    } else {
        FF.clearDoc();
    }
}


export async function initialize() {    // called from index.js
    await FF.loadDocTree();             // load-and-show docTree

    let pkt = WS.makePacket("GetExtra");   
    pkt.txt = "curDocUuid";
    pkt = await WS.sendWait(pkt);       // fetch the prior docUuid

    selectAndLoadDoc(pkt.txt);          // load, hilight, and display doc by uuid
}


function getDocTreeLIUuid(evt) {
    let target = evt.target;
    while (target && target.nodeName != "LI") { // we clicked on text inside <li> so walk parents to find <li>
        target = target.parentNode;
    }
    if (target) {
        return target._docUuid;
    }
    return null;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// start mouse/kdb ops ////////////////////////////////////////////////////////////////////////////////////////////////
async function onLeftClick(evt) {     // desel any sel,  sel current one under mouse, then load it in docView
    evt.preventDefault();
    if (!FG.kmStates.modal) {
        const uuid = getDocTreeLIUuid(evt);
        await selectAndLoadDoc(uuid);
    }
}

async function onContextMenu(evt) {     // desel any sel,  sel current one under mouse, then open a context menu
    evt.preventDefault();
    if (!FG.kmStates.modal) {
        const uuid = getDocTreeLIUuid(evt);
        await selectAndLoadDoc(uuid);
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
    // console.log(FF.__FILE__(), "onDragOver");
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'move';

    let tf1 = (evt.target.nodeName === 'LI' && evt.target.id !== draggedItem.id);
    let tf2 = (evt.target.nodeName === 'LI' && evt.target !== draggedItem);
    let list = document.getElementById("divIndexViewUL");

    // console.log(`ODO TF1(${evt.target.id},`,evt.target,`)=${tf1}, " TF2(${draggedItem.id},`,draggedItem,`)=${tf2}`);
    if (evt.target.nodeName === 'LI' && evt.target !== draggedItem) {
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

function onDragEnd(evt) {
    console.log(FF.__FILE__(), "onDragOver RSTODO finish this! (update order/depth changes serverside and reload docTree");
    evt.preventDefault();

    let list = document.getElementById("divIndexViewUL");

    let target = placeholder.nextElementSibling;
    if (target) {                               // if dropTarget not past last <li>
        list.insertBefore(draggedItem, target);
    } else {
        list.appendChild(draggedItem);
    }

    evt.target.classList.remove('dragging');
    draggedItem = null;
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
}
// end mouse/kbd ops //////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// start WS chain /////////////////////////////////////////////////////////////////////////////////////////////////////
FF.loadDocTree = async function() {         // sets off the following chain of WS db calls...
    let pkt = WS.makePacket("GetDocTree")
    pkt = await WS.sendWait(pkt);           // SELECT * from docTree order by parent,listOrder

    const parents = {};
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

    if (FG.curDoc) {                                    // if we had a doc currently selected
        if (FF.getDocInfo(FG.curDoc.uuid) == null) {    // and it disappeared from list
            FF.clearDoc();                              // nuke it!
        }
    }
    showDocTree();
}


async function getDoc(uuid) {   // returns T/F if doc loaded. (sets curDoc.uuid and .rootDch if True)
    if (FG.curDoc && FG.curDoc.uuid == uuid) {  //doc already loaded (RSTODO may need to change when we intro 'bump')
        return true;
    }

    let tmp = FF.getDocInfo(uuid);      // if uuid !in index, abort!  (should NEVER happen!!!)
    if (tmp == null) {
        return false;
    }

    let pkt = WS.makePacket("GetDoc");
    pkt.uuid = uuid;
    pkt = await WS.sendWait(pkt);

    if (pkt.doc == null) {                  // could not load doc, therefore can't set as curDoc
        return false;
    }

    FF.clearDoc();                          // remove any current doc

    const imp = new FG.DocImporter();

    FG.curDoc = { 
        uuid:    uuid, 
        rootDch: await imp.attach(pkt.doc, null),  // now build-and-attach doc to the system as new root doc!
        dirty:   false,
    };
    return true;

    // RSTEST to destroy it to make sure it completely did, then reattach it again
    // debugger; await FG.curDoc.rootDch.destroy();
    // debugger; await imp.attach(pkt.doc, null);  // now attach it to the system as new root doc!
    // RSTEST end

    // RSTEST to export it and display it on console
    // exp = new FG.DocExporter();    //RSNOTE DOES NOT detach! ONLY exports!!!!
    // let str = await exp.export(FG.curDoc.rootDch);
    // console.log(str);
    // RSTEST end
}
// end WS chain ///////////////////////////////////////////////////////////////////////////////////////////////////////



