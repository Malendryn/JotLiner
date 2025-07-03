
import { DFLocker            } from "./DFLocker.mjs";
import { DFEncoder,DFDecoder } from "./DFCoder.mjs";

class DFWebSocketClient {
// public values       ////////////////////////////////////////////////////////////////////////////////////////////////
//    bool  connected   // T/F 
//    int   clientId    // 0 when not connected, else retrieved from server when connection handshake finished
//    wsock ws          // actual websocket object
//    DFWSS svr         // null if opened on clientside, backref to server if opened on serverside

// public functions: ( see prototypes below) //////////////////////////////////////////////////////////////////////////
// ****** *****  constructor( {
//                   onOpen,           // f(this)      called when connection established and id assigned
//                   onClose,          // f(this)      called when connection was closed by the server
//                   onMessage} );     // f(this,msg)  called whenever a message comes in from the other side
// ----- await connect(endpt=undefined)   // open+connect websocket and perform initial handshake
                                            // await is optional (see onOpen in constructor)
                                            // endpt = an integer number to connect to current host but override port
                                            //         or a full URL of the form "ws://addr/port" or "wss://addr/port"
// ----- await  close()                   // close, flush all buffers, cleanup and reset

    get connected()  { return this.#ws !== null; }
    get clientId()   { return this.#clientId;  }
    // get ws()         { return this.#ws;        }
    get svr()        { return this.#svr;       }

    // #lastPacketSent;             // used when we rcv broadcast response...  RSTODO change to ONLY be pktId cuz hugeData(use context for data instead)
    // _waitList      = {};       // dict of packetId: [TimeInserted, resolve, reject]

    connect = async(endpt) => {
        return new Promise(async(resolve, reject) => {
            this.#lockId = await this.#lock.lock(this.#lockId);
            if (typeof endpt === "number") {         // connect to current host
                let wsProtocol = (location.protocol === "https:") ? "wss" : "ws";
                endpt = wsProtocol + "://" + location.hostname + ":" + endpt;
            } else if (typeof endpt !== "string") {
                throw new Error("endpoint must be a portnumber or a full ws or wss URL");
            }
            trace("wsc: connecting to", endpt, "...");
            
            const ws = new WebSocket(endpt);     // Connect to the same port as the Express server  RSTODO RSFIX retry if fail
            ws.binaryType = 'arraybuffer';       // always force arraybuffer (uint8array)

            this._sv_setupWs(ws, null);
            this.#ws.onopen = async () => {      // this is a client-only op so doesnt belong in _sv_setupWs() cuz resolve())
                trace("wsc: connection opened, waiting on handshake");
                return;
            };
            this.#handshakeResolve = resolve;   // WAS here in 'this.#ws.onopen=', NOW here. (see 'this.#ws.onmessage=' for resolver)
            this.#lock.unlock(this.#lockId);
        });
    }
    #handshakeResolve = null;
    close = async() => {
        this.#lockId = await this.#lock.lock(this.#lockId);
        if (this.#ws) {
            if (this.#onClose) {
                try {
                    await this.#onClose(this);    //  call BEFORE .close() to pass id's and states etc before clearing them
                } catch(err) {
                    this.#err = err;
                }
            }
            await this.#ws.close();
        }
        this.reset();
        this.#lock.unlock(this.#lockId);
        this.#checkErr();
    }
    reset = async() => {
        this.#ws           = null;
        this.#clientId     = 0;
    }

    async send(msg) {
        this.#lockId = await this.#lock.lock(this.#lockId);
        if (!this.#ws) {
            this.#err = "Not connected";
        } else if (!this.clientId) {
            this.#err = "Handshake not established";
        } else {
            const encoder = new DFEncoder();
            msg = encoder.encode(msg);
            this.#ws.send(msg);
        }
        this.#lock.unlock(this.#lockId);
        this.#checkErr();
    }

    _sv_setupWs = (ws, svr) => {
        this.#ws = ws;
        ws.DFWSC=this;
        this.#svr = svr;
        this.#ws.onmessage = async (event) => {
            this.#lockId = await this.#lock.lock(this.#lockId);
            const u8a = new Uint8Array(event.data);     // event.data is an ArrayBuffer, we need it as a Uint8Array
            const decoder = new DFDecoder(u8a);
            const data = decoder.decode();
            if (this.#clientId === 0) {   // very first msg received (by clients only) MUST be clientId
                this.#clientId = data.id;
                if (this.#onOpen) {
                    try {
                        await this.#onOpen(this);
                    } catch (err) {
                        this.#err = err;
                    }
                }
                this.#handshakeResolve(); // handshake done, resolve() and fallthrough to unlock
            } else {
                try {
                    await this.#onMessage(this, data);
                } catch (err) {
                    this.#err = err;
                }
            }
            this.#lock.unlock(this.#lockId);
            this.#checkErr();
        };

        this.#ws.onclose = async () => {
            this.#lockId = await this.#lock.lock(this.#lockId);
            await this.close();
            this.#lock.unlock(this.#lockId);
            this.#checkErr();   // in case this.close() set this.#err
        };
    }

