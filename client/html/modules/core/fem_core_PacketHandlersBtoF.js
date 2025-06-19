
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
WS.classes["ModDoc"].prototype.onPktRecvd = async function() {  // {uuid, bump} trigger: -- WS.pktFtoB["AddDch"](dcw)
    if (!FG.curDoc || FG.curDoc.uuid !== this.uuid) {   // MY curDoc is not changed so ignore packet
        return;
    }
    if ("name" in this) {
        debugger; FG.curDoc.name = this.name;
        debugger; // RSTODO update the docTree
        return;
    }
    let frEnd, bkEnd, frEndDict, bkEndDict, frEndRecIds, bkEndRecIds, removed = [], added = [], kept = [];
    const extracter = new FG.DocExtracter();
    frEnd = extracter.extract(FG.curDoc.rootDcw);
    bkEnd = this.dcwFlatTree;

    frEndDict   = new DFDict(frEnd);
    frEndRecIds = frEndDict.keys.sort((a, b) => Number(a) - Number(b));  // extract the current recids and sort them numerically

    bkEndDict   = new DFDict(bkEnd);
    bkEndRecIds = bkEndDict.keys.sort((a, b) => Number(a) - Number(b));  // same for newly received dcwFlatTree

    while(frEndRecIds.length || bkEndRecIds.length) {  // get removed,added,kept Ids
        if (!frEndRecIds.length) {                       // if no more old recs, add bkEnd rec to added
            added.push(bkEndRecIds.shift());    
        } else if (!bkEndRecIds.length) {                // if no more new recs, add frEnd rec to removed
            removed.push(frEndRecIds.shift());  
        } else {                                       // if BOTH lists still have recs
            if (frEndRecIds[0] < bkEndRecIds[0]) {         // if frEnd < bkEnd then frEnd got removed
                removed.push(frEndRecIds.shift());
            } else if (frEndRecIds[0] > bkEndRecIds[0]) {  // if frEnd > bkEnd then bkEnd got added added
                added.push(bkEndRecIds.shift());
            } else {                                   // both still exist, record in kept and delete from both
                kept.push(frEndRecIds.shift());
                bkEndRecIds.shift();
            }
        }
    }
// we bkEnd have a list of id's to remove, to add, and that were kept
    let dcwList = FF.getDcwList();            // easiest first step is removing, so...
    for (let idx = dcwList.length - 1; idx >= 0; idx--) {
        if (removed.includes(dcwList[idx].dchRecId)) {
            await dcwList[idx].destroy();
        }
    }
    let parenTree = _getParentsPair(bkEnd);    // turn dcwFlatTree into [[recId, parentRecId],...]
    parenTree = new DFDict(parenTree);

    for (const recId of added) {      // take entries in added, find them in parenTree, add as new
        const parentId = parenTree.getByKey(recId);
        dcwList = FF.getDcwList();    // refetch each loop cuz some new 'added' id's may not exist in prior loop
        for (const dcw of dcwList) {
            if (dcw.dchRecId == parentId) {
                const data = bkEndDict.getByKey(recId);
                const nuDcw = await DCW_BASE.create(dcw, data.S);
                let pkt = WS.makePacket("GetDch", {id:recId});
                pkt = await WS.sendExpect(pkt, _onGetDch, nuDcw);
            }
        }
    }

// all deleted were deleted, all added were added, 
// bkEnd refetch the 'frEnd' flatTree which should bkEnd exactly mirror the structure of 'bkEnd' 
// but the order of children has to be addressed AND the styles may need to be changed, so first lets fix the order:
frEnd = extracter.extract(FG.curDoc.rootDcw);  
// RSTODO fix the order once we allow ordering, here is where!
// TO DO this we need a new form of flatTree that instead of C:3 we have C:[rId1, rId2, rId3]
   trace("fixing up ModDoc broadcast;  RSTODO "); return;
//  we can use the _getParentsPair and walk it and compare parents, its in the right order! 
// so go backwards from end and build [] lists such that recId has [recId,recId] as kids and keep it 'flat' in the sense of
//    no deeper than one,
   // [[22,{C:2}],[33,{C:1}],,[44,{C:0}],[55,{C:0}]] --> [ [22,[33,55]],[33,[44]] ]  22 has 33,55,  33 has 44
   debugger; let frEndParenTree = _getParentsPair(bkEnd)
   let bkEndParenTree = _getParentsPair(bkEnd);    // turn dcwFlatTrees into [[recId, parentRecId],...]

   frEndParenTree = _getParentsAsList(frEndParenTree);  // cvt dcwFlatTree from [[recId,data:{C:2}]] to DFDict:[[recId,data:{C:[rId1,rId2]}]]
   bkEndParenTree = _getParentsAsList(bkEndParenTree);
    for (let idx = 0; idx < bkEndParenTree.length; idx++) {   // compare all children[] lists and reorder frEndKids to match bkEndKids
        const [bkEndRecId,bkEndKids] = bkEndParenTree(idx);
        const frEndKids = frEndParenTree.getByKey(bkEndRecId);        // of bkEnd had it, frEnd is now guaranteed to have it too
// RSTODO compare bkEndKids to frEndKids and reorder frEndKids to match bkEndKids.  (the #"s are guaranteed to be the same, just not the order)        

    }

// compare children of each 'frEnd' to 'bkEnd' and if out of order reorder them

    debugger;
// RSTODO last step!  compare the styles and restyle if needed!  (add a 'setStyle' func to the DCW_BASE)
   
    debugger;
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
    debugger; if (!FG.curDoc || FG.curDoc.uuid !== this.uuid) {   // MY curDoc is not changed so ignore packet
        return;
    }
    debugger; //RSTODO find the element by recId, update it's content
}