
// name----------val-----------Description-------------------------------------------------------
// ==== FROM fem_core_Globals =========================================================================================
// FG.baseURL   = "";       // for backend this is __filename, for frontend this is 'http://site:port'
// FG.__dirname   
// ==== FROM fem_core_WSockHandler ====================================================================================
// FG.VERSION       = "n.n.n"; now fed from server at connectTime
// FG.DOCVERSION    = "n.n";   now fed from server at connectTime

FG.baseURL       = window.location.origin;  // EG: "http://localhost:3000"

FG.ws            = null;     // WebSocket connector to localServer      (see fem_core_WSockHandler.js)

FG.defaultToolbarHeight = 0; // pulled from index.css:#divToolbar.height at index.js init

FG.curDbName     = "";       // "" or currently selected DB name  ("" cuz localStorage only stores strings)
FG.docTree       = [];       // [{id,uuid,name,listOrder,parent,li}[,...]] ordered list of .dia "docTree" table
                                // note that li is not from the db but is added during showDocTree()
FG.curDoc        = null;     // "" or dict{ uuid, name, rootDcw }

FG.DocAttacher   = null;     // CLASS to import a stringstream into a doc (see fem_core_DocAttacher.js)
FG.DocExtracter  = null;     // CLASS to extract current loaded doc for saving/exporting  (see fem_core_DocExtracter.js)

FG.kmStates      = {};       // kbd and mouse states at any instant in time (see fem_core_DocViewHandler.js)
