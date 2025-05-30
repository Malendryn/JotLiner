import express from 'express';
import http from 'http';
// import { WebSocketServer } from 'ws';
import path from 'path';

import { fileURLToPath } from 'url';
import { dirname } from 'path';

//// Absolute minimum to get the ball rolling /////////////////////////////////////////////////////////////////////////
globalThis.BG  = {}; // global 'Backend Globals' variables   (see bem_core_Globals.js for details)
globalThis.BF  = {}; // global 'Backend Functions' functions (see bem_core_Functions.js for details)
globalThis.WS  = {}; // WebSocket and Packet transmit/receive CLASSES, funcs, etc

WS.wssPort = 3000;      // must match wssPort in client/index.js

BG.serverPath = fileURLToPath(import.meta.url);     // "file:///<somewhere>/server/server.js"
BG.serverPath = dirname(BG.serverPath);             // "file:///<somewhere>/server"
BG.basePath = dirname(BG.serverPath);               // "file:///<somewhere>"


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


process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled rejection:', reason);
    // optional: re-init DB or restart app
});
  
process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    // maybe soft-exit or restart
});
  
  
async function start() {
    await BF.loadModule("./modules/core/bem_core_Globals.js");      // load globals first, cuz everything lives off globals, and connect it to globalThis.SG
    await BF.loadModule("./modules/core/bem_core_Functions.js");    // load functions next, and connect it to globalThis.SF

    await getConverters();        // see below

    await BF.loadModule("./modules/core/bem_core_dbHandler.js");

    await BF.loadModule("../client/html/modules/shared/shared_PacketDefs.js");   // load the known SHARED baseline packet definitions
    await BF.loadModule("./modules/core/bem_core_PacketHandlers.js");            // load the serverside handlers for incoming packets
    await BF.loadModule("./modules/core/bem_core_DocExporter.js");               // export doc into latest streamformat
    await BF.loadModule("./modules/core/bem_core_DocExploder.js");               // xplode doc based on version

    const app = express();
    app.use(express.static(path.join(BG.basePath, 'client/html')));

    app.get("./modules/DocComponentHandlers/*", (req, res) => {
        res.sendFile(path.join(BG.basePath, req.path), (err) => {
            if (err) {
                console.error("Could not send requested file:", err);
                res.status(500).send("Could not send requested file:", err);
            }
        });
    });

    app.get("/LICENSE", (req, res) => {
        res.sendFile(path.join(BG.basePath, "LICENSE"), (err) => {
            if (err) {
                console.error("Could not send LICENSE file:", err);
                res.status(500).send("LICENSE file not found");
            }
        });
    });

    app.get("*", (req, res) => {
        console.log("MISSED: " + req.path);
        res.status(500).send(req.path + " not found");
    });

    WS.httpServer = http.createServer(app);
    WS.httpServer.listen(WS.wssPort, () => {
        console.log(`Server listening at http://localhost:${WS.wssPort}`);
    });
    
    await BF.loadModule("./modules/core/bem_core_WSockHandler.js");

    // now we just sit back and let websockets handle everything from here on in
}
await start();


import fs from "fs"; //'node:fs/promises'; <-- this works too
async function getConverters() {
    const dirPath = path.join(BG.serverPath, "modules", "core", "converters");
    const files = await fs.promises.readdir(dirPath, { withFileTypes: true });
  
    BG.converters = [];
    for (const file of files) {
        if (!file.isDirectory()) {
            BG.converters.push(file.name);  // push both 'dbUpdate_nnnnnn-nnnnnn.js' and 'explode_n.n_doc.js'
        }
    }
}