
// name----------val-----------Description-------------------------------------------------------
// ==== FROM server.js ================================================================================================
// BG.basePath  = "";       // path of where server.js resides  (eg:  /mnt/local/git/project.jotliner/server)
// ==== FROM bem_core_Globals.js ======================================================================================
// ==== FROM bem_core_WSockHandler.js =================================================================================

BG.VERSION    = "0.1.2";   // THIS IS SOFTWARE VER ONLY, NOT RELATED TO THE DOCVER!!!!
BG.DOCVERSION = "2.0"      // THIS IS THE CURRENT/LATEST DOCVER that any/every doc must upgrade to immediately on loading

BG.basePath;                // "file:///<somewhere>"            // use this to pathover to /client
BG.serverPath;              // "file:///<somewhere>/server"     // where server.js exists

/////// BG.db;                       // handle to the opened DBIO handler  (see bem_core_dbHandler.js)
/////// BG.clients         = [];     // array of connected clients and statuses

BG.clients     = new Map(); // map of <wsockHandle>: {client} which is currently:
    // const client = {
    //     ws:     ws,     // websocket handle for ease of access
    //     dbName: null,   // client's current db by name (w/o .db extension) ... null if not selected/opened
    //     db:     db,     // handle to open db, or null if dbName is null
    // };

BG.nextWSockId = 0;         // attached-then-incremented to each new ws connectiona as ws._id

BG.openedDBs = {
    // "dbName": {          // for each db open, name is the key here (as per BG.clients above)
    //     db:      null,   // handle to the now-opened db
    //     clients: 0,     // how many connections have this db open
    // },
};


