
import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";

// see fem_core_PacketHandlersFtoB.js for an explanation of how these all work
WS.classes.Changed.prototype.process = async function() {    // a 'Changed' packet has arrived, dispatch it! 
    trace("pkt:Changed:", JSON.stringify([this.action, {id:this.id, bump:this.bump}]));
    const pkt = WS.parsePacket([this.action, {id:this.id, bump:this.bump}]);
    try {
        await pkt.onPktRecvd(); // really don't need await, but it sure makes debugging easier! 
    } catch (err) {
        console.log("Error processing ")
    }
};


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// functions below are called when a Changed packet comes in ///////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes.ModDoc.prototype.onPktRecvd = async function() {  // {uuid, bump} trigger: -- WS.pktFtoB.NewDch(dcw)
    debugger; if (!FG.curDoc || FG.curDoc.uuid !== this.dict.uuid) {   // MY curDoc is not changed so ignore packet
        debugger; return;
    }
    debugger; if (FG.curDoc.bump == this.bump) {                  // if bumps match, WE did it, ignore packet
        debugger; return;
    }
/* 
arriving here means something in the doc's dcwFlatTree changed, either add,remove,or move
so while we could be smart about this, we could also be dumb for now and just reload the doc
and revisit this later.
to be smart we have to go fetch the docRec and compare the dchList against current one
* add/remove dcw's  (including recalc children!)  .. also fetch/drop dcw's that got added/removed
* move/resize dcw's
*/    
    debugger; trace("RSTODO: add SMART 'ModDoc.onPktRecvd()' logic");
    await FF.selectAndLoadDoc(this.uuid, true);         // download and redisplay doc (force reload)
// } else if (this.dict.what === "docTree") {    // fetch an entirely new docTree & remove doc too if wasdeleted from docTree
//     debugger; await FF.loadDocTree();                                     // download new doctree from server
//     await FF.selectAndLoadDoc(FG.curDoc && FG.curDoc.uuid);     // download and display new tree, re-select curDoc too
// } else if (this.dict.what === "dbList") {
//     debugger; FF.updateDBSelector();      // get available dbs from server, populate dbDropdown in titlebar, fireup FF.selectDB() workhorse!
// }


    debugger; dcw._s_dch._s_recId = pkt.id;
    dcw._s_dch._s_bump = pkt.bump;

    const extractor = new FG.DocExtracter();
    const dcwDict = extractor.extract(FG.curDoc.rootDcw);  // no longer need await here
    pkt = WS.makePacket("ModDoc");
    pkt.uuid = FG.curDoc.uuid;
    pkt.name = FG.curDoc.name;
    pkt.dcwFlatTree = dcwDict.export();
    pkt = await WS.sendWait(pkt);
    FG.curDoc.bump = pkt.bump;
/*
we will never have to worry about more than one new dch at a time, autoSave(0)=immediate/flush
(actually revisit autosave such that there's no queue just a single timer SO THAT something like an autoSave(0) means all-right-now
    and we can get rid of the flushAll() too)
    1) NewDch  B<-F docUuid, dchId, dcwFlatTree(with 0 where this NewDCH gets inserted)
    2) insert rec into dch to get its recId
    3) update dcwFlatTree
    4) update doc with dcwFlatTree and get its bump+1
    5) put bump into dch via recId
    6) Changed B->F docUuid, newDchId, newdcwFlatTree
since pktNewDch already forced a bump+1 on doc, pktModDoc doesn't /need/ to
*/

}

