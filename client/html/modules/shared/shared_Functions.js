/***********************************************************************************************************************
globally available functions to keep the main files cleaner  (SF stands for 'Shared Functions')
***********************************************************************************************************************/


SF.flatToReal = function(tree) { //[[22,{N,S,C:1}],[33,{N,S,C:0}]] to [22,{N,S,C:[[33,{N,S,C:[]}]]}]
    let idx = 0;
    const real = [];
    function extract() {
        const kids = [];
        let   [recId,dict] = tree[idx++];
        dict = Object.assign({}, dict);     // make sure our mod to the dict is not to the original
        let   kidCt = dict.C;
        while (--kidCt >= 0) {
            kids.push(extract());
        }
        dict.C = kids;
        return [recId, dict];
    }
    return extract();
}

SF.realToFlat = function(tree) { 
    const flat = [];
    function extract(tree) {
        let  [recId,dict] = tree;
        dict = Object.assign({}, dict);     // make sure our mod to the dict is not to the original
        let kids = dict.C;
        dict.C = kids.length;
        flat.push([recId, dict]);
        for (let idx = 0; idx < kids.length; idx++) {
            extract(kids[idx]);
        }
    }
    extract(tree);
    return flat;
}

/*test
debugger;
let vv =                       '[[5,{"N":"BOX","S":{"L":0,"R":0,"T":0,"B":0,"Z":0},"C":2}],[6,{"N":"CTE","S":{"L":113,"W":100,"T":97,"H":100,"Z":0},"C":0}],[7,{"N":"BOX","S":{"L":114,"W":100,"T":176,"H":100,"Z":0},"C":0}]]'
let ww=JSON.parse(vv);
let xx = SF.flatToReal(ww);  //'[5,{"N":"BOX","S":{"L":0,"R":0,"T":0,"B":0,"Z":0},"C":[[6,{"N":"CTE","S":{"L":113,"W":100,"T":97,"H":100,"Z":0},"C":[]}],[7,{"N":"BOX","S":{"L":114,"W":100,"T":176,"H":100,"Z":0},"C":[]}]]}]'
let yy = SF.realToFlat(xx);
let zz = JSON.stringify(yy);
console.log (vv == zz);
debugger;
/*end test */