
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
    await FF.loadModule("./modules/core/fem_core_Globals.js");             // populate basics of FG
    await FF.loadModule("./modules/core/fem_core_Functions.js");           // populate basics of FF
    await FF.loadModule("./modules/core/fem_core_DCH_BASE.js");            // FG.DCH_BASE -- class for all other DocComponentHandlers to inherit from
    await FF.loadModule("./modules/core/fem_core_TKMEvtHandlers.js");      // Toplevel Kbd/Mouse HandlerFuncs like mousedown to move divs, etc...
    await FF.loadModule("./modules/core/fem_core_ContextMenu.js");         // FF.openContextMenu(): Generic context menu handler
    // await FF.loadModule("./modules/core/fem_core_DCHContextMenu.js");      // DCH-specific context menu handler
    await FF.loadModule("./modules/core/fem_core_PopupDialog.js");         // FF.openPopup(): Generic popup handler
    await FF.loadModule("./modules/core/fem_core_WSockHandler.js");        // assigns FG.ws and opens FG.ws BEFORE returning
    await FF.loadModule("./modules/shared/shared_PacketDefs.js");
    await FF.loadModule("./modules/core/fem_core_PacketHandlers.js");      // for packets sent from backend that are not expect/wait responses
    mod = await FF.loadModule("./modules/core/fem_core_DocImporter.js");
    FG.DocImporter = mod.DocImporter;
    mod = await FF.loadModule("./modules/core/fem_core_DocExporter.js");
    FG.DocExporter = mod.DocExporter

    let  pkt = WS.makePacket("GetDCHList");     // first thing we have to do is get the list of DCH handlers
    pkt = await WS.sendWait(pkt);

    for (const dchName of pkt.list) {           // DONT use pkt.list.forEach() here cuz 'await' won't work inside loop
        const path = "./modules/DocComponentHandlers/" + dchName;
        if (!DCH.hasOwnProperty(dchName)) {     // load the module(plugin) if not already loaded
            // console.log(">", dchName);
            let mod = await FF.loadModule(path + "/dch_" + dchName + ".js")
            let dch = mod.DCH;                      // get class out of module, discard module
            dch._path = path;                   // set path to module's dir so module can load its own files/icons if needed
            // console.log("<", dchName);
            DCH[dchName] = dch;
        }
    }

    mod = await FF.loadModule("./modules/core/fem_core_divIndexViewHandler.js"); // handler for the leftside divIndexView
    mod.initialize();       // transfer control to this module to do final initialization
});


