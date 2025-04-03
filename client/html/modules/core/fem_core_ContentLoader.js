
// loads/saves jotfiles, breaks them apart and hands the pieces off to other handlers along the way
FF.ContentLoader = class DCH_ContentLoader /*extends FF.DocComBASE*/ {
 //   type = 0;    // raw loader, don't read XYWH or anything before passing control to this

    parent;
    // children = [];

    async load(parent, sr)    { return await _load.call(this, parent, sr); }   // load content, return ptr
    async render()            {        await _render.call(this);           }   // rerender entire object and all its children


//#####################################################################################################################
    constructor(parent) {
        this.parent = parent;
    };
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
async function _load(sr) {        // this loader loads the 'out of band' stuff not specifically inside a component
    return new Promise(async (resolve, reject) => {
        let handlers = [];
        let docHandler = null;
        while (true) {
            const chgLevel = sr.readCtl();
            if (chgLevel == '-' || chgLevel == "") {    // step out or end-of-string
                resolve(handlers);
                return;
            }
            if (chgLevel == '+') {                      // + must only occur after an = never at top or another + or -
                let loader = new FF.ContentLoader(docHandler); // pass most recent docHandler as parent of all following children
                docHandler.children = await loader.load(sr);   // put obtained children array into docHandler
            }
            if (chgLevel == '=') {
                let dhName = sr.readUntil(';');             // read the dochandler name to process the following data
                if (!DCH.hasOwnProperty(dhName)) {          // load the module(plugin) if not already loaded
                    const dch = await FF.loadModule("./modules/DocComponentHandlers/dch_" + dhName + ".js")
                    DCH[dhName] = dch.DCH;
                }
                docHandler = new DCH[dhName](this.parent);    // get new instance of actual handler
                handlers.push(docHandler);               // add it to array of same-level docHandlers

                if (docHandler.type == 1) {                 // do basic stuff depending on moduleType 
                    docHandler.X = parseInt(sr.readUntil(';'));
                    docHandler.Y = parseInt(sr.readUntil(';'));
                    docHandler.W = parseInt(sr.readUntil(';'));
                    docHandler.H = parseInt(sr.readUntil(';'));
                    debugger; // RSTODO RSTODO RSTODO RSTODO RSTODO RSTODO here is where we inject this modules 'div' into the page
                }
                let byteCt = parseInt(sr.readUntil(';'));
//RSWARN possible memory issues on reallyreally large docs (but by then we should be changing the format to use dbaseRecs)
                let cmpData = sr.read(byteCt, true);         // yank (and trim!) the meat from the doc for this handler
                docHandler.load(cmpData);
            }
        }
    });
}

    
// function _xload(str) {
//     debugger; const sr = new SH.StringReader(str);
//     let itemsRemaining = sr.readUntil(';');
//     let dhName;
//     while (itemsRemaining > 0 && (dhName = sr.readUntil(';')) != "") {
//         const docHandler = new DCH[dhName]          // get new instance of actual handler
//         if (docHandler.type == 1) {                 // if handler is type1, what comes next is XYWH
//             docHandler.X = sr.readUntil(';');
//             docHandler.Y = sr.readUntil(';');
//             docHandler.W = sr.readUntil(';');
//             docHandler.H = sr.readUntil(';');
//         }
//         let byteCt = sr.readUntil(';');
// //RSWARN possible memory issues on reallyreally large docs (but by then we should be changing the format to use dbaseRecs)
//         let subDoc = sr.read(byteCt, true);         // yank (and trim!) the meat from the doc for this handler
//         idx = docHandler.load(subDoc);
//     }
// }


function _render() {                // render the box and all its children
    debugger;
}


