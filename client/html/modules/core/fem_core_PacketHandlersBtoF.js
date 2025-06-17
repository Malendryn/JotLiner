
// import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";
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
    debugger; if (!FG.curDoc || FG.curDoc.uuid !== this.uuid) {   // MY curDoc is not changed so ignore packet
        return;
    }

    const newDcwFlatTree = new DFDict(this.tree);  // [[3,{"N":"BOX","S":{...},"C":1}],[4,{"N":"TXA","S":{...},"C":0}]]
    if (WS.lastPacketSent.__id == this.__id) {  // if this broadcastPkt came FROM me we have a special advantage
// essentially this.dcwFlatTree and FG.curDoc.rootDcw's flatTree should be identical EXCEPT the local
// flatree may have recId's of 0, so we need to set them with the ones in this.dcwFlatTree (and set the recId into the dch's too)
        debugger; if (WS.lastPacketSent.constructor.name == "AddDch") {
            let tmp = FF.getDcwList();  // this list is in dcwFlatTree order
            if (this.bump != WS.lastPacketSent.bump + 1) {  // Uhoh, someone else bumped mid-update! 
// the dcwFlatTree of the packet may not match our current dchTree and because we have recId's of 0 that need filling
// we're in an unreliable state.  best option at this point is to just nuke any dch's whos recId is 0 and continue on,
// letting the munger below handle re-inserting them fresh
                debugger; for (let idx = tmp.length - 1; idx >= 0; idx--) {   //  cycle through and remove() any dch's whos recId==0
                    if (tmp._s_dch._s_recId == 0) {
                        tmp.destroy();      // remove this dch/dcw and any children of it (does not autoSave!())
                    }
                }
            }
        } else {  // lastPkt.bump+1 matched thisPkt.bump, WE sent it, so insert recIds
            for (let idx = 0; idx < tmp.length; idx++) {
                const dcw = tmp[idx];
                const dch = dcw._s_dch;
                if (dch._s_recId == 0) {
                    dch._s_recId = newDcwFlatTree.getByIdx(idx)[0];  // dch already created, just need to insert recId genned by backend
                }
            }
        }
    }
    debugger; let tmp = new FG.DocExtracter();
    const oldDcwFlatTree = tmp.extract(FG.curDoc.rootDcw);

    const callbacks = {
        onInsert: (parent, index, recId, data) => {
          debugger; console.log(`INSERT ${recId} under ${parent} at ${index}`);
        },
        onRemove: (recId, data) => {
            debugger; console.log(`REMOVE ${recId}`);
        },
        onUpdate: (recId, oldData, newData) => {
            debugger; console.log(`UPDATE ${recId}`);
        },
        onMove: (recId, oldParent, newParent, oldIndex, newIndex) => {
            debugger; console.log(`MOVE ${recId} from ${oldParent}[${oldIndex}] to ${newParent}[${newIndex}]`);
        },
        onReorder: (parentId, recId, oldIndex, newIndex) => {
            debugger; console.log(`REORDER ${recId} under ${parentId}: ${oldIndex} → ${newIndex}`);
        }
    };
    debugger; walkFlatTreeDiff(oldDcwFlatTree, newDcwFlatTree, callbacks)
    debugger; let curIdx = 0;
    let newIdx = 0;
    while (curIdx < dcwList.length) {
        let curDcw  = dcwList[curIdx];
        let [curRecId,curData] = tmp;  // data={N,S,C}
//        let [newRecId,newData]

    }
}
    // await FF.selectAndLoadDoc(this.uuid, true);         // download and redisplay doc (force reload)
// } else if (this.dict.what === "docTree") {    // fetch an entirely new docTree & remove doc too if wasdeleted from docTree
//     debugger; await FF.loadDocTree();                                     // download new doctree from server
//     await FF.selectAndLoadDoc(FG.curDoc && FG.curDoc.uuid);     // download and display new tree, re-select curDoc too
// } else if (this.dict.what === "dbList") {
//     debugger; FF.updateDBSelector();      // get available dbs from server, populate dbDropdown in titlebar, fireup FF.selectDB() workhorse!
// }


