
import { DCW_BASE }            from "/modules/core/fem_core_DCW_BASE.js";
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

WS.pktFtoB.ModDoc = async (doc) => {
    debugger;
}

WS.pktFtoB.DelDoc = async (doc) => {
    debugger;
}


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.pktFtoB.NewDch = async (dchName, dcw, style) => { // we were given the actual dcw so we need to yank its content here for sending
    FF.flushAll();

    const nuDcw = await DCW_BASE.create(dcw, style);  // create nuDcw, parentTo dcw, set style
    await nuDcw.attachDch(dchName);                 // creates real dch BUT no data AND no _s_recId

    let extracter = new FG.DocExtracter();    //RSNOTE DOES NOT detach! ONLY extracts!!!!
    const docFlatTree= await extracter.extract(dcw, true);
// nice, this returns a proper flatTree with the new rec having recId=0! perfect!

// thnking 'attachDch will only add a 'stub' dcw that doesnt actually have a dch YET as we have to go get it from the db

    let pkt = WS.makePacket("NewDch");
    pkt.uuid = FG.curDoc.uuid;
    pkt.tree = docFlatTree;
    pkt = WS.send(pkt);
};


WS.pktFtoB.ModDch = async (dcw) => {
    debugger; const pkt = WS.makePacket("ModDch");     // first thing we have to do is get the list of DCH handlers
    pkt.id = dch._s_recId;
    pkt.u8a = dch.exportDchData();
    pkt = await WS.sendWait(pkt);
}


WS.pktFtoB.DelDch = async (dcw) => {
    debugger; let pkt = WS.makePacket("DelDch");
    pkt.id    = FG.curDoc.uuid;
    pkt = await WS.sendWait(pkt);
    dcw._s_dch._s_recId = pkt.id;
    dcw._s_dch._s_bump = pkt.bump;
    dcw.destroy();
    debugger;
}
