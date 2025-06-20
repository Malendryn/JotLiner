
// globalThis.WS = {} is defined already.  (see index.js or server.js)

import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";

// WS = {}; defined in index.js, NOT here.  WebSocket and Packet transmit/receive CLASSES, funcs, etc

WS.connected       = false;
WS.connId          = 0;        // globalized cuz index.js needs to set it
WS.lastPacketSent;             // used when we receive a broadcast response...

let __nextPacketID    = 1;  // unique id for every packet created
const __waitList      = {}; // dict of packetId: [TimeInserted, resolve, reject]
const __waitBcastList = {}; // dict of packetId: [TimeInserted, resolve, reject]
const __waitBatch     = {}; // dict of batch response keys to waitfor 

function __wsFail() {
    if (!WS.connected) {
        alert("connection failed, refreshing browser");
        location.replace(location.href);
        // throw new Error("connection failed, refreshing browser");  // prevent completing this action
    }
}
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
            WS.connected = true;
            console.log("WebSocket connection opened");
            resolve(this);
            return;
        };

        WS.ws.onmessage = (event) => {
            process(event.data);
        };

        WS.ws.onclose = () => {
            WS.connected = false;
            __wsFail();
            // WS.ws = new WebSocket(wsUrl);       // create a new connection
            // WS.ws.binaryType = 'arraybuffer';   // always force arraybuffer (uint8array)
        };

        WS.send = (pkt) => {
            __wsFail();
            WS.lastPacketSent = pkt;
            let enc = new DFEncoder();
            const stream = enc.encode([pkt.constructor.name, pkt]);
            WS.ws.send(stream);
        }

        WS.sendExpect = async (pkt, callback, context=undefined) => {
            __wsFail();
            __waitList[pkt.__id] = {name:pkt.constructor.name, date:Date.now(), callback:callback, pkt, context};
            WS.send(pkt);
        }
        // WS.sendBatchExpect = async (pkt, key, callback, context=undefined) => {
        //     __wsFail();
        //     const batchKey = `${pkt.constructor.name}:${key}`;
        //     pkt.__key = key;
        //     __waitBatch[batchKey] =  {name:pkt.constructor.name, date:Date.now(), callback:callback, pkt, context};
        //     WS.send(pkt);
        // }
        WS.sendWait = async (pkt, context=undefined) => {
            __wsFail();
            return new Promise((resolve, reject) => {
                __waitList[pkt.__id] = {date:Date.now(), resolve:resolve, pkt, context};
                WS.send(pkt);
            });
        }
        WS.sendWaitBroadcast = async (pkt, context=undefined) => {
            __wsFail();
            return new Promise((resolve, reject) => {
                __waitBcastList[pkt.__id] = {date:Date.now(), resolve:resolve, pkt, context };
                WS.send(pkt);
            });
        }
    });
};

WS.clearExpectByName = (pName) => {   // removeAll packets named pName from __waitList
    const keys = Object.keys(__waitList);
    for (const key of keys) {
        if (__waitList[key].name == pName) {
            delete __waitList[key]
        }
    }
}

WS.clearBatchExpect = (pktName, key) => {
    delete __waitBatch[`${pktName}:${key}`];
}

WS.makePacket = function(name, dict = undefined)  {
    try {
        const pkt = new WS.classes[name]();   // DO NOT set __id in 'new' cuz .parsePacket will overwrite it
        pkt.__id = WS.connId + ":" + __nextPacketID++;       // set and increment it here, instead
        if (dict) {
            Object.assign(pkt, dict);
        }
        return pkt;
    } catch (err) {
        console.log("Could not create packet '" + name + "'; reason: " + err.message);
    }
}

function process(buf) {     // this function must not await, anything that happens in here must be asynchronous
    buf = new Uint8Array(buf);
    const dec = new DFDecoder(buf);
    buf = dec.decode();
    
    const pkt = WS.parsePacket(buf);

    if ("__r" in pkt) {                     // is it a response packet?
        if (pkt.__id in __waitList) {    // is it in waitList?  if not, probably timed out
            const entry = __waitList[pkt.__id]
            delete __waitList[pkt.__id];
            WS.lastPacketSent = entry.pkt;
            if (entry.resolve) {                // if sendWait response
                entry.resolve(pkt);        
            } else if (entry.callback) {        // if sendExpect response
                entry.callback(pkt, entry.context);
            }
        } else {
            if (pkt.__key) {    // if it has a __key, it's a batchResponse packet
                const key = pkt.constructor.name + ":" + pkt.__key;
                if (key in __waitBatch) { // found a batch wait'er
                    const entry = __waitBatch[key];
                    delete __waitBatch[key];
                    WS.lastPacketSent = entry.pkt;
                    entry.callback(pkt, entry.context);   // can ONLY support sendExpect response,  not sendWait!
                }
            }
        }
    }  else if (pkt.__id in __waitBcastList) {  // if it is a broadcast we were waiting for...
        const entry = __waitBcastList[pkt.__id]
        delete __waitBcastList[pkt.__id];
        WS.lastPacketSent = entry.pkt;
        pkt.onPktRecvd();                       // process the broadcast normally before resolving
        entry.resolve();                        // send nothing back
    } else {
        pkt.onPktRecvd();
    }
}
