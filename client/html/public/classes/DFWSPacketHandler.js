
class DFWebSocketClient {       // WebSocketClient
// public values       ////////////////////////////////////////////////////////////////////////////////////////////////
//    bool connected   // T/F 
//    clientId         // 0 when not connected, else retrieved from server when connection handshake finished

// public functions: ( see prototypes below) //////////////////////////////////////////////////////////////////////////
// ****** ***** constructor(onConnFail)
// ------ await connect(endpt=undefined)  // open+connect websocket and perform initial handshake
                                          // endpt must be undefined to use existing default port
                                          //   or an integer number to connect to current host but override port
                                          //   or a full URL of the form "ws://addr/port" or "wss://addr/port"
// ------ await close()                   // close, flush all buffers, cleanup and reset

    get connected()  { return this.#connected; }
    get clientId()   { return this.#clientId;  }


    // #lastPacketSent;             // used when we rcv broadcast response...  RSTODO change to ONLY be pktId cuz hugeData(use context for data instead)

    #connected     = false;
    #clientId      = 0;        // 0 if not connected, else int fetched from server
    #nextPacketID  = 1;        // unique id for every packet created
    #waitList      = {};       // dict of packetId: [TimeInserted, resolve, reject]
    #ws            = null;     // handle to actual websocket engine
    #isServerSide  = false;
    #onConnFail    = null;     // callback when connection closes unexpectedly or otherwise fails

    #errMsg(msg)     { return `Attempt to set readonly property '${msg}'` }
    set connected(v) { throw new Error(this.#errMsg("connected"));        }
    set clientId(v)  { throw new Error(this.#errMsg("clientId"));         }

    connect = async(endpt) => {
        return new Promise((resolve, reject) => {
            if (typeof endpt === "number") {         // connect to current host
                let wsProtocol = (location.protocol === "https:") ? "wss" : "ws";
                endpt = wsProtocol + "://" + location.hostname + ":" + endpt;
            } else if (typeof endpt !== "string") {
                throw new Error("endpoint must be a portnumber or a full ws or wss URL");
            }
            console.log("WebSocket connecting to", endpt, "...");
            
            this.#ws = new WebSocket(endpt);             // Connect to the same port as the Express server  RSTODO RSFIX retry if fail
            this.#ws.binaryType = 'arraybuffer';         // always force arraybuffer (uint8array)

            this.#ws.onopen = () => {
                this.#connected = true;
                console.log("WebSocket connection opened");
                return resolve();
            };

            this.#ws.onmessage = (event) => {
                debugger; if (this.clientId === 0 && !this.isServerSide) {   // very first msg received (by clients only) MUST be clientId
                    this.clientId = event.data;
                    return;
                }
                this.#process(event.data);
            };

            this.#ws.onclose = () => {
                debugger; this.close();
            };

            // this.send = (pkt) => {
            //     this.#onConnFail(this);
            //     let enc = new DFEncoder();
            //     const stream = enc.encode([pkt.constructor.name, pkt]);
            //     this.#ws.send(stream);
            // }

            // this.sendExpect = async (pkt, callback, context=undefined) => {
            //     this.#onConnFail(this);
            //     __waitList[pkt.__id] = {name:pkt.constructor.name, date:Date.now(), callback:callback, pkt, context};
            //     this.send(pkt);
            // }
            // this.sendWait = async (pkt, context=undefined) => {
            //     this.#onConnFail(this);
            //     return new Promise((resolve, reject) => {
            //         __waitList[pkt.__id] = {date:Date.now(), resolve:resolve, pkt, context};
            //         this.send(pkt);
            //     });
            // }
            // this.sendPkt = async (dict) => {   // dict={pkt:reqd, callback:optional, context:optional} 
            //     if (!this.connected) {
            //         alert("connection failed, refreshing browser");
            //     }
            //     this.#onConnFail(this);
            // }
        });
    }
    
    close = async() => {
        if (this.#ws) {
            this.#ws.close();
        }
        this.#connected = false;
        this.#clientId  = 0;
        this.#nextPacketID = 0;
    //RSTODO flush this.#waitList and send abort to any waiting requestors
        this.#ws = null;
    }


    #process = (u8a) => {
        debugger;
    }


    constructor(onConnFail, isServerSide=false) {
        this.#onConnFail = onConnFail;
        this.#isServerSide = isServerSide;
        this.close();
    }
};
class DFWebSocketServer {      // WebSocketServer

};
export {DFWebSocketClient, DFWebSocketServer};


if (1) {
    if (typeof process == "undefined") {        //test suite, client side
        let wsc = new DFWebSocketClient(onConnFail);
        debugger; await wsc.connect(3000);
        debugger;
    } else {                                    // test suite, server side
        debugger; let wss = new DFWebSocketServer(3000);    // port to listen on
        
    }

    function onConnFail(wsc) {
        location.replace(location.href);        // forces a page reload
    }
}