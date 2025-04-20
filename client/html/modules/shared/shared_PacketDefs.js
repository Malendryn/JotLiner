// globalThis.WS = {} must be defined already.  (see index.js or server.js)

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

    process() {}    // override via SubClass.prototype.process() in SEPERATE client/server handler files!
                    // NOTE THAT on clientside its process() but on serverside its process(ws)
};


/////////////////////////////////Packets//////////////////////////////////////////////////
WS.registerPacketClass(class PacketTest extends PacketBASE {
});

WS.registerPacketClass(class GetDoc extends PacketBASE {
    docId;     // id of doc to get  (filename, uuid, etc...  we're just spitballing right now!)
});

