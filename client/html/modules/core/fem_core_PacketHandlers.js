
const trace = FF.trace;

import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";

WS.dispatch = {};    // see bottom of file for autoSave handler/dispatchers


/* When a packet comes in from the server that is not a response to a packet sent from here, it will look for a prototype.process() function on 
the packet, and if found will call it.  

We do not put these functions into the client/html//modules/shared/shared_PacketDefs.js file because this file is used by both the server and client,
and the server will have its own .process() function that is different from the clients .process()

Here below if we receive a packet of class Changed, it will call .process() below, with 'this' being the constructed packet received from the server
*/

WS.classes.Changed.prototype.process = async function() {    // insert new doc into db,  return with a GetDocTree packet
    const pkt = WS.parsePacket([this.action, {id:this.id, bump:this.bump}]);
    pkt.onChanged();
    
    // } else if (this.dict.what === "docTree") {    // fetch an entirely new docTree & remove doc too if wasdeleted from docTree
    //     debugger; await FF.loadDocTree();                                     // download new doctree from server
    //     await FF.selectAndLoadDoc(FG.curDoc && FG.curDoc.uuid);     // download and display new tree, re-select curDoc too
    // } else if (this.dict.what === "dbList") {
    //     debugger; FF.updateDBSelector();      // get available dbs from server, populate dbDropdown in titlebar, fireup FF.selectDB() workhorse!
    // }
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// functions below are called when autoSave() fires on them ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.dispatch.newDch = async (dcw) => { // we were given the actual dch so we need to yank its content here for sending
    const encoder = new DFEncoder();

    let pkt = WS.makePacket("NewDch");
    pkt.uuid    = FG.curDoc.uuid;
    pkt.name    = FF.getDchName(dcw._s_dch);
    pkt.content = encoder.encode(dcw._s_dch.exportData());    // get data from dch and encode it for transport
    pkt = await WS.sendWait(pkt);
    dcw._s_dch.__recId = pkt.id;
    dcw._s_dch.__bump = pkt.bump;

    const extractor = new FG.DocExtracter();
    const dcwDict = extractor.extract(FG.curDoc.rootDcw);  // no longer need await here
    pkt = WS.makePacket("ModDoc");
    pkt.uuid = FG.curDoc.uuid;
    pkt.name = FG.curDoc.name;
    pkt.dcwList = dcwDict.export();
    pkt = await WS.sendWait(pkt);
    FG.curDoc.bump = pkt.bump;
};

WS.dispatch.delDch = async (dcw) => {
    debugger;
}

WS.classes.ModDoc.prototype.onChanged = async function(client) {
    debugger; if (!FG.curDoc || FG.curDoc.uuid !== this.uuid) {   // curDoc is not changed so ignore packet
        return;
    }
    if (FG.curDoc.bump == this.bump) {                  // if bumps match, WE did it, ignore packet
        return;
    }

    
/* 
arriving here means something in the doc's dcwList changed, either add,remove,or move
so while we could be smart about this, we could also be dumb for now and just reload the doc
and revisit this later.
to be smart we have to go fetch the docRec and compare the dchList against current one
* add/remove dcw's  (including recalc children!)  .. also fetch/drop dcw's that got added/removed
* move/resize dcw's
*/    
    trace("RSTODO: add SMART 'ModDoc.onChanged()' logic");
    await FF.selectAndLoadDoc(this.uuid, true);         // download and redisplay doc (force reload)
}