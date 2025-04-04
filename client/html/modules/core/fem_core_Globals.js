
// name----------val-----------Description-------------------------------------------------------
// ==== FROM fem_core_Globals =========================================================================================
// FG.baseURL   = "";       // for backend this is __filename, for frontend this is 'http://site:port'
// FG.__dirname   
// ==== FROM fem_core_WSockHandler ====================================================================================
FG.version      = [0, 0, 0];    // SET AT  TOP OF "index.js", NOT HERE !!!!  (used to match against FG.docVersion to upgrade doc when needed)

FG.baseURL      = window.location.origin;  // "http://localhost:3000"
FG.ws           = null;     // WebSocket connector to localServer
FG.content      = null;     // the currently loaded document as a tree of handlers
FG.DCH_BASE     = null;     // base class from which ALL DocComponentHandlers must inherit from
FG.docVersion   = [0, 0, 0];    // when a doc is loaded it's "VER;1.2.3;" header is placed here
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

