
import { DCW_BASE } from "/modules/core/fem_core_DCW_BASE.js";
import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";
import { DFDict } from "/public/classes/DFDict.mjs";

// see fem_core_PacketHandlersFtoB.js for an explanation of how these all work
// WS.classes["Changed"].prototype.process = async function() {    // a 'Changed' packet has arrived, dispatch it! 
//     trace("pkt:Changed:", JSON.stringify([this.action, {id:this.id, bump:this.bump}]));
//     const pkt = WS.parsePacket([this.action, {id:this.id, bump:this.bump}]);
//     try {
//         await pkt.onPktRecvd(); // really don't need await, but it sure makes debugging easier! 
//     } catch (err) {
//         console.log("Error processing ")
//     }
// };


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// functions below are called when a broadcast packet comes in ////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
WS.classes["ModDocTree"].prototype.onPktRecvd = async function() {  // {uuid, bump} trigger: -- WS.pktFtoB["AddDch"](dcw)
    if (WS.lastPacketSent.__id == this.__id) {      // I am the one who sent the change so select this uuid immediately!
        LS.curDoc = WS.lastPacketSent.uuid;
    }
    await FF.loadDocTree();         // go fetch and reconstruct index pane
    await FF.selectAndLoadDoc(LS.curDoc, false);
}

WS.classes["ModDoc"].prototype.onPktRecvd = async function() {  // {uuid, bump} trigger: -- WS.pktFtoB["AddDch"](dcw)
    if (!FG.curDoc || FG.curDoc.uuid !== this.uuid) {   // MY curDoc is not changed so ignore packet
        return;
    }
    if ("name" in this) {
        FG.curDoc.name = this.name;
        await FF.loadDocTree();         // go fetch and reconstruct index pane
        await FF.selectAndLoadDoc(FG.curDoc.uuid, false);  // keep current doc as all we did was rename it
        return;
    }
    let feFlat, beFlat, feDict, beDict, feRecIds, beRecIds, removed = [], added = [], kept = [];
    const extracter = new FG.DocExtracter();
    feFlat = extracter.extract(FG.curDoc.rootDcw);
    beFlat = this.dcwFlatTree;

    feDict   = new DFDict(feFlat);
    feRecIds = feDict.keys.sort((a, b) => Number(a) - Number(b));  // extract the current recids and sort them numerically

    beDict   = new DFDict(beFlat);
    beRecIds = beDict.keys.sort((a, b) => Number(a) - Number(b));  // same for newly received dcwFlatTree

    while(feRecIds.length || beRecIds.length) {      // get removed,added,kept Ids
        if (!feRecIds.length) {                      // if no more old recs, add beFlat rec to added
            added.push(beRecIds.shift());    
        } else if (!beRecIds.length) {               // if no more new recs, add feFlat rec to removed
            removed.push(feRecIds.shift());  
        } else {                                     // if BOTH lists still have recs
            if (feRecIds[0] < beRecIds[0]) {         // if feFlat < beFlat then feFlat got removed
                removed.push(feRecIds.shift());
            } else if (feRecIds[0] > beRecIds[0]) {  // if feFlat > beFlat then beFlat got added added
                added.push(beRecIds.shift());
            } else {                                 // both still exist, record in kept and delete from both
                kept.push(feRecIds.shift());
                beRecIds.shift();
            }
        }
    }
// we beFlat have a list of id's to remove, to add, and that were kept
    let dcwList = FF.getDcwList();            // easiest first step is removing, so...
    for (let idx = dcwList.length - 1; idx >= 0; idx--) {
        if (removed.includes(dcwList[idx].dchRecId)) {
            await dcwList[idx].destroy();
        }
    }
    let parenTree = _getParentsPair(beFlat);    // turn dcwFlatTree into [[recId, parentRecId],...]
    parenTree = new DFDict(parenTree);

    for (const recId of added) {      // take entries in added, find them in parenTree, add as new
        const parentId = parenTree.getByKey(recId);
        dcwList = FF.getDcwList();    // refetch each loop cuz some new 'added' id's may not exist in prior loop
        for (const dcw of dcwList) {
            if (dcw.dchRecId == parentId) {
                const data = beDict.getByKey(recId);
                const nuDcw = await DCW_BASE.create(dcw, data.S);
                let pkt = WS.makePacket("GetDch", {id:recId});
                pkt = await WS.sendExpect(pkt, _onGetDch, nuDcw);
            }
        }
    }

// all deleted were deleted, all added were added, 
// refetch the 'feFlat' flatTree which should beFlat exactly mirror the structure of 'beFlat' 
// but the order of children has to be addressed AND the styles may need to be changed, so first lets fix the order:
    feFlat = extracter.extract(FG.curDoc.rootDcw);  
// RSTODO fix the order once we allow ordering, here is where!
// TO DO this we need a new form of flatTree that instead of C:3 we have C:[rId1, rId2, rId3]
    trace("fixing up ModDoc broadcast;  RSTODO "); 
//    return;
// //  we can use the _getParentsPair and walk it and compare parents, its in the right order! 
// // so go backwards from end and build [] lists such that recId has [recId,recId] as kids and keep it 'flat' in the sense of
// //    no deeper than one,
//    // [[22,{C:2}],[33,{C:1}],,[44,{C:0}],[55,{C:0}]] --> [ [22,[33,55]],[33,[44]] ]  22 has 33,55,  33 has 44
    debugger; let frEndParenTree = _getParentsPair(beFlat)
//    let bkEndParenTree = _getParentsPair(beFlat);    // turn dcwFlatTrees into [[recId, parentRecId],...]

//    frEndParenTree = _getParentsAsList(frEndParenTree);  // cvt dcwFlatTree from [[recId,data:{C:2}]] to DFDict:[[recId,data:{C:[rId1,rId2]}]]
//    bkEndParenTree = _getParentsAsList(bkEndParenTree);
//     for (let idx = 0; idx < bkEndParenTree.length; idx++) {   // compare all children[] lists and reorder frEndKids to match bkEndKids
//         const [bkEndRecId,bkEndKids] = bkEndParenTree(idx);
//         const frEndKids = frEndParenTree.getByKey(bkEndRecId);        // of bkEnd had it, frEnd is now guaranteed to have it too
// // RSTODO compare bkEndKids to frEndKids and reorder frEndKids to match bkEndKids.  (the #"s are guaranteed to be the same, just not the order)        

//     }

// RSTODO last step!  compare the styles and restyle if needed!  (add a 'setStyle' func to the DCW_BASE)
    let same = true;
    for (let idx = 0; idx < dcwList.length; idx++) {
        let feTmp = feDict.getByIdx(idx);    // [recId, {N,S,C}]
        feTmp = feTmp[1].S                      // extract the style part
        let beTmp = beDict.getByIdx(idx);
        beTmp = beTmp[1].S
        let feKeys = Object.keys(feTmp).sort(); // get/sort/compare the keys of both
        let beKeys = Object.keys(beTmp).sort();
        if (!_arrayMatch(feKeys, beKeys)) {
            same = false;
            break;
        }
        for (const key of feKeys) {
            if (feTmp[key] != beTmp[key]) {
                same = false;
                break;
            }
        }
        if (!same) {
            let dcw = dcwList[idx];
            dcw.setStyle(beTmp);        // restyle using broadcasted(backend) data
        }
    }
}

