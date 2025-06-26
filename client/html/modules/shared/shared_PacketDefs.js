
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
 // error       // B->F "error msg" indicating what the fault was
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class GetBackendInfo extends PacketBASE { // get any element from extra table
// ==IMMEDIATE== requires WS.sendWait()
//  version;    // B-->F current software version (since frontend ONLY loads FROM backend, version is always same!)
//  docVersion; // B-->F current highest docversion (that doesn't need a conversion)
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class GetExtra extends PacketBASE { // get any element from extra table
// ==IMMEDIATE== requires WS.sendWait()
//  key;        // B<-F "key" on the way in
//  value;      // B->F "value" on the way back or undeclared if key not found
});
_register(class SetExtra extends PacketBASE { // get any element from extra table
// ==IMMEDIATE== requires WS.sendWait()
//    key;        // B<-F key to set/change
//    val;        // B<-F "value" to set/change to
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class GetDBList extends PacketBASE {  // Delete /CURRENT/ DB from backend
// ==IMMEDIATE== requires WS.sendWait()
// list;       // B-->F array[] of database names (without .db extension)]
});
_register(class AddDB extends PacketBASE {  // Delete a document from the system
//  name;       // B<-F string name of db to create
// ==BROADCAST== "AddDB"
});
_register(class SelectDB extends PacketBASE {  // Delete a document from the system
// ==IMMEDIATE== requires WS.sendWait()
// name;        // B<-F string name of db to select
// error;       // B->F ONLY IF error occurred 
});
_register(class DelDB extends PacketBASE {  // Delete /CURRENT/ DB from backend
    constructor() { debugger; } // not implemented yet
// text;        // B<-F string name of db to delete
// error;       // B->F ONLY IF error occurred 
                // <-- error string if db not empty, null if successful
// ==BROADCAST== "DelDB"
});

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class GetDCHList extends PacketBASE { // get list of all available DocComponentHandlers
// ==IMMEDIATE== requires WS.sendWait()
// list;       // B->F  ["BOX","TXA",...] etc... 
});
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class GetDocTree extends PacketBASE { // get docTree table contents
// ==IMMEDIATE== requires WS.sendWait()
// list;       // B->F [{T.id,T.docUuid,T.listOrder,T.parent,T.bump,D.docName}[,{}...]] etc...  (T=table:docTree, D=table:doc)
});

_register(class ModDocTree extends PacketBASE {    // add dch flatTree(in cases of paste) to current doc, broadcasts "ModDoc"
// ==BROADCAST== "ModDocTree" -- nothing returned as nothing but a tree reload needs to happen
});
    
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
_register(class AddDoc extends PacketBASE {    // B<-F insert new doc in db  .. broadcasts ModDocTree
// uuid          // B<-F uuid of new doc
// name          // B<-F name of new doc
// parent        // B<-F recId of parent of new doc, or 0 if is toplevel
// after         // B<-F recId of preceeding doc, or 0 if is first;
// dcwFlatTree   // B<-F 
// ==BROADCAST== "ModDocTree"
});
_register(class ModDoc extends PacketBASE {    // B<-F save namechg OR dcwFlatTree changes back into the database
                                               // B->F broadcast of uuid,name,dcwFlatTree,bump
//    uuid;         // B<>F uuid of doc to mod
//    ?name;        // B<>F name of doc  [or undeclared if name ! changed]
//    ?dcwFlatTree; // B<>F dcwFlatTree of connected dcw/dch's [or undeclared if dcwFlatTree ! changed]
//    bump:         // B->F bump# of modded doc
// ==BROADCAST== "ModDoc"
});
_register(class DelDoc extends PacketBASE {   // B<-F Delete a doc+kids,  F->B broadcast "ModDocTree"
//  uuid;       // B<-F uuid of doc to delete (and kids too)
// ==BROADCAST== "ModDocTree"
});

_register(class GetDoc extends PacketBASE {    // load a doc from the db via its uuid, COMPATIBLE WITH ModDoc!  !!!! 
// ==IMMEDIATE== requires WS.sendWait()
//   uuid;        // B<>F uuid of doc to get 
//   name:        // B->F
//   dcwFlatTree: // B->F
//   bump:        // B->F 
});
    
_register(class AddDch extends PacketBASE {    // add dch flatTree(in cases of paste) to current doc, broadcasts "ModDoc"
//  uuid            // B<-F uuid of doc this belongs to
//  newDcwFlatTree  // B<-F ...[[0, {N:"BOX",S:{...},C:1}],[0, {N:"BOX",S:{...},C:0}]]  (with 0's for recId's to create)
//  childOf         // B<-F dchRecId to insert this new dch as a child of (always as last child)
// ==BROADCAST== "ModDoc"
});

_register(class ModDch extends PacketBASE {    // add a new dch to current doc, broadcasts "ModDoc"
//   uuid          // B<>F uuid of doc this belongs to
// recId           // B<>F recId of dch getting modded
// u8a             // B<>F Uint8array of data
// ==BROADCAST== "ModDoc"
});

_register(class DelDch extends PacketBASE {    // deleting dch(and all children) from current doc, broadcasts "ModDoc"
//  uuid        // B<-F uuid of doc this belongs to
//  dchId       // B<-F dchRecId of dchRec to remove
// ==BROADCAST== "ModDoc"
});

_register(class GetDch extends PacketBASE {    // load a doc from the db via its uuid
// ==IMMEDIATE== requires WS.sendWait()
// id;          // B<>F id of dch rec to fetch
// rec.name     // B->F
// rec.content  // B->F
});

