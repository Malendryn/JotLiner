
// const path = require("path");



async function start() {
    function loadModule(modulePath, autoInit = false) {       // load a module, exit and shutdown with errmsg if fails
        return new Promise((resolve, reject) => {
            import(modulePath)
            .then(async (response) => {
                if (autoInit) {
                    await response._init();
                }
                resolve(response);
                return response;
          }).catch(err => {
                console.log(`*** FAILED TO LOAD module '${modulePath}' ***  err='${err}'`);
                process.exit(1);
            }).finally(() => {
            });
        });
    }
    await loadModule("./modules/core/ssm_core_Globals.js", true);      // load globals first, cuz everything lives off globals, and connect it to globalThis.SG
    await loadModule("./modules/core/ssm_core_Functions.js", true);    // load functions next, and connect it to globalThis.SF
    SF.loadModule = loadModule;                              // ...and then we attach the loadModule funcall above to SF so other modules can use it too

  // SG.dbRoot = path.join(__dirname, "db");
  // await SG.loadModule("./modules/ssm_Functions.mjs");

  // await SF.loadModule("./modules/db_sqlite3/bem_dbBASE.mjs");
  // await SF.loadModule("./modules/db_sqlite3/bem_db_server.mjs");

    let module = await SF.loadModule("./modules/core/ssm_core_WebSockHandler.js");
    module._init(8888);   // fire up websocket server

    // now we just sit back and let websockets handle everything from here on in
}

start();

