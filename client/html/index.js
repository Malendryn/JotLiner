
globalThis.FG  = {}; // global 'Frontend Globals' variables   (see fem_core_Globals.js for details)
FG.VERSION = "1.0";
globalThis.FF  = {}; // global 'Frontend Functions' functions (see fem_core_Functions.js for details)
globalThis.SH  = {}; // global 'Front And Backend' functions (see fem_core_Shared.js for details)
globalThis.DCH = {}; // document component handler CLASSES, by name (EG {"_BASE": class DCH__BASE, "DOC": class DCH_DOC)


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
            // reject(error);
            // return;
        }
    });
};


// RSTODO go look at the older jotliner code, we had detailed funcalls to handle loading and tracking and unloading modules that we NEED to move over to here!
window.addEventListener('load', async function() {
    let mod;
    // console.log(this.document.baseURI);
    await FF.loadModule("./modules/core/fem_core_Globals.js");          // populate basics of FG
    await FF.loadModule("./modules/core/fem_core_Functions.js");        // populate basics of FF
    await FF.loadModule("./modules/core/fem_core_WSockHandler.js");     // assigns FG.ws and opens FG.ws BEFORE returning
    await FF.loadModule("./modules/core/fem_core_DCH_BASE.js");         // FG.DCH_BASE -- class for all other DocComponentHandlers to inherit from
    await FF.loadModule("./modules/core/fem_core_TKMHandlers.js");      // Toplevel Kbd/Mouse HandlerFuncs like mousedown to move divs, etc...

    mod = await FF.loadModule("./modules/shared/shared_StreamReader.js");       // done this way so can name as FG=frontend BG=backend
    FG.StreamReader = mod.StreamReader;     // its on FG cuz it's a class, not yet instanced

    mod = await FF.loadModule("./modules/shared/shared_DocLoader.js"); // FG.DocLoader -- loads DocComponents from a str
    FF.DocLoader = new mod.DocLoader();     // its on FF cuz it's already instanced, not a raw class

    await FF.newDoc();        // initialize system with an empty document  (unneeded as .load below does it now)

// RSTEST begin
// first lets load a test document from the __TESTDOC__.js file
    let module = await FF.loadModule("./__TESTDOC__.js");   // describes minimal document format as well as implements and returns a test doc
    let doc    = module.doc;                                // extract the test doc from the module
    let sr     = new FG.StreamReader(doc);                  // turn it into a StreamReader

// now lets test an actual loading and rendering of it
    FG.docRoot = await FF.DocLoader.loadDoc(sr, null);                  // load doc (as newDoc cuz null) and all children

    await FG.docRoot.render();

// RSTEST end
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
window.onload = async () => {
    // await FF.msDelay(1500); debugger;

    await FF.loadModule("modules/fem_class_SessionInfo.js"); // load and attach class as FG.sessionInfo
    await FF.loadModule("modules/fem_Functions.js");         // load and attach many generic functions to FF         (FrontendFunctions)
    await FF.loadModule("modules/IPC/fem_IPCHandler.js");    // load and attach the IPC handler and FIPC functions   (FrontendIPC)
    await FF.loadModule("modules/IPC/fem_IPC_dbClient.js");  // load and attach the database I/O calls to FIPC too
    await FF.loadModule("views/class_ViewBASE.js");          // load and attach class as FG.ViewBASE

    await FF.loadModule("fonts/fontLoader.js");              // load and attach FF.loadFont()

    // CanvasHandlers are an intrinsic part of this app so we load them here
    await FF.loadModule("modules/CanvasHandlers/class_CH_BASE.js");			            // load and attach class FG.CH_BASE
    await FF.loadModule("modules/CanvasHandlers/class_CH_BASE_Scroller.js");	        // load and attach class FG.CH_BASE_Scroller

  
    el = document.getElementById("ddsCurBook");
    el.addEventListener("click", onDdsCurBook); // see below
//    window.addEventListener("beforeunload", onPageUnload);    // useless unfortunately

    FF.loadView("index.js");
}

// special case 'user bar' functions that really belong to index.html but must never be unloaded when module is unloaded
function onDdsCurBook(event) {    // on DropDownSelectorCurBook
    const bookId = event.target.value;  // fetch Id of book, or the word 'bookManager'
    if (bookId == "bookManager") {
        FF.loadView("book_Manager.js");
    } else {
        if (FG.sessionInfo.setCurBookId(bookId)) {
            FF.loadView("book_MainPage.js");    // save curBook (if needed) via .beforeUnload(), then load new book!
        }
//        activateBook(bookId);  // THIS will fail! we don't yet have a way to PROPERLY save one book and activate another
    }
}
*/