function _arrayMatch(aa, bb) {
    if (aa.length !== bb.length) {
        return false;
    }
    for (let idx = 0; idx < aa.length; idx++) {
        if (aa.idx != bb.idx) {
            return false;
        }
    }
    return true;
}

function _getParentsAsList(parentsPair) {   // cvt from [[recId, parentRecId],...] to [[recId, [kidIds], [recId, [kidIds]]
    let src = new DFDict(parentsPair);
    let dest = new DFDict();
    for (const srcId of src.keys) {
        const parent = src.getByKey(srcId);
        const val = dest.getByKey();
        if (val == dest.NOEXIST) {
            dest.append(parent, [srcid]);
        } else {
            val.push(srcId);
        }
    }
    return dest;
}

function _getParentsPair(dcwFlatTree) {   // turn dcwFlatTree into [[recId, parentRecId],...]
    let idx = 0, list = [];
    function walk(parent) {
        if (idx >= dcwFlatTree.length) {
            return;
        }
        const [recId, data] = dcwFlatTree[idx++];
        list.push([recId, parent]);
        let kidCt = data.C;
        while (kidCt--) {
            walk(recId);
        }
    }
    walk(0);
    return list;
}


async function _onGetDch(pkt, dcw) {
    await dcw.attachDch(pkt.rec.name);  // attach the approprate dch!
    dcw.dchRecId = pkt.id;              // give it it's dch rec id      

    const decoder = new DFDecoder(pkt.rec.content);
    const blob = decoder.decode();      // will return decoder.EOSTREAM if u8a is empty
    if (blob != decoder.EOSTREAM) {     // if stream was empty
        dcw.dch.importData(blob);
    }
}


WS.classes["ModDch"].prototype.onPktRecvd = async function() {  // {uuid, bump} trigger: -- WS.pktFtoB["AddDch"](dcw)
    if (WS.lastPacketSent.__id == this.__id) {      // I am the one who sent the change so don't update myself again!
        return;
    }
    if (!FG.curDoc || FG.curDoc.uuid !== this.uuid) {   // MY curDoc is not changed so ignore packet
        return;
    }
    const dcwList = FF.getDcwList();
    for (const dcw of dcwList) {
        if (dcw.dchRecId == this.recId) {
            dcw.importDchData(this.u8a);
            dcw.bump = this.bump;
            return;
        }
    }
}