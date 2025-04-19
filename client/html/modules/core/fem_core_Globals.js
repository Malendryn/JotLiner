
// name----------val-----------Description-------------------------------------------------------
// ==== FROM fem_core_Globals =========================================================================================
// FG.baseURL   = "";       // for backend this is __filename, for frontend this is 'http://site:port'
// FG.__dirname   
// ==== FROM fem_core_WSockHandler ====================================================================================
FG.VERSION; //  ="1.0";     // SET AT TOP OF "index.js", NOT HERE !!!!  (used to compare and upgrade docs when loading)

FG.baseURL       = window.location.origin;  // EG: "http://localhost:3000"
FG.ws            = null;     // WebSocket connector to localServer
FG.DCH_BASE      = null;     // base class from which ALL DocComponentHandlers must inherit from
FG.docRoot       = null;     // the currently loaded document as a tree of handlers

/*  RSTODO:
FG.ViewBASE     = null,     // base class for all views loaded via FF.loadView()

FG.bookList     = [],	    // array of books from FIPC.fetchBookList()

FG.sessionInfo  = null,     // new SessionInfo(),  has get/setters for all sessionInfo data like curBookId, etc..

FG.curView      = null,     // current loaded view (instance of class ViewBASE)

// when book.html is loaded:
FG.ch_outline   = null,     // CanvasHandler for leftside 'outline' canvas of the book.html page
FG.ch_page      = null,     // CanvasHandler for rightside 'page' canvas of the book.html page
        //RSNOTE RSTODO consider making ch_page a BLANK SLATE that other pages become a child of as this is effectively an infinite canvas 
*/




// export async function init() {
//     return new Promise(async (resolve, reject) => {
//         debugger;       //dosomething
//         resolve(this);
//         return;
//         // reject(err); // ifError
//         // return;
//     });
// };

