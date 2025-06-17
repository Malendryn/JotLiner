
// globalThis.WS = {} is defined in index.js or server.js

// WS is defined in server.js AND index.js
WS.classes = {};            // list of all PacketBASE-extending classes below, added via _register()

function _register(clazz) {
    WS.classes[clazz.name] = clazz;
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
//  __id;       // unique self-generated number used for all B<-F packets sent so sendExpect knows how to expect...
//  __r = 1;    // (1 meaning true), auto-added ONLY when sent back to sender as return packet (see bem_core_WSockHandler.js)

//  onPktRecvd() {} // override via SubClass.prototype.onPktRecvd() in SEPERATE client/server handler files!
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

_register(class Fault extends PacketBASE { // if error thrown, it's sent back as a Fault
constructor(){super();debugger;} //    msg;        // <-- "msg" indicating what the fault was
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class GetBackendInfo extends PacketBASE { // get any element from extra table
    //  version;    // B-->F current software version (since frontend ONLY loads FROM backend, version is always same!)
//  docVersion; // B-->F current highest docversion (that doesn't need a conversion)
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class GetExtra extends PacketBASE { // get any element from extra table
    constructor(){super();debugger;} //  key;        // B<-F "key" on the way in
//  value;      // B->F "value" on the way back or undeclared if key not found
});
_register(class SetExtra extends PacketBASE { // get any element from extra table
    constructor(){super();debugger;} //    key;        // B<-F key to set/change
//    val;        // B<-F "value" to set/change to
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// _register(class Changed extends PacketBASE {    // Something changed  (serverSend only) sent to all clients
// // action;     // B->F  PacketName of packet that caused change (ModDoc,AddDch,DelDB,etc..)
// // id;         // B->F  ID of relevant rec in db
// // bump        // B->F  bumpVal of relevant rec
// });

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class CreateDB extends PacketBASE {  // Delete a document from the system
    constructor(){super();debugger;} //  name;       // F->B string name of db to create
//  error;      // B->F error string if bad name or null if succeeded
});
_register(class SelectDB extends PacketBASE {  // Delete a document from the system
// name;        // B<-F string name of db to select
// err;         // B->F ONLY IF err occurred 
});
_register(class DeleteDB extends PacketBASE {  // Delete /CURRENT/ DB from backend
    constructor(){super();debugger;}     text;       // --> nothing, empty, null
                // <-- error string if db not empty, null if successful
});
_register(class GetDBList extends PacketBASE {  // Delete /CURRENT/ DB from backend
//  list;       // B-->F array[] of database names (without .db extension)]
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class GetDCHList extends PacketBASE { // get list of all available DocComponentHandlers
    //    list;       // B->F  ["DOC","BOX"] etc... 
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class GetDocTree extends PacketBASE { // get docTree table contents
    //    list;       // B->F [{T.id,T.docUuid,T.listOrder,T.parent,T.bump,D.docName}[,{}...]] etc...  (T=table:docTree, D=table:doc)
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class NewDoc extends PacketBASE {    // create a new doc and insert it into the database
    constructor(){super();debugger;}  // RSREWORK   dict;       // --> {uuid,version,name,listOrder,parent,doc}
// <-- returns with a GetDocTree packet instead of this one!
});
_register(class ModDoc extends PacketBASE {    // B<-F save namechg or dcwpos/shapes back into the database
                                               // B->F=broadcast of uuid,name,dcwFlatTree,bump
//    uuid;        // B<>F uuid of doc to mod
//    name;        // B<>F name of doc  or undeclared if name ! changed
//    dcwFlatTree; // B<>F dcwFlatTree of connected dcw/dch's or undeclared if dcwFlatTree ! changed
//    bump:        // B->F bump# of modded doc
});
_register(class DelDoc extends PacketBASE {   // Delete a document from the system
    constructor(){super();debugger;} uuid;       // -->  uuid of doc to get 
});

_register(class GetDoc extends PacketBASE {    // load a doc from the db via its uuid
//   uuid;       // B<-F uuid of doc to get 
//   rec;        // B->F {name,dcwFlatTree,bump}
});
    
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/////////////////// the following packets are 'Fire and Forget' and will be handled by a broadcasted response pkt /////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

_register(class AddDch extends PacketBASE {    // add dch flatTree(in cases of paste) to current doc, broadcasts "ModDoc"
//  uuid            // B<-F uuid of doc this belongs to
//  newDcwFlatTree  // B<-F ...[[0, {N:"BOX",S:{...},C:1}],[0, {N:"BOX",S:{...},C:0}]]  (with 0's for recId's to create)
//  childOf         // B<-F dchRecId to insert this new dch as a child of (always as last child)
});

_register(class ModDch extends PacketBASE {    // add a new dch to current doc
    constructor(){super();debugger;}//   uuid        // B<-F uuid of doc this belongs to
});

_register(class DelDch extends PacketBASE {    // deleting dch(and all children) from current doc, broadcasts "ModDoc"
//  uuid        // B<-F uuid of doc this belongs to
//  dchId       // B<-F dchRecId of dchRec to remove
});

_register(class GetDch extends PacketBASE {    // load a doc from the db via its uuid
// id;          // B<--F id of dch rec to fetch
// u8a          // B->F
// bump         // B->F
});

