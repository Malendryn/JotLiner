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


function __parseTraceNL(line) {
    let fn_ln = "???:?";
    try {
        const match = line.match(/\(?([^():]+):(\d+):(\d+)\)?$/);
        if (match) {
            const fName = match[1].split('/').pop(); // get filename only
            const lineNo = match[2];
            fn_ln = fName + ":" + lineNo;
        }
    }
    catch(err) {}   // catch-and-ignore
    return fn_ln;
}
globalThis.trace = function(...args) {
    const lines = (new Error()).stack.split('\n');
    const fn_ln = __parseTraceNL(lines[2]);
    console.log("TRACE:" + fn_ln, ...args);
}
globalThis.trace2 = function(...args) {
    const lines = (new Error()).stack.split('\n');
    const fn_ln2 = __parseTraceNL(lines[2]);
    const fn_ln3 = __parseTraceNL(lines[3]);
    console.log("TRACE:" + fn_ln3 + "-->" + fn_ln2, ...args);
}
globalThis.trace3 = function(...args) {
    const lines = (new Error()).stack.split('\n');
    const fn_ln2 = __parseTraceNL(lines[2]);
    const fn_ln3 = __parseTraceNL(lines[3]);
    const fn_ln4 = __parseTraceNL(lines[4]);
    console.log("TRACE:" + fn_ln4 + "-->" + fn_ln3 + "-->" + fn_ln2, ...args);
}


globalThis.__FILE__ = function(all = false) {   // see 'trace' above for a better (and self-console.log'ing) version
	try {
		throw new Error();
	} catch (error) {
		const stackLines = error.stack.split('\n');		// convert stack trace to array

        const lines = [];
        for (let idx = 0; idx < stackLines.length; idx++) {
            if (stackLines[idx].indexOf('@') > -1 || stackLines[idx].indexOf('at ') > -1) { // look for '@' or 'at '
                let filename = stackLines[idx].substring(stackLines[idx].lastIndexOf('/') + 1);
                filename = filename.substring(0, filename.lastIndexOf(':')); // of 'fname.js:lineno:idx)'return 'fname:lno'      //.indexOf(')'));
                lines.push(filename);
            }
        }

        let line = "";
        if (!all) {
            if (lines) {
                line = lines[1];
            }
        } else {
            for (let idx = lines.length; idx >= 1; idx--) {     // never use 0 as that's the 'throw new Error(' line above
                line += "\n >> " + lines[idx];
            }
        }
	
		if (line) { 
			return line;
		}
		return "<?noFileName?>.??:???";
	}
};


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