    #checkErr() {
        if (this.#err) {
            const err = this.#err;
            this.#err = undefined;
            throw err;
        }
    }

    constructor(dict) {
        if ("onOpen"    in dict) { this.#onOpen = dict.onOpen;         }
        if ("onClose"   in dict) { this.#onClose = dict.onClose;       }
        if ("onMessage" in dict) { this.#onMessage = dict.onMessage;   }
        this.reset();
    }

    #clientId      = 0;        // 0 if not connected, else server/client pairing ID
    #onOpen        = null;
    #onClose       = null;
    #onMessage     = null;
    #ws            = null;     // handle to actual websocket engine
    #svr           = null;     // if created via server, this points back to it
    #lock          = new DFLocker();
    #lockId        = 0;
    #err;

    #errMsg(msg)     { return `Attempt to set readonly property '${msg}'` }
    set connected(v) { throw new Error(this.#errMsg("connected"));        }
    set clientId(v)  { throw new Error(this.#errMsg("clientId"));         }
    set ws(v)        { throw new Error(this.#errMsg("ws"));               }
    set svr(v)       { throw new Error(this.#errMsg("svr"));              }

    _sv_clientId(v)  { this.#clientId = v; }
};

class DFWebSocketServer {       // WebSocketServer
// constructor( {        //   wsc=WebSocketClient object
//     onOpen,           // f(wsc)      called when client established and id assigned
//     onClose,          // f(wsc)      called when client was closed by the server
//     onMessage} );     // f(wsc,msg)  called whenever a message comes in from the client

    async onClose(wsc) {
        this.#lockId = await this.#lock.lock(this.#lockId);
        trace("wss: onClose wscId=" + wsc.clientId);
        if (this.#onClose) {
            try {
                await this.#onClose(wsc);
            } catch(err) {
                this.#err = err;
            }
        }
        delete this.#clients[wsc.clientId];
        this.#lock.unlock(this.#lockId);
        this.#checkErr();
    }

    async onMessage(wsc, msg) {
        this.#lockId = await this.#lock.lock(this.#lockId);
        trace("onMessage wscId=" + wsc.clientId + "  msg=" + msg);
        if (this.#onMessage) {
            try {
                await this.#onMessage(wsc, msg);
            } catch(err) {
                this.#err = err;
            }
        }
        this.#lock.unlock(this.#lockId);
        this.#checkErr();
    }

    #checkErr() {
        if (this.#err) {
            const err = this.#err;
            this.#err = undefined;
            throw err;
        }
    }

    async start(wss) {                         // wss = 'new WebSocketServer({server:yourServerHandle});' or other already opened WebSocketServer
        return new Promise(async (resolve, reject) => {
            wss.on('connection', async (ws) => {
                this.#lockId = await this.#lock.lock(this.#lockId);
                const clientId = this.#nextWSockId++;
                const client = {                    // user can add their client-specific stuff in here
                    id: clientId,
                    ws: new DFWebSocketClient({
                        // onOpen:   this.onOpen.bind(this),      // only for clients, server already handles opening
                        onClose:  this.onClose.bind(this),     // callback to server which in turn callse #onClose()
                        onMessage:this.onMessage.bind(this),   // callback to server which in turn callse #onMessage()
                    }),
//     dbName: null,   // client's currently selected db, or null if none
//     db:     null,   // handle to open db, or null if dbName is null
                };
                client.ws._sv_setupWs(ws, this);    // _sv_ are special overrides to allow server to hijack the client class
                client.ws._sv_clientId(clientId);
                this.#clients[clientId] = client;

                trace("wss: Client connected, wscId=" + clientId);
                this.#clients[clientId] = client;
                client.ws.send({id:clientId});        // send handshake packet and give client it's pairing ID

                if (this.#onOpen) {
                    try {
                        await this.#onOpen(client.ws);
                    } catch(err) {
                        this.#err = err;
                    }
                }
                this.#lock.unlock(this.#lockId);
            });
            trace(`WebSocket server started on port ${WS.wssPort}`);
            resolve(this);
            this.#checkErr();
            return;
        });
    }

    constructor(dict) {
        if ("onOpen"    in dict) { this.#onOpen = dict.onOpen;       }
        if ("onClose"   in dict) { this.#onClose = dict.onClose;     }
        if ("onMessage" in dict) { this.#onMessage = dict.onMessage; }
    }

    #clients     = {};
    #onOpen      = null;
    #onClose     = null;
    #onMessage   = null;
    #lock        = new DFLocker();
    #lockId      = 0;
    #nextWSockId = 1;
    #err;
};
export {DFWebSocketClient, DFWebSocketServer};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//* begin test  (client)
import { trace, trace2, trace3 } from "./DFTracer.mjs";

async function client_test() {
    function onOpen(wsc) {
        trace("client_test: onOpen wscId=",wsc.clientId);
        wsc.send({txt:"testing!"});
    }
    function onClose(wsc) {
        trace("client_test: onClose wscId=",wsc.clientId);
    }
    function onMessage(wsc, msg) {
        trace("client_test: onMessage wscId=",wsc.clientId, "  msg=", msg);
    }
    
    const wsc = new DFWebSocketClient({onOpen, onClose, onMessage});
    wsc.send("foo")  // not connected,  should throw
    .catch((err) => {  // (wsc.send returns a promise, so must use .catch() instead of try/catch
        console.log('wsc.send("Foo") error caught successfully');
    });
    await wsc.connect(3000);
    wsc.send(["foo"]);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// begin test  (server)
function server_test(wssModule, httpServer) {
    function onOpen(wsc) {
        trace("server_test: onOpen wscId=",wsc.clientId);
        wsc.send({txt:"testing!"}); // server can send here cuz clientId is established
    }
    function onClose(wsc) {
        trace("server_test: onClose wscId=",wsc.clientId);
    }
    function onMessage(wsc, msg) {
        trace("server_test:onMessage wscId=",wsc.clientId, "msg=", msg);
    }

    let wss = new wssModule.WebSocketServer({server:httpServer});
    WS.tmp = new DFWebSocketServer({onOpen, onClose, onMessage});
    WS.tmp.start(wss);                  // test uses external globalRef to my express httpServer      
}


export {client_test, server_test};
/*end test*/
