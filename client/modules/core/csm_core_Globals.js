
// name----------val-----------Description-------------------------------------------------------
// ==== FROM csm_core_Globals =========================================================================================
// FG.baseURL   = "";       // for backend this is __filename, for frontend this is 'http://site:port'
// FG.__dirname   
// ==== FROM csm_core_WSockHandler ====================================================================================
FG.ws           = null;     // WebSocket connector to localServer

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


FG.__baseURL = window.location.origin;  // "http://localhost:3000"
//           = import.meta.url;         // "http://localhost:3000/modules/core/csm_core_Globals.js"


// export async function init() {
//     return new Promise(async (resolve, reject) => {
//         debugger;       //dosomething
//         resolve(this);
//         return;
//         // reject(err); // ifError
//         // return;
//     });
// };