/*
(actually revisit autosave such that there's no queue just a single timer SO THAT something like an autoSave(0) means all-right-now
    and we can get rid of the flushAll() too)
    1) AddDch  B<-F docUuid, dchId, dcwFlatTree(with 0 where this AddDch gets inserted)
    2) insert rec into dch to get its recId
    3) update dcwFlatTree
    4) update doc with dcwFlatTree and get its bump+1
    5) put bump into dch via recId
    6) Changed B->F docUuid, AddDchId, newdcwFlatTree
since pktAddDch already forced a bump+1 on doc, pktModDoc doesn't /need/ to
*/


//#####################################################################################################################
//#####################################################################################################################
//#####################################################################################################################
//#####################################################################################################################
function cvtFlatTree(flat, startIndex = 0, parent = null, index = 0) {  // cvt [[11,{c:1}],[22,...]] to {11:{c:[22]}}
    debugger; const [recId, data] = flat[startIndex];
    const node = {
        recId,
        data,
        parent,
        index,
        children: []
    };
    let curIdx = startIndex + 1;
    let kidsLeft = data.C;

    while (kidsLeft > 0) {
        const [childNode, newIdx] = cvtFlatTree(flat, curIdx, node, node.children.length);
        node.children.push(childNode);
        curIdx = newIdx;
        kidsLeft--;
    }

    return [node, curIdx];
}

function flattenByRecId(root, map = {}) {
    debugger; map[root.recId] = root;
    for (const child of root.children) {
        flattenByRecId(child, map);
    }
    return map;
}

function walkFlatTreeDiff(oldFlat, newFlat, callbacks) {
    debugger; const [oldTree] = cvtFlatTree(oldFlat);
    const [newTree] = cvtFlatTree(newFlat);

    const oldMap = flattenByRecId(oldTree);
    const newMap = flattenByRecId(newTree);

    const visited = new Set();

    function walkNew(node, newParent = null, index = 0) {
        const { recId, data, children } = node;
        const oldNode = oldMap[recId];
        visited.add(recId);

        if (!oldNode) {
            callbacks.onInsert?.(newParent?.recId ?? null, index, recId, data);
        } else {
            // Possible update
            if (JSON.stringify(oldNode.data) !== JSON.stringify(data)) {
                callbacks.onUpdate?.(recId, oldNode.data, data);
            }

            const oldParentId = oldNode.parent?.recId ?? null;
            const newParentId = newParent?.recId ?? null;

            if (oldParentId !== newParentId) {
                callbacks.onMove?.(recId, oldParentId, newParentId, oldNode.index, index);
            } else if (oldNode.index !== index) {
                callbacks.onReorder?.(newParentId, recId, oldNode.index, index);
            }
        }

        for (let i = 0; i < children.length; i++) {
            walkNew(children[i], node, i);
        }
    }

    walkNew(newTree);

    // Now detect removals
    for (const recId in oldMap) {
        if (!visited.has(+recId)) {
            callbacks.onRemove?.(Number(recId), oldMap[recId].data);
        }
    }
}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////
// const oldFlat = [
//   [1, { N: 'A', S: {}, C: 1 }],
//   [2, { N: 'B', S: {}, C: 0 }]
// ];

// const newFlat = [
//   [1, { N: 'A', S: {}, C: 2 }],
//   [3, { N: 'C', S: {}, C: 0 }],
//   [2, { N: 'B', S: {}, C: 0 }]
// ];

// walkFlatTreeDiff(oldFlat, newFlat, {
//   onInsert: (parent, index, recId, data) => {
//     console.log(`INSERT ${recId} under ${parent} at ${index}`);
//   },
//   onRemove: (recId, data) => {
//     console.log(`REMOVE ${recId}`);
//   },
//   onUpdate: (recId, oldData, newData) => {
//     console.log(`UPDATE ${recId}`);
//   },
//   onMove: (recId, oldParent, newParent, oldIndex, newIndex) => {
//     console.log(`MOVE ${recId} from ${oldParent}[${oldIndex}] to ${newParent}[${newIndex}]`);
//   },
//   onReorder: (parentId, recId, oldIndex, newIndex) => {
//     console.log(`REORDER ${recId} under ${parentId}: ${oldIndex} → ${newIndex}`);
//   }
// });
