
import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";

WS.pktFtoB = {};    // dict of F to B funcs (see bottom of file for autoSave handler/dispatchers

/*
in essense: when autoSave fires, (see FF.autoSave()) it calls one of the functions below
1) create and attach a new DCH of the proper type but with _s_recId = 0
2) send a "NewDCH" packet and wait for recId and bump to be returned
3) stick recId and bump into dch._s_recId and dch._s_bump
4) send a "ModDoc" packet with the dchList pulled via extractor.extract(FG.curDoc.rootDcw)
5) waitfor a new doc bumpnum to be returned and stow it in FG.curDoc.bump
-- done --
1) recieve a "Changed" packet (see fem_core_PacketHandlersBtoF.js)
2) parse the packet into an actual classObj and call pkt.onChanged() on it
     (see bottom of file where WS.classes.<PacketClass>.prototype.onchanged = async function()) {...}
*/


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// functions below are called when autoSave() fires on them ///////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// WS.pktFtoB.newDoc = async (doc) => {    // presently handled in fem_core_IndexViewHandler.js
//     debugger;
// }

WS.pktFtoB.modDoc = async (doc) => {
    debugger;
}

WS.pktFtoB.delDoc = async (doc) => {
    debugger;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.pktFtoB.newDch = async (dcw) => { // we were given the actual dcw so we need to yank its content here for sending
    debugger; const encoder = new DFEncoder();

    let pkt = WS.makePacket("NewDch");
    pkt.uuid    = FG.curDoc.uuid;
    pkt.name    = FF.getDchName(dcw._s_dch);
    pkt.content = encoder.encode(dcw._s_dch.exportData());    // get data from dch and encode it for transport
    pkt = await WS.sendWait(pkt);
    dcw._s_dch._s_recId = pkt.id;
    dcw._s_dch._s_bump = pkt.bump;

    const extractor = new FG.DocExtracter();
    const dcwDict = extractor.extract(FG.curDoc.rootDcw);  // no longer need await here
    pkt = WS.makePacket("ModDoc");
    pkt.uuid = FG.curDoc.uuid;
    pkt.name = FG.curDoc.name;
    pkt.dcwList = dcwDict.export();
    pkt = await WS.sendWait(pkt);
    FG.curDoc.bump = pkt.bump;
/*
we will never have to worry about more than one new dch at a time, autoSave(0)=immediate/flush
(actually revisit autosave such that there's no queue just a single timer SO THAT something like an autoSave(0) means all-right-now
    and we can get rid of the flushAll() too)
    1) NewDch  B<-F docUuid, dchId, dcwList(with 0 where this NewDCH gets inserted)
    2) insert rec into dch to get its recId
    3) update dcwList
    4) update doc with dcwList and get its bump+1
    5) put bump into dch via recId
    6) Changed B->F docUuid, newDchId, newdcwList
since pktNewDch already forced a bump+1 on doc, pktModDoc doesn't /need/ to
*/
};


WS.pktFtoB.modDch = async (dcw) => {
    const pkt = WS.makePacket("ModDch");     // first thing we have to do is get the list of DCH handlers
    pkt.id = dch._s_recId;
    pkt.u8a = dch.exportDchData();
    pkt = await WS.sendWait(pkt);
}


WS.pktFtoB.delDch = async (dcw) => {
    let pkt = WS.makePacket("DelDch");
    pkt.id    = FG.curDoc.uuid;
    pkt = await WS.sendWait(pkt);
    dcw._s_dch._s_recId = pkt.id;
    dcw._s_dch._s_bump = pkt.bump;
    dcw.destroy();
    debugger;
}
