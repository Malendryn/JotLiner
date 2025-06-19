/***********************************************************************************************************************
globally available functions to keep the main files cleaner  (SF stands for 'Shared Functions')
***********************************************************************************************************************/



// SF.xflatToReal = function(tree) { //[[22,{N,S,C:1}],[33,{N,S,C:0}]] to [22,{N,S,C:[[33,{N,S,C:[]}]]}]
//     let idx = 0;
//     const real = [];
//     function extract() {
//         const kids = [];
//         let   [recId,dict] = tree[idx++];
//         dict = Object.assign({}, dict);     // make sure our mod to the dict is not to the original
//         let   kidCt = dict.C;
//         while (--kidCt >= 0) {
//             kids.push(extract());
//         }
//         dict.C = kids;
//         return [recId, dict];
//     }
//     return extract();
// }


// cvt [[11,{N,S,C:0}]] to '{recId:11,data:{N,S},parent:null,index:0,children:[]}'
SF.flatToReal = function (flat) {
    let idx = 0;
    function extract(flat, parent=null) {  
        const [recId, data] = flat[idx++];
        let kidsLeft = data.C;
        const node = {
            recId:  recId,
            data:   {N: data.N, S: Object.assign({}, data.S)}, // lose the C: cuz it's now 'children:[]'
            // parent: parent,                                    // for adding/removing
            // index:  (parent) ? parent.children.length : 0,     // for reordering/relocating
            children: []
        };
        while (kidsLeft-- > 0) {
            const childNode = extract(flat, node);
            node.children.push(childNode);
        }
        return node;
    }
    return extract(flat);
}


SF.realToFlat = function(tree) {
    const flat = [];
    function extract(tree) {
        let pair = [tree.recId, Object.assign({}, tree.data)];     // [ 33, {N,S} ]
        pair[1].C = tree.children.length;       // [ 33, {N:S,C:#} ]
        flat.push(pair);
        for (let idx = 0; idx < tree.children.length; idx++) {
            extract(tree.children[idx]);
        }
    }
    extract(tree);
    return flat;
}


/*test
let vv =                       '[[5,{"N":"BOX","S":{"L":0,"R":0,"T":0,"B":0,},"C":2}],[6,{"N":"CTE","S":{"L":113,"W":100,"T":97,"H":100},"C":0}],[7,{"N":"BOX","S":{"L":114,"W":100,"T":176,"H":100},"C":0}]]'
let ww=JSON.parse(vv);
let xx = SF.flatToReal(ww);  //'[5,{"N":"BOX","S":{"L":0,"R":0,"T":0,"B":0},"C":[[6,{"N":"CTE","S":{"L":113,"W":100,"T":97,"H":100},"C":[]}],[7,{"N":"BOX","S":{"L":114,"W":100,"T":176,"H":100},"C":[]}]]}]'
let yy = SF.realToFlat(xx);
let zz = JSON.stringify(yy);
console.log (vv == zz);
/*end test */