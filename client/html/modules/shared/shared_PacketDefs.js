
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


WS.parsePacket = function(pair) {         // decode ["className", pktData{} into actual packet
    let [name,dict] = pair;
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
//                B<-F means frontend sending to backend
//                B->F means backend sending/responding to frontend 
//
// note that under the 'updated' packet structure, classes when defined have NO properties in them!  They must be added
// during packet building
//
// if a property was sent during transmission, but is not relevant on the return trip, then it will be removed by the 
// backend.  using GetExtra as an example, (only 'key' is set before sending, and is then deleted by the handler 
// before returning,  and MAY add 'value' property, but only if 'key' was found

WS.registerPacketClass(class Fault extends PacketBASE { // if error thrown, it's sent back as a Fault
constructor(){super();debugger;} //    msg;        // <-- "msg" indicating what the fault was
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class GetBackendInfo extends PacketBASE { // get any element from extra table
    //  version;    // B-->F current software version (since frontend ONLY loads FROM backend, version is always same!)
//  docVersion; // B-->F current highest docversion (that doesn't need a conversion)
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class GetExtra extends PacketBASE { // get any element from extra table
    constructor(){super();debugger;} //  key;        // B<-F "key" on the way in
//  value;      // B->F "value" on the way back or undeclared if key not found
});
WS.registerPacketClass(class SetExtra extends PacketBASE { // get any element from extra table
    constructor(){super();debugger;} //    key;        // B<-F key to set/change
//    val;        // B<-F "value" to set/change to
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class Changed extends PacketBASE {    // Something changed  (serverSend only) sent to all clients
// action;     // B->F  PacketName of packet that caused change (ModDoc,NewDch,DelDB,etc..)
// id;         // B->F  ID of relevant rec in db
// bump        // B->F  bumpVal of relevant rec
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class CreateDB extends PacketBASE {  // Delete a document from the system
    constructor(){super();debugger;} //  name;       // F->B string name of db to create
//  error;      // B->F error string if bad name or null if succeeded
});
WS.registerPacketClass(class SelectDB extends PacketBASE {  // Delete a document from the system
// name;        // B<-F string name of db to select
// err;         // B->F ONLY IF err occurred 
});
WS.registerPacketClass(class DeleteDB extends PacketBASE {  // Delete /CURRENT/ DB from backend
    constructor(){super();debugger;}     text;       // --> nothing, empty, null
                // <-- error string if db not empty, null if successful
});
WS.registerPacketClass(class GetDBList extends PacketBASE {  // Delete /CURRENT/ DB from backend
//  list;       // B-->F array[] of database names (without .db extension)]
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class GetDCHList extends PacketBASE { // get list of all available DocComponentHandlers
    //    list;       // B->F  ["DOC","BOX"] etc... 
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class GetDocTree extends PacketBASE { // get docTree table contents
    //    list;       // B->F [{T.id,T.docUuid,T.listOrder,T.parent,T.bump,D.docName}[,{}...]] etc...  (T=table:docTree, D=table:doc)
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class NewDoc extends PacketBASE {    // create a new doc and insert it into the database
    constructor(){super();debugger;}  // RSREWORK   dict;       // --> {uuid,version,name,listOrder,parent,doc}
// <-- returns with a GetDocTree packet instead of this one!
});
WS.registerPacketClass(class ModDoc extends PacketBASE {    // save  back into the database
    constructor(){super();debugger;}       //    uuid;      // B<-F uuid of doc to mod
//    name;      // B<-F name of doc  or unassigned if name ! changed
//    dcwList;   // B<-F dcwList of connected dcw/dch's or unassigned if dcwList ! changed
//    bump:      // B->F bump# of modded doc
});
WS.registerPacketClass(class DelDoc extends PacketBASE {   // Delete a document from the system
    constructor(){super();debugger;} uuid;       // -->  uuid of doc to get 
});

WS.registerPacketClass(class GetDoc extends PacketBASE {    // load a doc from the db via its uuid
//   uuid;       // B<-F uuid of doc to get 
//   rec;        // B->F {name,dcwList,bump}
});
    
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.registerPacketClass(class NewDch extends PacketBASE {    // adding a new dch to current doc
    constructor(){super();debugger;}//   uuid        // B<-F uuid of doc this belongs to
//   rec         // B<-F {name:"BOX", content:Uint8Array}
//   id          // B->F id of rec that was inserted
//   bump        // B->F bump# of newly inserted dch
});

WS.registerPacketClass(class ModDch extends PacketBASE {    // adding a new dch to current doc
    constructor(){super();debugger;}//   uuid        // B<-F uuid of doc this belongs to
});

WS.registerPacketClass(class DelDch extends PacketBASE {    // adding a new dch to current doc
    constructor(){super();debugger;}//   uuid        // B<-F uuid of doc this belongs to
});

WS.registerPacketClass(class GetDch extends PacketBASE {    // load a doc from the db via its uuid
// id;          // B<--F id of dch rec to fetch
// u8a          // B->F
// bump         // B->F
});

