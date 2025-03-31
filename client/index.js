
globalThis.FG = {}; // global 'Frontend Globals' variables   (see csm_core_Globals.js for details)
globalThis.FF = {}; // global 'Frontend Functions' functions (see csm_core_Functions.js for details)
FF.loadModule = async (modulePath) => {
    return new Promise(async (resolve, reject) => {
        try {
            const module = await import(modulePath); // Replace with your module path
            if ("init" in module) {
                await module.init();
            }
            resolve(module);
            return
        } catch (error) {
            debugger; console.log(`*** FAILED TO LOAD module '${modulePath}' ***  err='${error}'`);
            alert(`*** FAILED TO LOAD module '${modulePath}' ***  err='${error}'`);
            reject(error);
            return;
        }
    });
};

// RSTODO go look at the older jotliner code, we had detailed funcalls to handle loading and tracking and unloading modules that we NEED to move over to here!
window.addEventListener('load', async function() {
    // console.log(this.document.baseURI);
    await FF.loadModule("./modules/core/csm_core_Globals.js");          // populate basics of FG
    await FF.loadModule("./modules/core/csm_core_Functions.js");      // populate basics of FF
    await FF.loadModule("./modules/core/csm_core_WSockHandler.js");     // assigns FG.ws and FF funcs and opens ws connection BEFORE returning

    // const qq = await FF.loadModule("./modules/csm_txted.js");
    // qq.myFunction();
    // console.log(qq.myVariable);
});


console.log("foo");


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