
// name----------val-----------Description-------------------------------------------------------
// ==== FROM fem_core_Globals =========================================================================================
// FG.baseURL   = "";       // for backend this is __filename, for frontend this is 'http://site:port'
// FG.__dirname   
// ==== FROM fem_core_WSockHandler ====================================================================================
// FG.VERSION       = "1.2"; now fed from server at connectTime

FG.baseURL       = window.location.origin;  // EG: "http://localhost:3000"

FG.ws            = null;     // WebSocket connector to localServer      (see fem_core_WSockHandler.js)

FG.docTree       = [];       // [{id,uuid,name,listOrder,parent,li}[,...]] ordered list of .dia "docTree" table
                                // note that li is not from the db but is added during showDocTree()

FG.curDBName     = "";       // "" or currently selected DB name (localStorage = "lastDBDoc:<curDBname>:<curDoc.uuid>")
FG.curDoc        = null;     // null or dict{ uuid, rootDch, dirty }

FG.DocAttacher   = null;     // CLASS to import a stringstream into a doc (see fem_core_DocAttacher.js)
FG.DocExtracter   = null;     // CLASS to extract current loaded doc for saving/exporting  (see fem_core_DocExtracter.js)

FG.kmStates      = {};       // kbd and mouse states at any instant in time (see fem_core_DocViewHandler.js)

// FIX setMouseState()  get rid of setting of FG.kmStates.dch
