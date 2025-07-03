
import { trace, trace2, trace3 } from "/public/classes/DFTracer.mjs";

globalThis.FG  = {}; // global 'Frontend Globals' variables   (see fem_core_Globals.js for details)
globalThis.FF  = {}; // global 'Frontend Functions' functions (see fem_core_Functions.js for details)
globalThis.SF  = {}; // just like BF except shared_Functions (functions both backend and frontend have in common)
globalThis.DCH = {}; // DocumentComponentHandler CLASSES, by name (EG {"_BASE": class DCH__BASE, "DOC": class DCH_DOC)
globalThis.WS  = {}; // WebSocket and Packet transmit/receive CLASSES, funcs, etc
globalThis.LS  = {}; // see fem_core_LocalStore.js

WS.wssPort = 3000;      // must match port in server/server.js

/**********************************************************************************************************************
to create key and cert files do the following:  (replace 192.168.10.10 to your machine's IP address)
openssl req -x509 -newkey rsa:2048 -nodes -keyout localhost.key.pem -out localhost.cert.pem -days 365 \
  -subj "/CN=192.168.10.10" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1,IP:192.168.10.10"
**********************************************************************************************************************/

FF.loadModule = async (modulePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const module = await import(modulePath); // Replace with your module path
            if ("init" in module) {
                await module.init();
            }
            return resolve(module);
        } catch (error) {
            console.warn(`*** FAILED TO LOAD module '${modulePath}' ***  err='${error}'`);
            // alert(`*** FAILED TO LOAD module '${modulePath}' ***  err='${error}'`);
            reject(error);
        }
    });
};


function __onError(message, source, lineno, colno, error) {
    console.log(error);
    debugger;
}
window.onerror = __onError;

function __onUnhandledRejection(err) {
    console.log(err);
    debugger;
}
window.onunhandledrejection = __onUnhandledRejection;

window.addEventListener('load', async function() {
    // await FF.loadModule("/public/classes/DFTracer.mjs");
    await FF.loadModule("./modules/shared/shared_Functions.js");           // populate SF -- also trace()
    await FF.loadModule("./modules/core/fem_core_Globals.js");             // populate FG
    await FF.loadModule("./modules/core/fem_core_Functions.js");           // populate FF

    let el;
    el = this.document.getElementById("divToolbar");
    FG.defaultToolbarHeight = el.getBoundingClientRect().height;
    el = this.document.getElementById("divIndexDocSizer");
    // el._dchMouseOp = "idx<>doc"; // oldschool, no longer needed

    let mod;
    await FF.loadModule("./modules/core/fem_core_LocalStore.js");          // attaches globally as 'LS' 'localStorage' class (for consistency)
    await FF.loadModule("./modules/core/fem_core_DocViewHandler.js");      // handle all the docview and Alt+Shift stuff
    mod = await FF.loadModule("./public/classes/DFWSPacketHandler.mjs");
trace("WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST WSTEST ")
await mod.client_test();
return;
    await FF.loadModule("./modules/core/fem_core_WSockHandler.js");        // assigns FG.ws and opens FG.ws BEFORE returning
    await FF.loadModule("./modules/shared/shared_PacketDefs.js");
    await FF.loadModule("./modules/core/fem_core_PacketHandlersFtoB.js");      // for packets sent from backend that are not expect/wait responses
    await FF.loadModule("./modules/core/fem_core_PacketHandlersBtoF.js");      // for packets sent from backend that are not expect/wait responses
    mod = await FF.loadModule("./modules/core/fem_core_DocAttacher.js");
    FG.DocAttacher = mod.DocAttacher;
    mod = await FF.loadModule("./modules/core/fem_core_DocExtracter.js");   // extracts FG.curDoc.s dcw entries as a DFDict
    FG.DocExtracter = mod.DocExtracter

    await FF.loadModule("./public/classes/DFStyleTracker.js");      // for packets sent from backend that are not expect/wait responses

    let pkt = WS.makePacket("GetBackendInfo");
    pkt = await WS.sendWait(pkt);
    FG.VERSION = pkt.version;
    FG.DOCVERSION = pkt.docVersion;
    WS.connId     = pkt.connId

    el = this.document.getElementById("__tbm3");
    el.innerHTML = `Project: JotLiner &nbsp; &nbsp; v${FG.VERSION}`;

    pkt = WS.makePacket("GetDCHList");     // first thing we have to do is get the list of DCH handlers
    pkt = await WS.sendWait(pkt);

// NO! Do not do this! This way will not give me access to the static vars I need for the menu options and tooltips    
    // for (const dchName of pkt.list) {   // let system know about the dch's available, (hotloaded inside DCH_<type>BASE)
    //     DCH[dchName] = null;
    // }
// YES!  This way gives me access to the static vars I need for the menu options and tooltips    
    for (const dchName of pkt.list) {                       // DONT use pkt.list.forEach() here cuz 'await' won't work inside loop
        const path = "./modules/DocComponentHandlers/" + dchName;
        if (!DCH.hasOwnProperty(dchName)) {                 // load the module(plugin) if not already loaded
            let mod = await FF.loadModule(path + "/dch_" + dchName + ".js")
            let dch = mod.DCH;                              // get class out of module, discard module
            DCH[dchName] = { dchClass:dch, srcUrl:path } ;
        }
    }

    await FF.loadModule("./modules/core/fem_core_IndexViewHandler.js");         // handler for the leftside divIndexView
    mod = await FF.loadModule("./modules/core/fem_core_TitlebarHandler.js");  // File/Edit/Help etc... menubar handler, dbselector, etc...
    await mod.initialize();    // select db, load, show, etc etc
});
