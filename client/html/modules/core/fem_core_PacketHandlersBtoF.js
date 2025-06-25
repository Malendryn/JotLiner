
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
WS.classes["AddDB"].prototype.onPktRecvd = async function() {    // this.name = newDBname
    if (WS.lastPacketSent.__id == this.__id) {      // I am the one who sent the change so select this uuid immediately!
        LS.curDb = WS.lastPacketSent.name;                    // set the new dbname
    }
    await FF.updateDBSelector(WS.lastPacketSent.__id == this.__id); // if I sent it, switch to it too
}

WS.classes["ModDocTree"].prototype.onPktRecvd = async function() {
    if (WS.lastPacketSent.__id == this.__id) {      // I am the one who sent the change so select this uuid immediately!
        LS.curDoc = WS.lastPacketSent.uuid;
    }
    await FF.loadDocTree();                         // THIS call clears FG.curDoc/LS.curDoc if docUnderCursor was deleted
    await FF.selectAndLoadDoc(LS.curDoc, false);    // but does this already do that for us?
}


WS.classes["ModDoc"].prototype.onPktRecvd = async function() {
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
    beFlat = this.dcwFlatTree;
    beDict   = new DFDict(beFlat);
    beRecIds = beDict.keys.sort((a, b) => Number(a) - Number(b));  // same for newly received dcwFlatTree

    if (FG.curDoc.rootDcw == null) {   // spcl when ModDoc called from FF.loadDoc()(rootDcw == null)
        const [dchRecId, data] = beDict.getByIdx(0);
        const nuDcw = await DCW_BASE.create(null, data.S);
        FG.curDoc.rootDcw = nuDcw;
        await nuDcw.attachDch(dchRecId, data.N);
    }

    const extracter = new FG.DocExtracter();
    feFlat = extracter.extract(FG.curDoc.rootDcw);
    feDict   = new DFDict(feFlat);
    feRecIds = feDict.keys.sort((a, b) => Number(a) - Number(b));  // extract the current recids and sort them numerically


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
// we now have a list of id's to remove, to add, and that were kept
    let dcwList = FF.getDcwList();            // easiest first step is removing, so...
    let idx = 0;
    
    while (idx < dcwList.length) {
        if (removed.includes(dcwList[idx].dchRecId)) {  // if found
            await dcwList[idx].destroy();               // remove it but don't inc idx
            dcwList = FF.getDcwList();                  // refetch list with entrie(s) removed
        } else {
            ++idx;                                      // not found, bump idx
        }
    }
    // for (let idx = dcwList.length - 1; idx >= 0; idx--) {   // backwards to prevent breakage
    //     if (removed.includes(dcwList[idx].dchRecId)) {
    //         await dcwList[idx].destroy();
    //         dcwList = FF.getDcwList();        // refetch new list with destroyed recs removed
    //     }
    // }

    let parenTree = _getParentsPair(beFlat);    // turn dcwFlatTree into [[recId, parentRecId],...]
    parenTree = new DFDict(parenTree);

    for (const nuDchRecId of added) {      // take entries in added, find them in parenTree, add as new
        const parentId = parenTree.getByKey(nuDchRecId);
        for (const dcw of dcwList) {
            if (dcw.dchRecId == parentId) {
                const data = beDict.getByKey(nuDchRecId);
                const nuDcw = await DCW_BASE.create(dcw, data.S);
                dcwList = FF.getDcwList();    // refetch with new 'added' id's in place
                await nuDcw.attachDch(nuDchRecId, data.N);
                // let pkt = WS.makePacket("GetDch", {id:nuDchRecId});
                // pkt = await WS.sendExpect(pkt, _onGetDch, nuDcw);
            }
        }
    }

// all deleted were deleted, all added were added, (dch's still loading in sendExpect state)
// refetch the 'feFlat'/'feDict' items which should now exactly mirror the structure of 'beFlat' EXCEPT...
//    ...EXCEPT order of children has to be addressed AND styles may need to be changed, so first lets fix the styles:
    feFlat = extracter.extract(FG.curDoc.rootDcw);
    feDict = new DFDict(feFlat);
// NOTE: newly inserted dch's don't have a recId or 'N' even though we do have that info on hand.  THAT info comes in
// via the "GetDch" callback ... but isn't that bad?  I mean if we're loading a new "BOX" and it doesn't yet know it's a 
// BOX how can it attach children?

    let same = true;
    for (let idx = 0; idx < dcwList.length; idx++) {
        let feTmp = feDict.getByIdx(idx);    // [recId, {N,S,C}]
        feTmp = feTmp[1].S                      // extract the style part
        let beTmp = beDict.getByIdx(idx);
        beTmp = beTmp[1].S
        let feKeys = Object.keys(feTmp).sort(); // get/sort/compare the keys of both
        let beKeys = Object.keys(beTmp).sort();
        if (!_arrayMatch(feKeys, beKeys)) {     // if length OR keys differ...
            same = false;
            break;
        }
        for (const key of feKeys) {             // if content of any key differ...
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

// none of that will have affected feFlat/feDict in a way that matters for the next step so, onward...!
// we now address the changing of depth, (order of dcw's)

// RSTODO fix the order once we allow ordering, here is where!
// TO DO this we need a new form of flatTree that instead of C:3 we have C:[rId1, rId2, rId3]
    trace("fixing up ModDoc broadcast;  RSTODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO TODO"); 

// //  we can use the _getParentsPair and walk it and compare parents, its in the right order! 
// // so go backwards from end and build [] lists such that recId has [recId,recId] as kids and keep it 'flat' in the sense of
// //    no deeper than one,
//    // [[22,{C:2}],[33,{C:1}],,[44,{C:0}],[55,{C:0}]] --> [ [22,[33,55]],[33,[44]] ]  22 has 33,55,  33 has 44
    feFlat = extracter.extract(FG.curDoc.rootDcw);
//    let feParenTree = _getParentsPair(feFlat)
//    let beParenTree = _getParentsPair(beFlat);    // turn dcwFlatTrees into [[recId, parentRecId],...]

//    feParenTree = _getParentsAsList(feParenTree);  // cvt dcwFlatTree from [[recId,data:{C:2}]] to DFDict:[[recId,data:{C:[rId1,rId2]}]]
//    beParenTree = _getParentsAsList(beParenTree);
//     for (let idx = 0; idx < beParenTree.length; idx++) {   // compare all children[] lists and reorder frEndKids to match bkEndKids
//         const [bkEndRecId,bkEndKids] = beParenTree(idx);
//         const frEndKids = feParenTree.getByKey(bkEndRecId);        // of bkEnd had it, frEnd is now guaranteed to have it too
// // RSTODO compare bkEndKids to frEndKids and reorder frEndKids to match bkEndKids.  (the #"s are guaranteed to be the same, just not the order)        

//     }
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
    // await dcw.attachDch(pkt.id, pkt.rec.name);  // attach the approprate dch!

    debugger; const decoder = new DFDecoder(pkt.rec.content);
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