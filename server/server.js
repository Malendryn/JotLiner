import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

//// Absolute minimum to get the ball rolling /////////////////////////////////////////////////////////////////////////
globalThis.BG = {}; // global 'Backend Globals' variables   (see csm_core_Globals.js for details)
globalThis.BF = {}; // global 'Backend Functions' functions (see csm_core_Functions.js for details)

BG.basePath = fileURLToPath(import.meta.url);       // "file:///<somewhere>/server/server.js"
BG.basePath = dirname(BG.basePath);                 // "file:///<somewhere>/server"
BG.basePath = dirname(BG.basePath);                 // "file:///<somewhere>"

BF.loadModule = async (modulePath, exitOnFail = true) => {       // load a module, exit and shutdown with errmsg if fails
    return new Promise(async (resolve, reject) => {
        try {
            const module = await import(modulePath); // Replace with your module path
            if ("init" in module) {
                await module.init();
            }
            resolve(module);
            return;
        } catch (error) {
            debugger; console.error(`*** FAILED TO LOAD module '${modulePath}' ***  err='${error}'`);
            if (exitOnFail) {
                process.exit(1);
            }
            reject(error);
            return;
        }
    });
};

//// END Absolute minimum to get the ball rolling /////////////////////////////////////////////////////////////////////


BG.port = 3000;      // must match port in intex.html's wss port


async function start() {
    await BF.loadModule("./modules/core/bem_core_Globals.js");      // load globals first, cuz everything lives off globals, and connect it to globalThis.SG
    await BF.loadModule("./modules/core/bem_core_Functions.js");    // load functions next, and connect it to globalThis.SF

// RSTODO RSTODO RSTODO RSTODO RSTODO RSTODO RSTODO RSTODO RSTODO RSTODO track all ws connections for broadcasting purposes

  // BG.dbRoot = path.join(__dirname, "db");
  // await BG.loadModule("./modules/bem_Functions.mjs");

  // await BF.loadModule("./modules/db_sqlite3/bem_dbBASE.mjs");
  // await BF.loadModule("./modules/db_sqlite3/bem_db_server.mjs");

    // let module = await BF.loadModule("./modules/core/bem_core_WSockHandler.js");
    // module._init(8888);   // fire up websocket server

    const app = express();
    app.use(express.static(path.join(BG.basePath, 'client/html')));

    const server = http.createServer(app);
    server.listen(BG.port, () => {
        console.log(`Server listening at http://localhost:${BG.port}`);
    });
    
    const wss = new WebSocketServer({ server });
    wss.on('connection', (ws) => {
      console.log('Client connected');
    
      ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        ws.send(`Server: ${message}`);
      });
    
      ws.on('close', () => {
        console.log('Client disconnected');
      });
    
      ws.send('Welcome!');
    });
    
    // now we just sit back and let websockets handle everything from here on in
}

await start();
