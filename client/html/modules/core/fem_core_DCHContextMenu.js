const dchEditorOps = [
    [ 0, "",         "Insert New... >",     "" ],
    [ 1, "newBOX",   "Box",                 "" ],
    [ 1, "newCTE",   "Rich Text CTE",       "" ],
    [ 1, "newSST",   "Spreadsheet",         "" ],
    [ 1, "newDBL",   "Database Layout",     "" ],
    [ 1, "newIDEF0", "IDEF0 drawing",       "" ],
    [ 1, "newPAINT", "Simple Painter",      "" ],
    [ 1, "newIMAGE", "Image",               "" ],
    [ 1, "newVIDEO", "Video",               "" ],
];

const dchAnchorOps = [       // [ depth(zerobased), keyword, text, tooltip ]
    [ 0, "",         "Change Horizontal Anchors... >", "" ],
    [ 1, "ancLW",    "Anchor left+width",   "" ],
    [ 1, "ancLR",    "Anchor left+right",   "" ],
    [ 1, "ancWR",    "Anchor width+right",  "" ],
    [ 0, "",         "Change Vertical Anchors... >", "" ],
    [ 1, "ancLW",    "Anchor top+height",    "" ],
    [ 1, "ancLR",    "Anchor top+bottom",    "" ],
    [ 1, "ancWR",    "Anchor height+bottom", "" ],
];

const dchDeleteOps = [
    [ 0, "delete",   "Delete entry (and all children)", "" ],
];


function openContextMenu(evt) {      // based on the el the mouse is over when rightmouse was pressed...
    let div = evt.target;
    let op;
    while (div && (op = div?._dchMouseOp) === undefined) {  // climb parents to find _dchMouseOp
        div = div.parentNode;
    }

    if (op !== "dchComponent") {    // we only care about rightclicks on dch objects
        return;
    }

    const dch = div._dchHandler;

    let cName;
    for (const key in DCH) {            // get it's cName by searching for it in the loaded DCH ComponentHandlers
        if (dch instanceof DCH[key]) {  
            cName = key;
            break;
        }
    }


    debugger; let list = [];
    if (cName == "DOC" || cName == "BOX") {
        list = list.concat(dchEditorOps);
    }
    if (cName != "DOC") {
        list = list.concat(dchAnchorOps);
        list = list.concat(dchDeleteOps);
    }
    const menu = document.getElementById("dchContextMenu");

// 1 if mouse=over a doc or a box and is NOT over something else INSIDE that doc or box (except another box...)
//   then we start with newEditors
// 2 ALL components should add the anchors always
// 3 if mouse=over a dch we want to add deleters too

    debugger; // RSTODO walk up the chian to find a dch, if not found just return

    debugger; evt.preventDefault(); // Prevent the browser's default context menu

    menu.style.left = e.clientX + 'px';           // Position the custom menu at the mouse coordinates
    menu.style.top  = e.clientY + 'px';
    menu.style.display = 'block';                 // Show the custom menu

    document.addEventListener('click', closeContextMenu);      // Add listener to close the menu if clicked outside

    function closeContextMenu(event) {
        // if (!menu.contains(event.target)) {
            menu.style.display = 'none';
            document.removeEventListener('click', closeContextMenu);
        // }
    }
    
    menu.addEventListener('click', async function(evt) {    // Handle clicks on the custom menu items
        const clickedItem = evt.target.closest('li');
        if (clickedItem) {
            const action = clickedItem.getAttribute('data-action');
            if (action) {
                console.log(`Clicked on: ${action}`);
                switch (action) {                                     // 'go do' whatever was clicked
                        case 'export':
                            let exp = await FF.loadModule("./modules/core/fem_core_DocExporter.js");
                            exp = new exp.DocExporter();    //RSNOTE DOES NOT detach! ONLY exports!!!!
                            let str = await exp.export(FG.docRoot);
                            console.log(str);
                            break;
                        case 'option2':
                            console.log("option2 clicked");
                            break;
                        case 'option3':
                            console.log("option3 clicked");
                            break;
                        case 'anotherOption':
                            alert("another option clicked");
                            break;
                }
            }
            closeContextMenu(evt);            // finally, close(hide) menu
        }
    });
   
}

window.addEventListener('contextmenu', openContextMenu);

