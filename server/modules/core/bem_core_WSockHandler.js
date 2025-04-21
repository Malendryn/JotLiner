// globalThis.WS = {} must be defined already.  (see index.js or server.js)

export async function init() {                      // load, init, and establish wss before returning
    return new Promise(async (resolve, reject) => {
        const module = await import("ws");
        const wss = new module.WebSocketServer( { server: WS.httpServer });

        wss.on('connection', (ws) => {      
            console.log('Client connected');

            ws.on('message', (data) => {
                data = data.toString('utf-8');          // apparently 'data' is now ALWAYS a Buffer so we must ALWAYS convert it
        //      const decoder = new TextDecoder("utf-8");
        //      data = decoder.decode(data);

// start EXAMPLE Broadcast the data to all connected clients !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
                // wss.clients.forEach((client) => {
                //     if (client !== ws && client.readyState === WebSocket.OPEN) {
                //         client.send(`Server: ${data}`);
                //     }
                // });
// end EXAMPLE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

                process(ws, data);      // no await here to prevent bottlenecking
            });

            ws.on('close', () => {                  // remove connection from array
                console.log('Client disconnected');
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
    const pkt = WS.parsePacket(data);
    const response = await pkt.process();  
    if (response) {
        response.__id = pkt.__id;       // put original id into response packet
        response.__r = 1;               // and add '__r' so client knows without doubt this is a response packet
        WS.send(ws, response);
    }
}
