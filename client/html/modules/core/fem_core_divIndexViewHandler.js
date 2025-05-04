

// RSTODO OBSOLETE RSDELETE just here for show!  SAMPLE RSTODO REMOVE this and add a real handler
// let tmp = document.getElementById("divIndexView");
// tmp.innerHTML = `
// <ul id="divIndexViewUL">
// <!--                     indent spacer                  arrow-if-children                  text to display -->
//     <li id="01" draggable="true"><div style="width: 0px;"></div><div style="width:16px;">&gt;</div>Section 1</li>
//     <li id="02" draggable="true"><div style="width:16px;"></div><div style="width:16px;">    </div>Subsection 1.1</li>
//     <li id="03" draggable="true"><div style="width:16px;"></div><div style="width:16px;">    </div>Subsection 1.2</li>
//     <li id="04" draggable="true"><div style="width:16px;"></div><div style="width:16px;">&gt;</div>Subsection 1.3</li>
//     <li id="05" draggable="true"><div style="width:32px;"></div><div style="width:16px;">    </div>Sub-subsection 1.3.1</li>
//     <li id="06" draggable="true"><div style="width:32px;"></div><div style="width:16px;">    </div>Sub-subsection 1.3.2</li>
//     <li id="07" draggable="true"><div style="width:32px;"></div><div style="width:16px;">&gt;</div>Sub-subsection 1.3.2</li>
//     <li id="08" draggable="true"><div style="width:48px;"></div><div style="width:16px;">    </div>Subsection 1.3.2.1</li>
//     <li id="09" draggable="true"><div class="entry"><div style="width:48px;"></div><div style="width:16px;">    </div>Subsection 1.3.2.2</div></li>
// </ul>
// `;
// end OBSOLETE


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
    
    
    
function onIdxContextMenuAction(action) {
    switch (action) {
        case "newDocAtSame":    {  openDocInfoPopup(false);   break;  }
        case "newDocAsChild":   {  openDocInfoPopup(true);    break;  }
    }
}


FF.newDoc = async () => {
    await FF.clearDoc();
    
    // then create a new doc by adding a single BOX handler as the docRoot
    const dch = await FG.DCH_BASE.create("BOX", null, null);	// blowout any loaded handlers and create toplevel DOC object
    dch._div.style.left   = "0px";	// note DO NOT use 'inset' here as we expect to read dch._div.style.top/bottom/etc during exportDoc()
    dch._div.style.top    = "0px";	// toplevel BOX must always have TRBL set to 0's to fill entire screen!
    dch._div.style.right  = "0px";
    dch._div.style.bottom = "0px";
    dch._div.style.backgroundColor = "lightgrey";	// RSTODO make this a user-definable scheme/style
    FG.curDoc = {
        uuid: FF.makeUUID(),
        rootDch: dch,
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

        let info = FF.getDocInfo(FG.curDoc.uuid);   // get currently selected Doc info for use in pkt.dict.parent below

        await FF.newDoc();                // initialize system with an empty document and new uuid

        let exporter = new FG.DocExporter();
        let pkt = WS.makePacket("NewDoc")
        pkt.dict = {
            name:       dict.docname,   // name of doc
            uuid:       FG.curDoc.uuid, // uuid of doc
            version:    FG.VERSION,     // version of doc
            listOrder:  0,              // zerobased listorder at current depth
            parent:     (asChild) ? info.uuid : info.parent,    // set parent to selected, else selecteds parent
            doc:        await exporter.export(FG.curDoc.rootDch),
        }
        pkt = await WS.sendWait(pkt)    // insert new doc, wait for confirmation
        await FG.loadDocTree();         // go fetch and reconstruct index pane
        selectAndLoadDoc(FG.curDoc.uuid);
        return true;
    }

    let form = makeIViewForm(asChild);
    FG.openPopup(240, 40, 400, 200, form, dict, onPopupClose);
}


function openIndexContextMenu() {
    let tmp = Object.assign([], indexMenuEntries);
    if (FG.curDoc == null) {
        tmp.splice(1);   // lose all but newDocAtSame
    }
    FG.openContextMenu(tmp, onIdxContextMenuAction);
}


