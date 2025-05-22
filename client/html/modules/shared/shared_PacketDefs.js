// globalThis.WS = {} is defined in index.js or server.js

// WS is defined in server.js AND index.js
WS.classes = {};            // list of all PacketBASE-extending classes below, added via WS.registerPacketClass()
WS.__nextNewPacketID = 1;   // unique id for every packet created


WS.registerPacketClass = function(clazz) {
    WS.classes[clazz.name] = clazz;
}


WS.makePacket = function(name)  {
    const pkt = new WS.classes[name]();   // DO NOT set __id in 'new' cuz .parsePacket will overwrite it
    pkt.__id = WS.__nextNewPacketID++;      // set and increment it here, instead
    return pkt;
}


WS.parsePacket = function(stream) {         // decode "className|{dict}" into actual packet
    const idx = stream.indexOf('|');
    const name = stream.substring(0, idx);
    const tmp = stream.substring(idx + 1);
    const dict = JSON.parse(tmp);
    const pkt = new WS.classes[name]();   // create new packet WITHOUT incrementing __id
    Object.assign(pkt, dict);               // copy all stream's dictEls onto packet
    return pkt;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
class PacketBASE {
    __id;       // unique self-generated number used for all packets sent and usable for comparing on response
//  __r = 1;    // (1 meaning true), auto-added ONLY when sent back to sender as return packet (see bem_core_WSockHandler.js)

    process() {}    // override via SubClass.prototype.process() in SEPERATE client/server handler files!
                    //    (see bem_core_PacketHandlers.js and fem_core_PacketHandlers.js)
                    // server: processes incoming packet
                    //     returns pkt to return to client OR new Fault() if error OR null if nothing going back
                    // client: processes incoming packet
                    //     returns nothing
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////// Packet class definitions go below this line ///////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// see bem_core_PacketHandlers.js for the CLASS.prototype.process(){} backend overrides for these classes

WS.registerPacketClass(class Fault extends PacketBASE { // if error thrown, it's sent back as a Fault
    msg;        // <-- "msg" indicating what the fault was
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class GetExtra extends PacketBASE { // get any element from extra table
    txt;        // --> "key" on the way in
                // <-- "value" on the way back
});
WS.registerPacketClass(class SetExtra extends PacketBASE { // get any element from extra table
    key;        // --> key to set/change
    val;        // --> "value" to set/change to
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class Changed extends PacketBASE {    // Something changed  (serverSend only)
    dict;   // dict containing {what:"something"} and any other data
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// see index.js
WS.registerPacketClass(class GetDCHList extends PacketBASE { // get list of all available DocComponentHandlers
    list;       // <--  ["DOC","BOX"] etc... 
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class GetDocTree extends PacketBASE { // get docTree table contents
    list;       // <-- [{id,name,docId,listOrder,parent}[,{}...]] etc... 
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class GetDoc extends PacketBASE {    // load a doc from the db via its uuid
    uuid;       // -->  uuid of doc to get 
                // <-- uuid of doc returned
    doc;        // <-- doc-as-string (possibly uuencoded) OR RSTODO we wrap this in a toJSON and fromJSON
});
WS.registerPacketClass(class NewDoc extends PacketBASE {    // create a new doc and insert it into the database
    dict;       // --> {uuid,version,name,listOrder,parent,doc}
// <-- returns with a GetDocTree packet instead of this one!
});
WS.registerPacketClass(class SaveDoc extends PacketBASE {    // save doc back into the database
    dict;       // --> {uuid,version,doc}
    uuid;       // -->  uuid of doc to get 
                // <-- uuid of doc returned
    doc;        // <-- doc-as-string (possibly uuencoded) OR RSTODO we wrap this in a toJSON and fromJSON
});
WS.registerPacketClass(class RenameDoc extends PacketBASE {  // Delete a document from the system
    uuid;       // -->  uuid of doc to get 
    name;       // -->  new document name
});
WS.registerPacketClass(class DeleteDoc extends PacketBASE {  // Delete a document from the system
    uuid;       // -->  uuid of doc to get 
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class CreateDB extends PacketBASE {  // Delete a document from the system
    text;       // --> string name of db to create
                // <-- error string if bad name or null if succeeded
});
WS.registerPacketClass(class SelectDB extends PacketBASE {  // Delete a document from the system
    text;       // --> string name of db to select
                // <-- error string if missing or broke,  null if successful
});
WS.registerPacketClass(class DeleteDB extends PacketBASE {  // Delete /CURRENT/ DB from backend
    text;       // --> nothing, empty, null
                // <-- error string if db not empty, null if successful
});
WS.registerPacketClass(class GetDBList extends PacketBASE {  // Delete /CURRENT/ DB from backend
    list;       // --> nothing, empty, null
                // <-- array[] of database names (without .db extension)]
});

