
// name----------val-----------Description-------------------------------------------------------
// ==== FROM fem_core_Globals =========================================================================================
// FG.baseURL   = "";       // for backend this is __filename, for frontend this is 'http://site:port'
// FG.__dirname   
// ==== FROM fem_core_WSockHandler ====================================================================================
FG.VERSION; //  ="1.0";     // SET AT TOP OF "index.js", NOT HERE !!!!  (used to compare and upgrade docs when loading)

FG.baseURL       = window.location.origin;  // EG: "http://localhost:3000"

FG.ws            = null;     // WebSocket connector to localServer      (see fem_core_WSockHandler.js)

FG.DCH_BASE      = null;     // BASECLASS from which ALL DocComponentHandlers must inherit from

FG.docTree       = [];       // [{id,uuid,name,listOrder,parent,li}[,...]] ordered list of .dia "docTree" table
                                // note that li is not from the db but is added during showDocTree()

FG.curDBName     = "";       // "" or currently selected DB name (localStorage = "lastDBDoc:<curDBname>:<curDoc.uuid>")
FG.curDoc        = null;     // null or dict{ uuid, rootDch, dirty }

FG.DocImporter   = null;     // CLASS to import a stringstream into a doc (see fem_core_DocImporter.js)
FG.DocExporter   = null;     // CLASS to export a doc to a stringstream   (see fem_core_DocExporter.js)

FG.kmStates      = {};       // kbd and mouse states at any instant in time (see fem_core_TKMEvtHandlers.js)

// FIX setMouseState()  get rid of setting of FG.kmStates.dch
