
import { DCW_BASE } from "/modules/core/fem_core_DCW_BASE.js";
import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";
import { DFDict } from "/public/classes/DFDict.mjs";

// see fem_core_PacketHandlersFtoB.js for an explanation of how these all work
// WS.classes.Changed.prototype.process = async function() {    // a 'Changed' packet has arrived, dispatch it! 
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
WS.classes.ModDoc.prototype.onPktRecvd = async function() {  // {uuid, bump} trigger: -- WS.pktFtoB.AddDch(dcw)
    if (!FG.curDoc || FG.curDoc.uuid !== this.uuid) {   // MY curDoc is not changed so ignore packet
        return;
    }

    let was, now, wasDict, nowDict, wasRecIds, nowRecIds, removed = [], added = [], kept = [];
    const extracter = new FG.DocExtracter();
    was = extracter.extract(FG.curDoc.rootDcw);
    now = this.dcwFlatTree;

    wasDict   = new DFDict(was);
    wasRecIds = wasDict.keys.sort((a, b) => Number(a) - Number(b));  // extract the current recids and sort them numerically

    nowDict   = new DFDict(now);
    nowRecIds = nowDict.keys.sort((a, b) => Number(a) - Number(b));  // same for newly received dcwFlatTree

    while(wasRecIds.length || nowRecIds.length) {  // get removed,added,kept Ids
        if (!wasRecIds.length) {                       // if no more old recs, add now rec to added
            added.push(nowRecIds.shift());    
        } else if (!nowRecIds.length) {                // if no more new recs, add was rec to removed
            removed.push(wasRecIds.shift());  
        } else {                                       // if BOTH lists still have recs
            if (wasRecIds[0] < nowRecIds[0]) {         // if was < now then was got removed
                removed.push(wasRecIds.shift());
            } else if (wasRecIds[0] > nowRecIds[0]) {  // if was > now then now got added added
                added.push(nowRecIds.shift());
            } else {                                   // both still exist, record in kept and delete from both
                kept.push(wasRecIds.shift());
                nowRecIds.shift();
            }
        }
    }
// we now have a list of id's to remove, to add, and that were kept
    let dcwList = FF.getDcwList();            // easiest first step is removing, so...
    for (let idx = dcwList.length - 1; idx >= 0; idx--) {
        if (removed.includes(dcwList[idx].dchRecId)) {
            await dcwList[idx].destroy();
        }
    }
    let parenTree = _parentize(now);             // mate the 'now' flatTree recIds with their parentId
    parenTree = new DFDict(parenTree);

    for (const recId of added) {      // take entries in added, find them in parenTree, add as new
        const parentId = parenTree.getByKey(recId);
        dcwList = FF.getDcwList();    // refetch each loop cuz some new 'added' id's may not exist in prior loop
        for (const dcw of dcwList) {
            if (dcw.dchRecId == parentId) {
                const data = nowDict.getByKey(recId);
                const nuDcw = await DCW_BASE.create(dcw, data.S);
                let pkt = WS.makePacket("GetDch", {id:recId});
                pkt = await WS.sendExpect(pkt, _onGetDch, nuDcw);
            }
        }
    }

// all deleted were deleted, all added were added, 
// now refetch the 'was' flatTree which should now exactly mirror the structure of 'now' 
// but the order of children has to be addressed AND the styles may need to be changed, so first lets fix the order:
    was = extracter.extract(FG.curDoc.rootDcw);  


// RSTODO last step!  compare the styles and restyle if needed!  (add a 'setStyle' func to the DCW_BASE)
   
    debugger;
}


function _parentize(tuples) {   // turn dcwFlatTree into [[recId, parentRecId],...]
    let idx = 0, list = [];
    function walk(parent) {
        if (idx >= tuples.length) {
            return;
        }
        const [recId, data] = tuples[idx++];
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
