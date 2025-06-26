
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
/////////////////////////// functions below are called when autoSave() fires on them //////////////////////////////////
/////////////////////////// note, AUTOSAVE-FIRED FUNCTIONS MUST NOT FF.flushAll() /////////////////////////////////////
/////////////////////// calling await FF.flushAll() in these causes __deadlock waiting for itself ///////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.pktFtoB["AddDoc"] = async (dict) => {        // B<-F "AddDoc",  B->F broadcast "ModDocTree"
    dict.uuid = FF.makeUuid();
    let pkt = WS.makePacket("AddDoc", dict);    // dict = {uuid, name, parent, after}
    pkt = WS.send(pkt);
}

WS.pktFtoB["DelDoc"] = async (uuid) => {                            // B<-F "DelDoc".uuid; B->F broadcast "ModDocTree"
    let pkt = WS.makePacket("DelDoc", { uuid:uuid });
    WS.send(pkt);
}

WS.pktFtoB["ModDoc"] = async (data) => {
    let pkt = WS.makePacket("ModDoc", {uuid:FG.curDoc.uuid});
    if ("name" in data) {   // we only do one or the other, name OR dcwFlatTree
        pkt.name = data.name;
    } else {
        const extracter = new FG.DocExtracter();
        pkt.dcwFlatTree = extracter.extract(FG.curDoc.rootDcw);
    }
    WS.send(pkt);
}


WS.pktFtoB["AddDch"] = async (dict) => {     // B<-F "AddDch", B->F "ModDoc"
    let pkt = WS.makePacket("AddDch", {uuid:FG.curDoc.uuid, childOf:dict.parentRecId, newDcwFlatTree:dict.newDcwFlatTree});
    WS.send(pkt);
};

WS.pktFtoB["DelDch"] = async (dcw) => {                             // B<-F "DelDch", B->F "ModDoc"
    let pkt = WS.makePacket("DelDch", {uuid:FG.curDoc.uuid, dchId:dcw.dchRecId});
    WS.send(pkt);
}

WS.pktFtoB["ModDch"] = async (dcw) => {      // autoSave when dch content (export/import[/delta]) changed
    const pkt = WS.makePacket("ModDch");     // first thing we have to do is get the list of DCH handlers
    pkt.uuid = FG.curDoc.uuid;
    pkt.recId = dcw.dchRecId;
    pkt.u8a = await dcw.exportDchData();
    WS.send(pkt);
}


