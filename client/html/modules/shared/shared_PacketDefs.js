// globalThis.WS = {} is defined already.  (see index.js or server.js)

WS.__classes = {};    // these HAVE to go on FG cuz they get lost when we exit loadModule EVEN THO they're only ever used in THIS module
WS.__nextNewPacketID = 1;   // likewise with this var


WS.registerPacketClass = function(clazz) {
    WS.__classes[clazz.name] = clazz;
}


WS.makePacket = function(name)  {
    const pkt = new WS.__classes[name](); // DO NOT set __id in 'new' cuz .parsePacket doesnt need a new __id
    pkt.__id = WS.__nextNewPacketID++;          // set and increment it here, instead
    return pkt;
}


WS.parsePacket = function(stream) {         // decode "className|{dict}" into actual packet
    const idx = stream.indexOf('|');
    const name = stream.substring(0, idx);
    const tmp = stream.substring(idx + 1);
    const dict = JSON.parse(tmp);
    const pkt = new WS.__classes[name]();
    Object.assign(pkt, dict);
    return pkt;
}


////////////////////////// class definitions go below this line (also see example right below PacketBASE) /////////////
class PacketBASE {
    __id;       // uniquely generated number used for packets expecting a response
//  __r = 1; // auto-added when a packet is sent back as a return packet

    process() {}    // override via SubClass.prototype.process() in SEPERATE client/server handler files!
                    //    (see bem_core_PacketHandlers.js)
                    // returns pkt to return to client OR new Error() OR null if nothing going back
};


/////////////////////////////////Packets//////////////////////////////////////////////////
WS.registerPacketClass(class Fault extends PacketBASE {
    msg;    // msg indicating what the fault was
});

WS.registerPacketClass(class GetDoc extends PacketBASE {
    docId;     // <->  id/name/uuid of doc to get
    doc;       // <--  doc-as-string (possibly uuencoded) OR RSTODO we wrap this in a toJSON and fromJSON
});

