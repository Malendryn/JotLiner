// globalThis.WS = {} must be defined already.  (see index.js or server.js)

export async function init() {                      // load, init, and establish wss before returning
    return new Promise(async (resolve, reject) => {
        const module = await import("ws");
        const wss = new module.WebSocketServer( { server: WS.httpServer });

        wss.on('connection', (ws) => {      
            console.log('Client connected');

            ws._id = ++BG.nextWSockId;  // starts as 0 so increment before attaching
            const client = {
                ws:     ws,
                dbName: null,   // client's currently selected db, or null if none
                db:     null,   // handle to open db, or null if dbName is null
            };
            BG.clients.set(ws, client);

            ws.on('close', () => {                  // remove connection from array
                console.log('Client disconnected');
                const client = BG.clients.get(ws);
                BF.releaseDB(client);
                BG.clients.delete(ws);
            });

            ws.on('message', (data) => {                // incoming data (packet)
                data = data.toString('utf-8');          // apparently 'data' is now ALWAYS a Buffer so we must ALWAYS convert it

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
    const stream = JSON.stringify(pkt);
    const ss = pkt.constructor.name + "|" + stream;
    ws.send(ss);
}


async function process(ws, data) {
    const client = BG.clients.get(ws);

    const pkt = WS.parsePacket(data);
    const response = await pkt.process(client);  
    if (response) {
        response.__id = pkt.__id;       // put original id into response packet
        response.__r = 1;               // and add '__r' so client knows without doubt this is a response packet
        WS.send(ws, response);
    }
}


BF.onChanged = (ws, dict) => {
    const pkt = new WS.__classes.Changed();
    pkt.dict = dict;
    for (const client of BG.clients.values()) {
        if (ws != client.ws) {      // don't send this packet to 'self' as we are the ones who made the change!
            WS.send(client.ws, pkt);
        }
    }
};
