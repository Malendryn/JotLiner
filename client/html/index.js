
globalThis.FG  = {}; // global 'Frontend Globals' variables   (see fem_core_Globals.js for details)
FG.VERSION = "1.0";
globalThis.FF  = {}; // global 'Frontend Functions' functions (see fem_core_Functions.js for details)
globalThis.SH  = {}; // global 'Front And Backend' functions (see fem_core_Shared.js for details)
globalThis.DCH = {}; // document component handler CLASSES, by name (EG {"_BASE": class DCH__BASE, "DOC": class DCH_DOC)

FG.wssPort = 3000;     // must match port in server/server.js

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

    mod = await FF.loadModule("./modules/shared/shared_StreamReader.js");       // done this way so can name as FG=frontend BG=backend
    FG.StreamReader = mod.StreamReader;     // its on FG cuz it's a class, not yet instanced

    mod = await FF.loadModule("./modules/shared/shared_DocLoader.js"); // FG.DocLoader -- loads DocComponents from a str
    FF.DocLoader = new mod.DocLoader();     // its on FF cuz it's already instanced, not a raw class

    await FF.newDoc();        // initialize system with an empty document  (unneeded as .load below does it now)

// RSTEST BEGIN of doc streamreading/displaying 
// first lets load a test document from the __TESTDOC__.js file
    let module = await FF.loadModule("./__TESTDOC__.js");   // describes minimal document format as well as implements and returns a test doc
    let doc    = module.doc;                                // extract the test doc from the module
    let sr     = new FG.StreamReader(doc);                  // turn it into a StreamReader

// now lets test an actual loading and rendering of it
    FG.docRoot = await FF.DocLoader.loadDoc(sr, null);                  // load doc (as newDoc cuz null) and all children

    await FG.docRoot.render();

// RSTEST END of doc streamreading/displaying

// RSTEST BEGIN of making/sending/parsing wss packets
    const qq = FF.makePacket("PacketTest");
    qq.send();
    let zz = JSON.stringify(qq);
    let rr = FF.parsePacket("PacketTest|" + zz);
    rr.send();
// RSTEST END of making/sending/parsing wss packets
});


