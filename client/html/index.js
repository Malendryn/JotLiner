
globalThis.FG  = {}; // global 'Frontend Globals' variables   (see fem_core_Globals.js for details)
globalThis.FF  = {}; // global 'Frontend Functions' functions (see fem_core_Functions.js for details)
globalThis.SH  = {}; // global 'Front And Backend' functions (see fem_core_Shared.js for details)
globalThis.DCH = {}; // DocumentComponentHandler CLASSES, by name (EG {"_BASE": class DCH__BASE, "DOC": class DCH_DOC)
globalThis.WS  = {}; // WebSocket and Packet transmit/receive CLASSES, funcs, etc

FG.VERSION = "1.0";     // system version (primarily for importing/exporting docs and docdata)
WS.wssPort = 3000;      // must match port in server/server.js

FF.loadModule = async (modulePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const module = await import(modulePath); // Replace with your module path
            if ("init" in module) {
                await module.init();
            }
            resolve(module);
            return;
        } catch (error) {
            console.log(`*** FAILED TO LOAD module '${modulePath}' ***  err='${error}'`);
            alert(`*** FAILED TO LOAD module '${modulePath}' ***  err='${error}'`);
            throw(error);
        }
    });
};


// RSTODO go look at the older jotliner code, we had detailed funcalls to handle loading and tracking and unloading modules that we NEED to move over to here!
window.addEventListener('load', async function() {
    let mod;
    // console.log(this.document.baseURI);
    await FF.loadModule("./modules/core/fem_core_Globals.js");          // populate basics of FG
    await FF.loadModule("./modules/core/fem_core_Functions.js");        // populate basics of FF
    await FF.loadModule("./modules/core/fem_core_DCH_BASE.js");         // FG.DCH_BASE -- class for all other DocComponentHandlers to inherit from
    await FF.loadModule("./modules/core/fem_core_TKMEvtHandlers.js");   // Toplevel Kbd/Mouse HandlerFuncs like mousedown to move divs, etc...
    await FF.loadModule("./modules/core/fem_core_WSockHandler.js");     // assigns FG.ws and opens FG.ws BEFORE returning
    await FF.loadModule("./modules/shared/shared_PacketDefs.js");

    await FF.newDoc();        // initialize system with an empty document  (unneeded as .load below does it now)

// // RSTEST BEGIN of doc streamreading/displaying ///////////////////////////////////////////////////////////////////////
// // first lets load a test document from the __TESTDOC__.js file
//     let module = await FF.loadModule("./__TESTDOC__.js");   // describes minimal document format as well as implements and returns a test doc
//     let doc    = module.doc;                                // extract the test doc from the module
//     let sr     = new FG.DocParser(doc);                  // turn it into a DocParser

// // now lets test an actual loading and rendering of it
//     FG.docRoot = await FF.DocImporter.importDoc(sr, null);                  // load doc (as newDoc cuz null) and all children
//     await FG.docRoot.render();
// // RSTEST END of doc streamreading/displaying /////////////////////////////////////////////////////////////////////////

// RSTEST BEGIN of making/sending/parsing wss packets
    const pkt = WS.makePacket("GetDoc");
    pkt.docId = "TESTDOC.txt";
    let xx = WS.sendExpect(pkt, gotDoc);
// RSTEST END of making/sending/parsing wss packets
    addCustomContextMenu();
});


async function gotDoc(pkt) {
    if (pkt instanceof WS.__classes["Fault"]) {
        debugger;
    }

    let imp = await FF.loadModule("./modules/core/fem_core_DocImporter.js");
    imp = new imp.DocImporter();

    await imp.attach(pkt.doc, null);  // now attach it to the system as new root doc!
//X    await FG.docRoot.render();

    let exp = await FF.loadModule("./modules/core/fem_core_DocExporter.js");
    exp = new exp.DocExporter();    //RSNOTE DOES NOT detach! ONLY exports!!!!
    let str = await exp.export(FG.docRoot);
    console.log(str);
}

function addCustomContextMenu() {
    debugger; const customContextMenu = document.getElementById('customContextMenu');

    window.addEventListener('contextmenu', function(e) {     
        e.preventDefault(); // Prevent the browser's default context menu
  
        customContextMenu.style.left = e.clientX + 'px';           // Position the custom menu at the mouse coordinates
        customContextMenu.style.top  = e.clientY + 'px';
        customContextMenu.style.display = 'block';                 // Show the custom menu
  
        document.addEventListener('click', closeContextMenu);      // Add listener to close the menu if clicked outside
    });

    function closeContextMenu(event) {
        // if (!customContextMenu.contains(event.target)) {
            customContextMenu.style.display = 'none';
            document.removeEventListener('click', closeContextMenu);
        // }
    }
  
    customContextMenu.addEventListener('click', async function(e) {    // Handle clicks on the custom menu items
        const clickedItem = e.target.closest('li');
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
            closeContextMenu(e);            // finally, close(hide) menu
        }
    });
}