
import { DCW_BASE }            from "/modules/core/fem_core_DCW_BASE.js";
import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";

WS.pktFtoB = {};    // dict of F to B funcs (see bottom of file for autoSave handler/dispatchers

/*
in essense: when autoSave fires, (see FF.autoSave()) it calls one of the functions below
1) create and attach a new DCH of the proper type but with dcw.dchRecId = 0
2) send a "AddDch" packet and wait for recId and bump to be returned
3) stick recId and bump into dcw.recId and dcw.bump
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
WS.pktFtoB.AddDch = async (parentRecId, newDcwFlatTree) => {
    FF.flushAll();
    let pkt     = WS.makePacket("AddDch", {uuid:FG.curDoc.uuid, childOf:parentRecId, newDcwFlatTree});
    WS.send(pkt);
};


// WS.pktFtoB.ModDch = async (dcw) => {                    // fires when dch content (export/import[/delta]) changed
//     FF.flushAll();
//     debugger; const pkt = WS.makePacket("ModDch");     // first thing we have to do is get the list of DCH handlers
//     pkt.id = dcw.dchRecId;
//     pkt.u8a = dcw.exportDchData();
//     pkt = await WS.sendWait(pkt);
// }


WS.pktFtoB.DelDch = async (dcw) => {
    FF.flushAll();
    let pkt = WS.makePacket("DelDch", {uuid:FG.curDoc.uuid, dchId:dcw.dchRecId});
    WS.send(pkt);
}
