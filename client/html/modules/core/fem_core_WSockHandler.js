

export async function init() {          // load, init, and establish connection to client before returning (RSTODO RSFIX could fail if remote!)
    return new Promise(async (resolve, reject) => {
        const wsUrl = "ws://localhost:" + FG.wssPort;
        console.log("WebSocket connecting to ", wsUrl, "...");
        
        FG.ws = new WebSocket(wsUrl);                   // Connect to the same port as the Express server  RSTODO RSFIX retry if fail
        
        FG.ws.onopen = () => {
            console.log("WebSocket connection opened");
        };
        
        FG.ws.onmessage = (event) => {
            console.log("PktRcvd=", event.data);
        };
        
        FG.ws.onclose = () => {
            console.log("WebSocket connection closed, reconnecting...");
            FG.ws = new WebSocket(wsUrl);               // RE-Connect...
        };

        FG.sendWS = async (packet) => {
            FG.ws.send(packet);
        }

        resolve(this);
        return;
        // reject(err); // ifError
        // return;
    });
};


