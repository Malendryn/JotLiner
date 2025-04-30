// globalThis.WS = {} is defined already.  (see index.js or server.js)

WS.__waitList = {};  // dict of packetId: [TimeInserted, callback]


export async function init() {          // load, init, and establish connection to client before returning (RSTODO RSFIX could fail if remote!)
    return new Promise(async (resolve, reject) => {
        const wsUrl = "ws://localhost:" + WS.wssPort;
        console.log("WebSocket connecting to ", wsUrl, "...");
        
        WS.ws = new WebSocket(wsUrl);               // Connect to the same port as the Express server  RSTODO RSFIX retry if fail
        // WS.ws.binaryType = 'arraybuffer';           // always force arraybuffer (uint8array)

        WS.ws.onopen = () => {
            console.log("WebSocket connection opened");
            resolve(this);
            return;
        };
        
        WS.ws.onmessage = (event) => {
            process(event.data);                      // NOTE we use event.data here, but data.toString() on nodeServer! 
        };

        WS.ws.onclose = () => {
            console.log("WebSocket connection closed, reconnecting...");
            WS.ws = new WebSocket(wsUrl);             // RE-Connect...
        };

        WS.send = (pkt) => {
            const stream = JSON.stringify(pkt);
            const ss = pkt.constructor.name + "|" + stream;
            WS.ws.send(ss);
        }

        WS.sendExpect = async (pkt, callback) => {     // send packet and expect a response, fire callback(pkt) which MAY BE A 'new Error()' !
            WS.__waitList[pkt.__id] = [Date.now(), callback];
            WS.send(pkt);
        }

        // resolve(this);       // moved to .onopen()   so we await til its truly open before continuing
        // return;
    });
};



function process(data) {
    const pkt = WS.parsePacket(data);

    if ("__r" in pkt) {                     // is it a response packet?
        if (pkt.__id in WS.__waitList) {    // is it in waitList?  if not, probably timed out
            let callback = WS.__waitList[pkt.__id][1];
            delete WS.__waitList[pkt.__id];
            callback(pkt);
        }
        // if we got here just toss the packet as a timed-out packet
    } else {
        debugger; pkt.process();        
    }
}