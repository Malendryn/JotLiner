function openContextMenu(evt) {      // based on the el the mouse is over when rightmouse was pressed...

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

    let mnu = document.getElementById("dchContextMenu");
    if (mnu) {     // if a menu already exists, eat the event, and go home!
        evt.preventDefault();
        return;
    }

    const dch = div._dchHandler;        // the actual dch instance
    let dchName;                        // the name (as found in the globalThis.DCH{} )
    for (const key in DCH) {            // get it's dchName by searching for it in the loaded DCH ComponentHandlers
        if (dch instanceof DCH[key]) {  
            dchName = key;
            break;
        }
    }

    mnu = document.createElement("div");        // create the contextMenu div
    mnu.id = "dchContextMenu";                      // we use id so we don't open more menus if ones already open
    mnu.className = "dchContextMenu";               // we use className to reuse .css when opening child contextMenus
    mnu.style.left = evt.clientX + 'px';            // Position the custom menu at the mouse coordinates
    mnu.style.top  = evt.clientY + 'px';
    mnu.style.zIndex = "999999999";
    mnu.style.display = 'block';                    // Show the custom menu

    let ul = document.createElement("ul");          // create the outermost <ul>
    ul.style.margin = "0px";
    mnu.appendChild(ul);

    function addLi(ul, action, text, tooltip) {
        let li = document.createElement("li");          // recreate '<li data-action="export">Export</li>'
        li.textContent = text;
        if (action) {
            li.setAttribute("data-action", action);
        }
        ul.appendChild(li);
    }

    if (dch.children !== null) {                    // if dchHandler allows children...
        addLi(ul, null, "Insert New... >", "Insert new editor at cursor location");
        let ul2 = document.createElement("ul");     // create subMenu <ul>
        ul.appendChild(ul2);
        for (const key in DCH) {            // get it's dchName by searching for it in the loaded DCH ComponentHandlers
            const dchClass = DCH[key];
            if (dchClass.menuName !== null) {
                addLi(ul2, "new_" + key, dchClass.menuName, dchClass.menuTooltip);
            }
        }
    }

    if (dch.hasDiv) {
        addLi(ul, null, "Change Anchors... >", "Change how an editor is anchored to its parent");
        let ul2 = document.createElement("ul");     // create subMenu <ul>
        ul.appendChild(ul2);
        addLi(ul2, "anchor_LW", "Anchor left+width",  "Anchor editor to left edge of parent with fixed width");
        addLi(ul2, "anchor_RW", "Anchor right+width", "Anchor editor to right edge of parent with fixed width");
        addLi(ul2, "anchor_LR", "Anchor left+right",  "Anchor editor to left and right edges of parent, width resizes with parent");
        addLi(ul2, "anchor_TH", "Anchor top+height",    "Anchor editor to top edge of parent with fixed height");
        addLi(ul2, "anchor_BH", "Anchor bottom+height", "Anchor editor to bottom edge of parent with fixed height");
        addLi(ul2, "anchor_TB", "Anchor top+bottom",    "Anchor editor to top and bottom edges of parent, height resizes with parent");
    }

    if (dchName != "DOC") {     // DOC is the one handler that cannot be deleted
        addLi(ul, "delete",   "Delete editor (and all children)", "Delete editor under mouse and all children inside it");
    }

    if (FG.docRoot.children.length > 0) {       // if there is something more than just the DOC element
        addLi(ul, "export", "Export document", "Export document to local file");
    }
 
    document.body.appendChild(mnu);             // menu is built, we can attach it now!

    evt.preventDefault(); // Prevent the browser's default context menu

    document.addEventListener('click', closeContextMenu);      // Add listener to close the menu if clicked outside

    function closeContextMenu(event) {
        if (mnu) {
            document.removeEventListener('click', closeContextMenu);
            document.body.removeChild(mnu);
            mnu = null;
        }
        // // if (!menu.contains(event.target)) {
        //     menu.style.display = 'none';
        // // }
    }
    
    mnu.addEventListener('click', async function(evt) {    // Handle clicks on the custom menu items
        const clickedItem = evt.target.closest('li');
        if (clickedItem) {
            const action = clickedItem.getAttribute('data-action');
            if (action) {
                console.log(`Clicked on: ${action}`);
                switch (action) {                                     // 'go do' whatever was clicked
                    case "export":
                        let exp = await FF.loadModule("./modules/core/fem_core_DocExporter.js");
                        exp = new exp.DocExporter();    //RSNOTE DOES NOT detach! ONLY exports!!!!
                        let str = await exp.export(FG.docRoot);
                        console.log(str);
                        break;
                    case "anchor_LW":
                        console.log("fem_core_DCHContextMenu.js: go back to opening our <div> based dialogf here");
                        let el = document.getElementById("popDlgDCHAnchor");
                        el.style.display="block";

//                        popDlgDCHAnchorOpener();
                        break;
                }
            }
            closeContextMenu(evt);            // finally, close(erase) menu
        }
    });
}


// function popDlgDCHAnchorOpener() {
//     window.addEventListener("message", onPopDlgDCHAnchorsMsg);
//     const popWin = window.open("./popDlgDCHAnchor.html", "_blank", "width=400,height=400,left=100,top=100,location=no");
//     popWin.document.close();
// }


// function onPopDlgDCHAnchorsMsg(evt) {
//     debugger; if (evt.origin != window.location.origin) {    // just an extra security measure
//         return;
//     }
//     let data = evt.data;
//     if (data.action == "close") {
//         window.removeEventListener('message', onPopDlgDCHAnchorsMsg);
//     }
// };


window.addEventListener('contextmenu', openContextMenu);
