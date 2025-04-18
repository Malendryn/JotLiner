
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

    window.addEventListener('click', clicky, true);     // true=no one can stop me, muahaha!

    document.addEventListener('mousedown', mousedown, true);
    document.addEventListener('mousemove', mousemove, true);
    document.addEventListener('mouseup',   mouseup,   true);

// RSTEST end
});

let mouseOp = null; // mouse Operation (presently only for click+drag of divHandlers)
    
// let downX, downY, targetEl = null;
// let downRect;

function mousedown(evt) {
    evt.stopPropagation();
    evt.preventDefault();

    mouseOp = {};
    let m = mouseOp;   // just for brevity below

//RSTODO WHEN moving a handled element and not its contents, 
//     HERE we have to walk 'mouseOp.targetEl' UP to the this.div object that 'owns' the contents of the handler
//     and THAT becomes the el to move (seperate from the mouseOp.targetEl so mousemove ?)
m.targetEl = /*discovered el goes here*/evt.target;

    const tmp = window.getComputedStyle(m.targetEl);

    m.downRect = {
        lrMode: "",
        tbMode: ""
    };
    if (m.targetEl.style.left)  {  m.downRect.lrMode += "L"; m.downRect.left  = parseInt(m.targetEl.style.left);  }
    if (m.targetEl.style.right) {  m.downRect.lrMode += "R"; m.downRect.right = parseInt(m.targetEl.style.right); }
    if (m.targetEl.style.width) {  m.downRect.lrMode += "W"; m.downRect.width = parseInt(m.targetEl.style.width); }     // not used, only care about LR

    if (m.targetEl.style.top)    {  m.downRect.tbMode += "T"; m.downRect.top    = parseInt(m.targetEl.style.top);    }
    if (m.targetEl.style.bottom) {  m.downRect.tbMode += "B"; m.downRect.bottom = parseInt(m.targetEl.style.bottom); }
    if (m.targetEl.style.height) {  m.downRect.tbMode += "H"; m.downRect.height = parseInt(m.targetEl.style.height); }  // not used, only care about TB

    m.downX = evt.screenX;
    m.downY = evt.screenY;
}


function mousemove(evt) {
    if (mouseOp) {
        evt.stopPropagation();
        evt.preventDefault();
        const deltaX = (evt.screenX - mouseOp.downX);
        const deltaY = (evt.screenY - mouseOp.downY);

        if (mouseOp.downRect.lrMode.includes("L")) {
            mouseOp.targetEl.style.left = (mouseOp.downRect.left  + deltaX) + "px";
        }
        if (mouseOp.downRect.lrMode.includes("R")) {
            mouseOp.targetEl.style.right = (mouseOp.downRect.right - deltaX) + "px";
        }
        if (mouseOp.downRect.tbMode.includes("T")) {
            mouseOp.targetEl.style.top = (mouseOp.downRect.top     + deltaY) + "px";
        }
        if (mouseOp.downRect.tbMode.includes("B")) {
            mouseOp.targetEl.style.bottom = (mouseOp.downRect.bottom  - deltaY) + "px";
        }
    }    
}
function mouseup(evt) {
    if (mouseOp) {
        evt.stopPropagation();
        evt.preventDefault();
        mouseOp = null;
    }
}






function clicky(event) {
    console.log("click=", event.target, true);
}

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