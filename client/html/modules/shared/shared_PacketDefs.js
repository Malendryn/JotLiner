// globalThis.WS = {} is defined already.  (see index.js or server.js)

WS.__classes = {};    // these HAVE to go on FG cuz they get lost when we exit loadModule EVEN THO they're only ever used in THIS module
WS.__nextNewPacketID = 1;   // likewise with this var


WS.registerPacketClass = function(clazz) {
    WS.__classes[clazz.name] = clazz;
}


WS.makePacket = function(name)  {
    const pkt = new WS.__classes[name]();   // DO NOT set __id in 'new' cuz .parsePacket will overwrite it
    pkt.__id = WS.__nextNewPacketID++;      // set and increment it here, instead
    return pkt;
}


WS.parsePacket = function(stream) {         // decode "className|{dict}" into actual packet
    const idx = stream.indexOf('|');
    const name = stream.substring(0, idx);
    const tmp = stream.substring(idx + 1);
    const dict = JSON.parse(tmp);
    const pkt = new WS.__classes[name]();   // create new packet WITHOUT incrementing __id
    Object.assign(pkt, dict);               // copy all stream's dictEls onto packet
    return pkt;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////// class definitions go below this line (also see example right below PacketBASE) /////////////
class PacketBASE {
    __id;       // uniquely generated number used for packets expecting a response
//  __r = 1;    // auto-added when a packet is sent back as a return packet (see bem_core_WSockHandler.js)

    process() {}    // override via SubClass.prototype.process() in SEPERATE client/server handler files!
                    //    (see bem_core_PacketHandlers.js)
                    // returns pkt to return to client OR new Error() OR null if nothing going back
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////Packets/////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// see bem_core_PacketHandlers.js for the CLASS.prototype.process(){} backend overrides for these classes

WS.registerPacketClass(class Fault extends PacketBASE { // if error thrown, it's sent back as a Fault
    msg;        // <-- "msg" indicating what the fault was
});


WS.registerPacketClass(class GetExtra extends PacketBASE { // get any element from extra table
    txt;        // --> "key" on the way in
                // <-- "value" on the way back
});


// see index.js
WS.registerPacketClass(class GetDCHList extends PacketBASE { // get list of all available DocComponentHandlers
    list;       // <--  ["DOC","BOX"] etc... 
});


// see fem_core_divIndexViewHandler.js
WS.registerPacketClass(class GetDocTree extends PacketBASE { // get docTree table contents
    list;       // <-- [{id,name,docId,listOrder,parent}[,{}...]] etc... 
});
WS.registerPacketClass(class GetDoc extends PacketBASE {    // load a doc from the db via its uuid
    uuid;       // -->  uuid of doc to get 
                // <-- uuid of doc returned
    doc;        // <-- doc-as-string (possibly uuencoded) OR RSTODO we wrap this in a toJSON and fromJSON
});
WS.registerPacketClass(class NewDoc extends PacketBASE {    // load a doc from the db via its uuid
    dict;       // --> {name,uuid,listOrder,parent,doc}
// <-- returns with a GetDocTree packet instead of this one!
});
