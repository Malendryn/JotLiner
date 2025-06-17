
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

    const newDcwFlatTree = this.dcwFlatTree;

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
}

//#####################################################################################################################
//#####################################################################################################################
//#####################################################################################################################
//#####################################################################################################################
function cvtFlatTree(flat, startIndex = 0, parent = null, index = 0) {
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

function flattenToDict(root, map = {}) {
    debugger; map[root.recId] = root;
    for (const child of root.children) {
        flattenToDict(child, map);
    }
    return map;
}

function walkFlatTreeDiff(oldFlat, newFlat, callbacks) {
    debugger; const oldTree = SF.flatToReal(oldFlat);
    const newTree = SF.flatToReal(newFlat);

    const oldDict = flattenToDict(oldTree);
    const newDict = flattenToDict(newTree);

    const visited = new Set();

    function walkNew(node, newParent = null, index = 0) {
        const { recId, data, children } = node;
        const oldNode = oldDict

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