// begin .js initialization ///////////////////////////////////////////////////////////////////////////////////////////
let tmp = document.getElementById("divIndexView");
const style = window.getComputedStyle(tmp);     // get backgrd color of divIndexView and darken it by rgb 24,24,24
let bgColor = style.backgroundColor;            // keep it in bgColor 'for later' (see selectAndLoadDoc())
bgColor = FF.parseRgba(bgColor);                // parse the "rgba(24, 36,48, 0.69)"  into {r,g,b,a}
bgColor.r = Math.max(0, bgColor.r - 24);        // now reduce each r,g,b by 24 making sure it doesn't go negative
bgColor.g = Math.max(0, bgColor.g - 24);
bgColor.b = Math.max(0, bgColor.b - 24);
bgColor = "rgb(" + bgColor.r + "," + bgColor.g + "," + bgColor.b + ")"; // finally rebuild it into "rgb(r,g,b)"


let draggedItem       = null;                             // ptr to <li> currently being dragged
let placeholder       = document.createElement('div');    // create the thin-black-line that shows where a dragDrop will go on dragEnd
placeholder.className = 'placeholder';

let el = document.getElementById("divIndexView");
el.addEventListener('click',       onLeftClick);      // add left,right click listeners on entire divIndexView
el.addEventListener("contextmenu", onContextMenu);


async function showDocTree() { // build <UL> to display in left index pane
    let view = document.getElementById("divIndexView");
    view.innerHTML = "";     // wipe contents.  (there are no added event listeners to remove so this is safe)
    let ul = document.createElement("ul");
    ul.id = "divIndexViewUL";
    tmp.appendChild(ul);
    let div;
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
        div = document.createElement("div");    // append '<div style="width: 0px;"></div>'
        div.style.width = (curr.depth * 16) + "px";
        li.appendChild(div);
        div = document.createElement("div");    // append '<div style="width:16px;">&gt;</div>'
        div.style.width="16px";
        if (showArrow) {
            div.innerHTML = "&gt;";
        }
        li.appendChild(div);
        div = document.createElement("div");    // append 'Document Name'
        div.innerHTML = curr.name;
        li.appendChild(div);
    }
}



async function selectAndLoadDoc(uuid) {
    if (FG.curDoc) {
        const info = FF.getDocInfo(FG.curDoc.uuid);
        info.li.style.backgroundColor = "";     // clear bgColor of prior selected element
    }

    if (uuid) {
        const info = FF.getDocInfo(uuid);
        if (info) {
            if (await getDoc(uuid)) {      // if doc loaded, change treeEntry background to bgColor
                info.li.style.backgroundColor = bgColor;
            }
        }
    } else {
        FF.clearDoc();
    }
}


export async function initialize() {    // called from index.js
    await FG.loadDocTree();             // load-and-show docTree

    let pkt = WS.makePacket("GetExtra");   
    pkt.txt = "curDocUuid";
    pkt = await WS.sendWait(pkt);       // fetch the prior docUuid

    selectAndLoadDoc(pkt.txt);          // load, hilight, and display doc by uuid
}


function getDocTreeClickedUuid(evt) {
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
    const uuid = getDocTreeClickedUuid(evt);
    await selectAndLoadDoc(uuid);
}

async function onContextMenu(evt) {     // desel any sel,  sel current one under mouse, then open a context menu
    evt.preventDefault();
    const uuid = getDocTreeClickedUuid(evt);
    await selectAndLoadDoc(uuid);

    openIndexContextMenu();
}

function onDragStart(evt) {
    debugger; draggedItem = evt.target;
    evt.dataTransfer.effectAllowed = 'move';
    evt.target.classList.add('dragging');
    // console.log(`ODS TF1(${evt.target.id},${draggedItem.id})`);
}

function onDragOver(evt) {
    debugger; evt.preventDefault();
    evt.dataTransfer.dropEffect = 'move';

    let tf1 = (evt.target.nodeName === 'LI' && evt.target.id !== draggedItem.id);
    let tf2 = (evt.target.nodeName === 'LI' && evt.target !== draggedItem);
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
    debugger; evt.preventDefault();

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
FG.loadDocTree = async function() {         // sets off the following chain of WS db calls...
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
            debugger; FF.clearDoc();                    // nuke it!
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

    FG.curDoc = { uuid: uuid };
    FG.curDoc.rootDch = await imp.attach(pkt.doc, null);  // now attach it to the system as new root doc!

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



