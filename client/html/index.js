
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
    const el = this.document.getElementById("divIndexDocSizer");
    el._dchMouseOp = "idx<>doc";
    let mod;
    // console.log(this.document.baseURI);
    await FF.loadModule("./modules/core/fem_core_Globals.js");          // populate basics of FG
    await FF.loadModule("./modules/core/fem_core_Functions.js");        // populate basics of FF
    await FF.loadModule("./modules/core/fem_core_DCH_BASE.js");         // FG.DCH_BASE -- class for all other DocComponentHandlers to inherit from
    await FF.loadModule("./modules/core/fem_core_TKMEvtHandlers.js");   // Toplevel Kbd/Mouse HandlerFuncs like mousedown to move divs, etc...
    await FF.loadModule("./modules/core/fem_core_DCHContextMenu.js");   // Generic context menu handler for DCH (and toplevel) objects
    await FF.loadModule("./modules/core/fem_core_WSockHandler.js");     // assigns FG.ws and opens FG.ws BEFORE returning
    await FF.loadModule("./modules/shared/shared_PacketDefs.js");

// // RSTEST BEGIN of doc streamreading/displaying ///////////////////////////////////////////////////////////////////////
// // first lets load a test document from the __TESTDOC__.js file
//     let module = await FF.loadModule("./__TESTDOC__.js");   // describes minimal document format as well as implements and returns a test doc
//     let doc    = module.doc;                                // extract the test doc from the module
//     let sr     = new FG.DocParser(doc);                  // turn it into a DocParser

// // now lets test an actual loading and rendering of it
//     FG.docRoot = await FF.DocImporter.importDoc(sr, null);                  // load doc (as newDoc cuz null) and all children
//     await FG.docRoot.render();
// // RSTEST END of doc streamreading/displaying /////////////////////////////////////////////////////////////////////////

    const pkt = WS.makePacket("GetDCHList");        // first thing we have to do is get the list of DCH handlers
    WS.sendExpect(pkt, gotDCHList);
});


async function gotDCHList(pkt) {
    for (const dchName of pkt.list) {           // DONT use pkt.list.forEach() here cuz 'await' won't work inside loop
        const path = "./modules/DocComponentHandlers/" + dchName;
        if (!DCH.hasOwnProperty(dchName)) {     // load the module(plugin) if not already loaded
            console.log(">", dchName);
            let dch = await FF.loadModule(path + "/dch_" + dchName + ".js")
            dch = dch.DCH;                      // get class out of module, discard module
            dch._path = path;                   // set path to module's dir so module can load its own files/icons if needed
            console.log("<", dchName);
            DCH[dchName] = dch;
        }
    }

    await FF.newDoc();        // initialize system with an empty document (AFTER DCH modules are loaded cuz 'DOC')

// RSTODO at this point technically we're done but for testing lets load a doc immediately
    pkt = WS.makePacket("GetDoc");
    pkt.docId = "TESTDOC.txt";
    let xx = WS.sendExpect(pkt, gotDoc);
}


async function gotDoc(pkt) {
    if (pkt instanceof WS.__classes["Fault"]) {
        debugger;
    }

    let imp = await FF.loadModule("./modules/core/fem_core_DocImporter.js");
    imp = new imp.DocImporter();

    await imp.attach(pkt.doc, null);  // now attach it to the system as new root doc!

    // debugger; await FG.docRoot.destroy();
    // debugger; await imp.attach(pkt.doc, null);  // now attach it to the system as new root doc!


    // let exp = await FF.loadModule("./modules/core/fem_core_DocExporter.js");
    // exp = new exp.DocExporter();    //RSNOTE DOES NOT detach! ONLY exports!!!!
    // let str = await exp.export(FG.docRoot);
    // console.log(str);
}



