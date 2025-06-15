
import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";

// see fem_core_PacketHandlersFtoB.js for an explanation of how these all work
WS.classes.Changed.prototype.process = async function() {    // a 'Changed' packet has arrived, dispatch it! 
    trace("pkt:Changed:", JSON.stringify([this.action, {id:this.id, bump:this.bump}]));
    const pkt = WS.parsePacket([this.action, {id:this.id, bump:this.bump}]);
    await pkt.onChanged(); // really don't need await, but it sure makes debugging easier! 
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// functions below are called when a Changed packet comes in ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.ModDoc.prototype.onChanged = async function() {  // {uuid, bump} trigger: -- WS.pktFtoB.newDch(dcw)
    debugger; if (!FG.curDoc || FG.curDoc.uuid !== this.dict.uuid) {   // MY curDoc is not changed so ignore packet
        debugger; return;
    }
    debugger; if (FG.curDoc.bump == this.bump) {                  // if bumps match, WE did it, ignore packet
        debugger; return;
    }
/* 
arriving here means something in the doc's dcwList changed, either add,remove,or move
so while we could be smart about this, we could also be dumb for now and just reload the doc
and revisit this later.
to be smart we have to go fetch the docRec and compare the dchList against current one
* add/remove dcw's  (including recalc children!)  .. also fetch/drop dcw's that got added/removed
* move/resize dcw's
*/    
    debugger; trace("RSTODO: add SMART 'ModDoc.onChanged()' logic");
    await FF.selectAndLoadDoc(this.uuid, true);         // download and redisplay doc (force reload)
}
// } else if (this.dict.what === "docTree") {    // fetch an entirely new docTree & remove doc too if wasdeleted from docTree
//     debugger; await FF.loadDocTree();                                     // download new doctree from server
//     await FF.selectAndLoadDoc(FG.curDoc && FG.curDoc.uuid);     // download and display new tree, re-select curDoc too
// } else if (this.dict.what === "dbList") {
//     debugger; FF.updateDBSelector();      // get available dbs from server, populate dbDropdown in titlebar, fireup FF.selectDB() workhorse!
// }


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.ModDch.prototype.onChanged = async function() {  // {uuid, dcwId} -- trigger= WS.pktFtoB.delDch(dcw)s
    debugger;
}

