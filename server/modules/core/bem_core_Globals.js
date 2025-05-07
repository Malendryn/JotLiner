
// name----------val-----------Description-------------------------------------------------------
// ==== FROM server.js ================================================================================================
// BG.basePath  = "";       // path of where server.js resides  (eg:  /mnt/local/git/project.jotliner/server)
// ==== FROM bem_core_Globals.js ======================================================================================
// ==== FROM bem_core_WSockHandler.js =================================================================================

BG.basePath;                // "file:///<somewhere>"            // use this to pathover to /client
BG.serverPath;              // "file:///<somewhere>/server"     // where server.js exists
BG.db;                      // handle to the opened DBIO handler  (see bem_core_dbHandler.js)
BG.clients          = [];   // array of connected clients and statuses
BG.nextWSockId      = 0;    // attached-then-incremented to each new ws connectiona as ws._id

//  BG.wss          =  null,  // WebSocketServer

// export async function init() {
//     debugger;
// }
