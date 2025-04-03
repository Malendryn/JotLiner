

// this could have been done as toplevel code instead of via init() but I wanted to test init out
export async function init() {
    return new Promise(async (resolve, reject) => {
        const wsUrl = "ws://localhost:3000";
        console.log("WebSocket connecting to ", wsUrl, "...");
        
        FG.ws = new WebSocket(wsUrl);                   // Connect to the same port as the Express server
        
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
            debugger;
            FG.ws.send(packet);
        }

        resolve(this);
        return;
        // reject(err); // ifError
        // return;
    });
};

