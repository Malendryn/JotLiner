// globalThis.WS = {} is defined already.  (see index.js or server.js)

import { DFEncoder,DFDecoder } from "/modules/shared/DFCoder.mjs";   // load the known SHARED baseline packet definitions

WS.__waitList = {};  // dict of packetId: [TimeInserted, callback]


export async function init() {          // load, init, and establish connection to client before returning (RSTODO RSFIX could fail if remote!)
    return new Promise((resolve, reject) => {
        const wsUrl = "ws://localhost:" + WS.wssPort;
        console.log("WebSocket connecting to ", wsUrl, "...");
        
        WS.ws = new WebSocket(wsUrl);               // Connect to the same port as the Express server  RSTODO RSFIX retry if fail
        WS.ws.binaryType = 'arraybuffer';           // always force arraybuffer (uint8array)

        WS.ws.onopen = () => {
            console.log("WebSocket connection opened");
            resolve(this);
            return;
        };

        WS.ws.onmessage = (event) => {
            process(event.data);
        };

        WS.ws.onclose = () => {
            console.log("WebSocket connection closed, reconnecting...");
            WS.ws = new WebSocket(wsUrl);             // RE-Connect...
        };

        WS.send = (pkt) => {
            let enc = new DFEncoder();
            const stream = enc.encode([pkt.constructor.name, pkt]);
            WS.ws.send(stream);
        }

        WS.sendExpect = async (pkt, callback) => {     // send packet and expect a response, fire callback(pkt) which MAY BE A 'new Error()' !
            WS.__waitList[pkt.__id] = {date:Date.now(), callback:callback};
            WS.send(pkt);
        }

        WS.sendWait = async (pkt) => {
            return new Promise((resolve, reject) => {
                WS.__waitList[pkt.__id] = {date:Date.now(), resolve:resolve, reject:reject };
                WS.send(pkt);
            });
        }
    });
};


function process(buf) {
    buf = new Uint8Array(buf);
    const dec = new DFDecoder(buf);
    buf = dec.decode();
    
    const pkt = WS.parsePacket(buf);

    if ("__r" in pkt) {                     // is it a response packet?
        if (pkt.__id in WS.__waitList) {    // is it in waitList?  if not, probably timed out
            const entry = WS.__waitList[pkt.__id]
            delete WS.__waitList[pkt.__id];
            if (entry.resolve) {
                entry.resolve(pkt);
            } else if (entry.callback) {
                entry.callback(pkt);
            }
        }
    } else {
        pkt.process();        
    }
}