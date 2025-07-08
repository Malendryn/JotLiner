import { DFWebSocketClient, DFWebSocketServer } from "./DFWebSocketHandler.mjs"


class PacketBase {
    _cid;  // client pairing Id, DFWSPacketClient.clientId  -- originating clientId
    _pid;  // packetId, incremented every time a packet is created
    _r;    // exists only if this is a response packet
    _b;    // exists only if this is a broadcast packet
};


class DFWSPacketClient extends DFWebSocketClient {
    connect = async(endpt) => {
        debugger; await super.connect(endpt);
    }
    close = async(endpt) => {
        debugger; await super.close();
    }
    reset = async() => {
        debugger; super.reset();
        this.#packetId = 1;
    }
    send = async(pkt) => {
        debugger; pkt._cid = this.clientId;
        pkt._pid = this.#packetId++;
        super.send(pkt);
    }
    #packetId;
};


class DFWSPacketServer extends DFWebSocketServer {
    async onClose(wsc) {
        debugger; super.onClose(wsc);
    }
    onMessage = async (wsc, msg) => {
        debugger; super.onMessage(wsc, msg);
    }
    async start(wss) {
        debugger; super.start(wss, DFWSPacketClient);
    }
    constructor(dict) {
        debugger; if ("onMessage" in dict) { this.#onMessage = dict.onMessage; }
        dict.onMessage = this.onMessage;
        super(dict);
        
        // ... I dont think we'll need to worry about onopen/close at the packetserver level
        // if ("onOpen"    in dict) { this.#onOpen = dict.onOpen;       } 
        // if ("onClose"   in dict) { this.#onClose = dict.onClose;     }
        if ("onMessage" in dict) { this.#onMessage = dict.onMessage; }
    }
    // #onOpen      = null;
    // #onClose     = null;
    #onMessage   = null;
};
export { DFWSPacketHandler };


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//* begin test  (client)
import { trace, trace2, trace3 } from "./DFTracer.mjs";

async function client_test() {
    function onOpen(wsc) {
        trace("client_test: onOpen wscId=",wsc.clientId);
        console.log("start: sending counter=1");
        wsc.send({counter:1 });
        }
    function onClose(wsc) {
        trace("client_test: onClose wscId=",wsc.clientId, ", closed by", wsc.closedBy);
    }
    function onMessage(wsc, msg) {
        if ("counter" in msg) {
            console.log("client_test: onMessage wscId=",wsc.clientId, "  counter=", msg.counter);
            if (msg.counter < 1000) {
                msg.counter += 1;
                wsc.send(msg);
            } else {
                console.log("client issued close()");
                wsc.close();
            }
        } else {
            console.log("client_test: onMessage wscId=",wsc.clientId, "  msg=", msg);
        }
    }
    
    const wsc = new DFWSPacketClient({onOpen, onClose, onMessage});
    wsc.send("foo")  // not connected,  should throw
    .catch((err) => {  // (wsc.send returns a promise, so must use .catch() instead of try/catch
        console.log('wsc.send("Foo") error caught successfully');
    });
    await wsc.connect(3000);
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// begin test  (server)

function server_test(wssModule, httpServer) {
    function onOpen(wsc) {
        trace("server_test: onOpen wscId=",wsc.clientId);
        wsc.send({txt:"testing!"}); // server can send here cuz clientId is established
    }
    function onClose(wsc) {
        trace("server_test: onClose wscId=",wsc.clientId, ", closed by", wsc.closedBy);
    }
    function onMessage(wsc, msg) {
        if ("counter" in msg) {
            console.log("server_test: onMessage wscId=",wsc.clientId, "  counter=", msg.counter);
            if (msg.counter < 1000) {
                msg.counter += 1;
                wsc.send(msg);
            } else {
                console.log("server issued close()");
                wsc.close();
            }
        } else {
            trace("server_test: onMessage wscId=",wsc.clientId, "  msg=", msg);
        }
    }
    let wss = new wssModule.WebSocketServer({server:httpServer});
    WS.tmp = new DFWSPacketServer({onOpen, onClose, onMessage});
    WS.tmp.start(wss);                  // test uses external globalRef to my express httpServer      
}

export {client_test, server_test};
/*end test*/
