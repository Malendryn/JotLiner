
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
function trace(...args) {
    const lines = (new Error()).stack.split('\n');
    const fn_ln = __parseTraceNL(lines[2]);
    console.log("TRACE:" + fn_ln, ...args);
}
const trace2 = function(...args) {
    const lines = (new Error()).stack.split('\n');
    const fn_ln2 = __parseTraceNL(lines[2]);
    const fn_ln3 = __parseTraceNL(lines[3]);
    console.log("TRACE:" + fn_ln3 + "-->" + fn_ln2, ...args);
}
const trace3 = function(...args) {
    const lines = (new Error()).stack.split('\n');
    const fn_ln2 = __parseTraceNL(lines[2]);
    const fn_ln3 = __parseTraceNL(lines[3]);
    const fn_ln4 = __parseTraceNL(lines[4]);
    console.log("TRACE:" + fn_ln4 + "-->" + fn_ln3 + "-->" + fn_ln2, ...args);
}

export { trace, trace2, trace3 };

// globalThis.__FILE__ = function(all = false) {   // see 'trace' above for a better (and self-console.log'ing) version
// 	try {
// 		throw new Error();
// 	} catch (error) {
// 		const stackLines = error.stack.split('\n');		// convert stack trace to array

//         const lines = [];
//         for (let idx = 0; idx < stackLines.length; idx++) {
//             if (stackLines[idx].indexOf('@') > -1 || stackLines[idx].indexOf('at ') > -1) { // look for '@' or 'at '
//                 let filename = stackLines[idx].substring(stackLines[idx].lastIndexOf('/') + 1);
//                 filename = filename.substring(0, filename.lastIndexOf(':')); // of 'fname.js:lineno:idx)'return 'fname:lno'      //.indexOf(')'));
//                 lines.push(filename);
//             }
//         }

//         let line = "";
//         if (!all) {
//             if (lines) {
//                 line = lines[1];
//             }
//         } else {
//             for (let idx = lines.length; idx >= 1; idx--) {     // never use 0 as that's the 'throw new Error(' line above
//                 line += "\n >> " + lines[idx];
//             }
//         }
	
// 		if (line) { 
// 			return line;
// 		}
// 		return "<?noFileName?>.??:???";
// 	}
// };

