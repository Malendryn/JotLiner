// globalThis.WS = {} must be defined already.  (see index.js or server.js)

import { DFEncoder, DFDecoder } from "../../../client/html/public/classes/DFCoder.mjs";

let _nextWSockId = 1;    // attached-then-incremented to each new ws connectiona as ws._id
let _sourceId;           // see function process(...) below

export async function init() {                      // load, init, and establish wss before returning
    return new Promise(async (resolve, reject) => {
        const module = await import("ws");
        const wss = new module.WebSocketServer( { server: WS.httpServer });

        wss.on('connection', (ws) => {      
            console.log('Client connected');

            ws._id = _nextWSockId++;  // starts as 0 so increment before attaching
            const client = {
                ws:     ws,
                dbName: null,   // client's currently selected db, or null if none
                db:     null,   // handle to open db, or null if dbName is null
            };
            BG.clients.set(ws, client);

            ws.on('close', () => {                  // remove connection from array
                console.log('Client disconnected');
                const client = BG.clients.get(ws);
                BF.detachDB(client);
                BG.clients.delete(ws);
            });

            ws.on('message', (data) => {                // incoming data (packet)  now ALWAYS DFEncoded
                // data = data.toString('utf-8');          // apparently 'data' is now ALWAYS a Buffer so we must ALWAYS convert it

// start EXAMPLE Broadcast the data to all connected clients !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // wss.clients.forEach((client) => {
                //     if (client !== ws && client.readyState === WebSocket.OPEN) {
                //         client.send(`Server: ${data}`);
                //     }
                // });
// end EXAMPLE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

                process(ws, data);      // no await here to prevent bottlenecking
            });

            // ws.send('Welcome to the WebSocket server!');
        });
    
        console.log(`WebSocket server started on port ${WS.wssPort}`);
        resolve(this);
        return;
    });
}


WS.send = (ws, pkt) => {
    let enc = new DFEncoder();
    const stream = enc.encode([pkt.constructor.name, pkt]);
    ws.send(stream);
}


async function process(ws, buf) {
    buf = new Uint8Array(buf);

    const decoder = new DFDecoder(buf);
    buf = decoder.decode();
    
    const client = BG.clients.get(ws);

    const pkt = WS.parsePacket(buf);
    _sourceId = pkt.__id;  // so when .broadcast() is called it embeds this into it
    const response = await pkt.onPktRecvd(client);  
    if (response) {
        response.__id = pkt.__id;       // put original id into response packet
        response.__r = 1;               // and add '__r' so client knows without doubt this is a response packet
        WS.send(ws, response);
    }
}

WS.batchRespond = (ws, pkt) => {
    pkt.__r = 1;
    WS.send(ws, pkt);
}

WS.fault = function(msg) {
    const pkt = new WS.classes.Fault();
    pkt.msg = msg;
    return pkt;
}


WS.broadcast = function(pktName, dict) {
    const pkt = new WS.classes[pktName]();
    pkt.__id = _sourceId;
    Object.assign(pkt, dict);
    setTimeout( () => {     // cause deferral until originator sendWait/Expect finished so this arrives /after/ 
        for (const client of BG.clients.values()) {
            WS.send(client.ws, pkt);    // send to ALL clients, including originator
        }
    }, 0);
    return null;
};


// WS.broadcast = (pkt, dict) =>  {
//     setTimeout( () => {     // cause deferral until originator sendWait/Expect finished so this arrives /after/ 
//         const name = pkt.constructor.name;
//         pkt = new WS.classes.Changed();
//         pkt.action = name;
//         pkt.dict = dict;
//         for (const client of BG.clients.values()) {
//             WS.send(client.ws, pkt);    // send to ALL clients, including originator
//         }
//     }, 0);
// };
