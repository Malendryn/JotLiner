
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
console.log("loading", __filename);

// import WebSocket, { WebSocketServer } from 'ws';    

export async function _init(wsPort) {
    const module = await import("ws");
    const wss = new module.WebSocketServer({ port: wsPort }); // Choose your port

    wss.on('connection', (ws) => {
        console.log('Client connected');

        ws.on('message', (message) => {
            console.log(`Received: ${message}`);

            // Broadcast the message to all connected clients
            wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(`Server: ${message}`);
            }
            });
        });

        ws.on('close', () => {
            console.log('Client disconnected');
        });

        // Send a welcome message to the client
        ws.send('Welcome to the WebSocket server!');
    });
  
  console.log('WebSocket server started on port 8080');
}

//return default _init();


