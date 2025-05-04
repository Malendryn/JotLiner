let dch;    // toplevel so callback() can access it
function openDCHContextMenu(evt) {      // based on the el the mouse is over when rightmouse was pressed...
    if (!(evt.ctrlKey & evt.altKey)) {  // if not in specialMode (ctl+alt) just return
        return;
    }

    let div = evt.target;
    let op;
    while (div && (op = div?._dchMouseOp) === undefined) {  // climb parents to find _dchMouseOp
        div = div.parentNode;
    }
    if (op !== "dchComponent") {    // we only care about rightclicks on dch objects
        return;
    }

    evt.preventDefault();
    
    dch = div._dchHandler;        // the actual dch instance

    let dchName;                        // the name (as found in the globalThis.DCH{} )
    for (const key in DCH) {            // get it's dchName by searching for it in the loaded DCH ComponentHandlers
        if (dch instanceof DCH[key]) {  
            dchName = key;
            break;
        }
    }

    const entries = [];
    if (dch.children !== null) {                // if rightclicked dchHandler allows children...
        for (const key in DCH) {                // add all the addable dch's to the menuEntries
            const dchClass = DCH[key];
            if (dchClass.menuText !== null) {   
                entries.push(["insert_" + key, "Insert new " + dchClass.menuText, dch.menuTooltip]);
            }
        }
    }
    entries.push(["export", "Export Element", "Export document element (and all children) under cursor to local file"]);


    if (dch != FG.curDoc.rootDch) {     // never allow deleting the topmost BOX element from this menu
        entries.push(["delete",   "Delete Element (and all children)", "Delete document element under mouse and all children inside it"]);
    }

    async function callback(action) { 
        const rect = div.getBoundingClientRect();
        const mouseX = evt.clientX - rect.left;
        const mouseY = evt.clientY - rect.top;
// console.log("cxy=", evt.clientX, evt.clientY, ", divxy=",rect.left, rect.top, "offxy=", mouseX, mouseY);
        if (action.startsWith("insert_")) {
            let dchName = action.substr(7);
            const style = {L:mouseX, T:mouseY, W:100, H:100};
            const nuDch = await FG.DCH_BASE.create(dchName, dch, style);  // create handler, assign parent, create <div>, set style
            dch.children.push(nuDch);
        }
        switch (action) {                                     // 'go do' whatever was clicked
            case "export":
                let exp = await FF.loadModule("./modules/core/fem_core_DocExporter.js");
                exp = new exp.DocExporter();    //RSNOTE DOES NOT detach! ONLY exports!!!!
                let str = await exp.export(dch);
                console.log(str);
                break;
            case "anchor_LW":
                console.log("fem_core_ContextMenu.js: go back to opening our <div> based dialogf here");
                let el = document.getElementById("popDlgDCHAnchor");
                el.style.display="block";

//                        popDlgDCHAnchorOpener();
                break;
        }
    }

    FG.openContextMenu(entries, callback);
}

window.addEventListener('contextmenu', openDCHContextMenu);

    // if (dch.hasDiv) {
    //     addLi(ul, null, "Change Anchors... >", "Change how an editor is anchored to its parent");
    //     let ul2 = document.createElement("ul");     // create subMenu <ul>
    //     ul.appendChild(ul2);
    //     addLi(ul2, "anchor_LW", "Anchor left+width",  "Anchor editor to left edge of parent with fixed width");
    //     addLi(ul2, "anchor_RW", "Anchor right+width", "Anchor editor to right edge of parent with fixed width");
    //     addLi(ul2, "anchor_RW", "<hr>", "Anchor editor to right edge of parent with fixed width");
    //     addLi(ul2, "anchor_LR", "Anchor left+right",  "Anchor editor to left and right edges of parent, width resizes with parent");
    //     addLi(ul2, "anchor_TH", "Anchor top+height",    "Anchor editor to top edge of parent with fixed height");
    //     addLi(ul2, "anchor_BH", "Anchor bottom+height", "Anchor editor to bottom edge of parent with fixed height");
    //     addLi(ul2, "anchor_TB", "Anchor top+bottom",    "Anchor editor to top and bottom edges of parent, height resizes with parent");
    // }


