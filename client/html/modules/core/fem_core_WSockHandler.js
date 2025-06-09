// globalThis.WS = {} is defined already.  (see index.js or server.js)

import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";

WS.__waitList = {};  // dict of packetId: [TimeInserted, callback]
WS.__waitBatch = {};    // dict of batch response keys to waitfor 

export async function init() {          // load, init, and establish connection to client before returning (RSTODO RSFIX could fail if remote!)
    return new Promise((resolve, reject) => {
        let wsProtocol = "ws";
        let wsHost     = location.host;


        if (location.protocol == "https:") {
            wsProtocol = "wss";
        }
        const wsUrl = wsProtocol + "://" + wsHost + "/" + WS.wssPort;

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

        WS.sendExpect = async (pkt, callback, context=undefined) => {     // send packet and expect a response, fire callback(pkt) which MAY BE A 'new Error()' !
            WS.__waitList[pkt.__id] = {name:pkt.constructor.name, date:Date.now(), callback:callback, context};
            WS.send(pkt);
        }

        WS.sendBatchExpect = async (pkt, key, callback, context=undefined) => {
            const batchKey = `${pkt.constructor.name}:${key}`;
            pkt.__key = key;
            WS.__waitBatch[batchKey] =  {name:pkt.constructor.name, date:Date.now(), callback:callback, context};
        }
        WS.sendWait = async (pkt) => {
            return new Promise((resolve, reject) => {
                WS.__waitList[pkt.__id] = {date:Date.now(), resolve:resolve, reject:reject };
                WS.send(pkt);
            });
        }
    });
};

WS.clearExpectByName = (pName) => {   // removeAll packets named pName from WS.__waitList
    const keys = Object.keys(WS.__waitList);
    for (const key of keys) {
        if (WS.__waitList[key].name == pName) {
            delete WS.__waitList[key]
        }
    }
}

WS.clearBatchExpect = (pktName, key) => {
    delete WS.__waitBatch[`${pktName}:${key}`];
}


function process(buf) {     // this function must not await, anything that happens in here must be asynchronous
    buf = new Uint8Array(buf);
    const dec = new DFDecoder(buf);
    buf = dec.decode();
    
    const pkt = WS.parsePacket(buf);

    if ("__r" in pkt) {                     // is it a response packet?
        if (pkt.__id in WS.__waitList) {    // is it in waitList?  if not, probably timed out
            const entry = WS.__waitList[pkt.__id]
            delete WS.__waitList[pkt.__id];
            if (entry.resolve) {                // if sendWait response
                entry.resolve(pkt);        
            } else if (entry.callback) {        // if sendExpect response
                entry.callback(pkt, entry.context);
            }
        } else {
            debugger; if (pkt.__key) {    // if it has a __key, it's a batchResponse packet
                const key = pkt.constructor.name + ":" + pkt.__key;
                if (key in WS.__waitBatch) { // found a batch wait'er
                    const entry = WS.__waitBatch[key];
                    delete WS.__waitBatch[key];
                    entry.callback(pkt, entry.context);   // can ONLY support sendExpect response,  not sendWait!
                }
            }
        }
    } else {
        pkt.process();
    }
}
