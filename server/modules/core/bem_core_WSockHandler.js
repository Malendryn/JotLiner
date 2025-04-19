BG.connections = [];

export async function init() {                      // load, init, and establish wss before returning
    return new Promise(async (resolve, reject) => {
        const module = await import("ws");
        const wss = new module.WebSocketServer( { server: BG.httpServer });

        wss.on('connection', (ws) => {      
            console.log('Client connected');
            BG.connections.push(ws);                // add connection to an array for global msging

            ws.on('message', (message) => {
                console.log(`Received: ${message}`);

                // Broadcast the message to all connected clients
                wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === WebSocket.OPEN) {
                        client.send(`Server: ${message}`);
                    }
                });
            });

            ws.on('close', () => {                  // remove connection from array
                console.log('Client disconnected');
                const idx = BG.connections.indexOf(ws);
                BG.connections.splice(idx, 1);
            });

            // Send a welcome message to the client
            ws.send('Welcome to the WebSocket server!');
        });
    
        console.log(`WebSocket server started on port ${BG.wssPort}`);
        resolve(this);
        return;
    });
}

