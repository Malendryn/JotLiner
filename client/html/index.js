
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


window.addEventListener('load', async function() {
    let el = this.document.getElementById("divIndexDocSizer");
    el._dchMouseOp = "idx<>doc";

    let mod;
    await FF.loadModule("./modules/core/fem_core_Globals.js");             // populate basics of FG
    await FF.loadModule("./modules/core/fem_core_Functions.js");           // populate basics of FF
    await FF.loadModule("./modules/core/fem_core_DCH_BASE.js");            // FG.DCH_BASE -- class for all other DocComponentHandlers to inherit from
    await FF.loadModule("./modules/core/fem_core_DocViewHandler.js");      // handle all the docview and Alt+Shift stuff
    await FF.loadModule("./modules/core/fem_core_WSockHandler.js");        // assigns FG.ws and opens FG.ws BEFORE returning
    await FF.loadModule("./modules/shared/shared_PacketDefs.js");
    await FF.loadModule("./modules/core/fem_core_PacketHandlers.js");      // for packets sent from backend that are not expect/wait responses
    mod = await FF.loadModule("./modules/core/fem_core_DocImporter.js");
    FG.DocImporter = mod.DocImporter;
    mod = await FF.loadModule("./modules/core/fem_core_DocExporter.js");
    FG.DocExporter = mod.DocExporter

    let  pkt = WS.makePacket("GetDCHList");     // first thing we have to do is get the list of DCH handlers
    pkt = await WS.sendWait(pkt);

// used to load handlers 'as needed' but since I need a list of their names I changed it to load them all here and now
// RSTODO consider adding a packet to simply fetch modulenames    
    for (const dchName of pkt.list) {                       // DONT use pkt.list.forEach() here cuz 'await' won't work inside loop
        const path = "./modules/DocComponentHandlers/" + dchName;
        if (!DCH.hasOwnProperty(dchName)) {                 // load the module(plugin) if not already loaded
            let mod = await FF.loadModule(path + "/dch_" + dchName + ".js")
            let dch = mod.DCH;                              // get class out of module, discard module
            DCH[dchName] = { dchClass:dch, srcUrl:path } ;
        }
    }

    await FF.loadModule("./modules/core/fem_core_IndexViewHandler.js"); // handler for the leftside divIndexView
    mod = await FF.loadModule("./modules/core/fem_core_TitlebarHandler.js");  // File/Edit/Help etc... menubar handler, dbselector, etc...
    await mod.initialize();    // select db, load, show, etc etc
});
