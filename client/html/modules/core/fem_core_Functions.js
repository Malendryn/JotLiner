/***********************************************************************************************************************
globally available functions to keep the main files cleaner  (GF stands for 'Frontend Functions')

FF.functions
retval---?snc? funcname-----------------Description-------------------------------------------------------
==== FROM index.js =================================================================================================
module = async loadModule(modulePath)   load and return module, if has an export init(), call that before returning

==== FROM fem_core_Functions.js ====================================================================================
--------       shutdown(event)          called before server exits entirely.  closes database and does other cleanup
-------- async msDelay(ms)              cause a delay of ms,  EG: 'await FF.msDelay(1500);'
uuid   = async makeUUID()               make and return a UUID
hash   = async makeHash(txt)            convert txt into a one-way SHA-1 hash value and return it
-------- async clearDoc()               detach all docEventHandlers and docComponents, set innerHTML=""
-------- async newDoc()                 call clearDoc(), then start brand new one with an empty DCH_BOX
{...}  =       parseRgba(rgbString)     turn "rgb(1,2,3)" or "rgba(1,2,3,4)"" into {r:1, g:2, b:3[, a:4]}
{...}  =       getDocInfo(uuid)			find uuid in FG.docTree and return {...}

==== FROM fem_core_WSockHandler.js ====================================================================================
pkt    = makePacket(name)               create and return a new packet
pkt    = parsePacket(stream)			   reconstruct a packet instance from the stream

==== FROM fem_core_ContextMenu.js ====================================================================================
action = openContextMenu(entries, callback)
	entries format is:  
		let entries = [
			[ "action", "entryText", "tooltip Text" ],
			[ "action", "entryText", "tooltip Text" ],
		];
	callback format is:
	    function callback(action)

==== FROM fem_core_PopupDialog.js ====================================================================================
FF.openPopup(X, Y, W, H, form, dict, callback)    Generic popup handler
 	T/F = callback(isCancel)  (return true to allow <save> else F keeps dialog open)

==== FROM ????????????????????? ====================================================================================
--------       logout()                 detach and forget current user and go back to login screen
-------- async loadView(.jsName)        load a .js child of FG.ViewBASE from within the "views" subdir
-------- async loadText(path)           load a text(or html) file (relative to rootPath) and return it
-------- async updateTitleBar()         update the topmost titleBar showing curbook
-------- async getBookById(bookId)      fetch book rec (from FG.bookList) for this bookId
***********************************************************************************************************************/

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
FF.shutdown = (event) => {                       // webpage closing, do final terminations/cleanups
    // debugger;
	//  if (BG.db) {
    //     // RSTODO if BG.db=open
    //     debugger; BG.db.close();
    // }

	if (true) {		// to ask before exiting do this:   (THIS IS NOT STOPPING ME FROM LEAVING THE PAGE,  howto prevent?)
		event.preventDefault();
		const confirmationMessage = 'Are you sure you want to leave?';
		event.returnValue = confirmationMessage;	
		return confirmationMessage;
	} else {		// or to leave with no confirmation do this:
		return;
	}
}
window.addEventListener("beforeunload", FF.shutdown);


FF.msDelay = (ms) => {  // this is primarily just a sample function
    return new Promise(resolve => setTimeout(resolve, ms)); 
}


FF.makeUUID = () => {
	return crypto.randomUUID();
}


FF.makeHash = async (txt) => {
	debugger; return Array.from(
		new Uint8Array(
			await crypto.subtle.digest('SHA-1', new TextEncoder().encode(txt))
		),
		(byte) => byte.toString(16).padStart(2, '0')
	).join('');
}


FF.clearDoc = async() => {
	if (FG.curDoc) {
		FG.curDoc.rootDch.destroy();	// detach all listeners and remove entire document tree
	}

// then nuke it all!
	const div = document.getElementById("divDocView");  	// blowout entire existing rendering
	div.innerHTML = "";
    FG.curDoc = null;
}


FF.getDocInfo = function (uuid) {
	for (let idx = 0; idx < FG.docTree.length; idx++) {
		if (FG.docTree[idx].uuid == uuid) {
			return FG.docTree[idx];
		}
	}
	return null;
}


FF.parseRgba = function (rgbString) {     // turn "rgb(1,2,3)" or "rgba(1,2,3,4)"" into {r:1, g:2, b:3[, a:4]}
    // Check if the input is a valid rgb or rgba string
    if (!rgbString.startsWith('rgb')) {
        return null; // Or throw an error:  throw new Error('Invalid RGB string');
    }
  
    // Remove 'rgb(' and ')' or 'rgba(' and ')'
    let colorValues = rgbString.substring(rgbString.indexOf('(') + 1, rgbString.lastIndexOf(')')).split(',');
  
    //check if the alpha channel exists
    const hasAlpha = rgbString.startsWith('rgba');
    const expectedValues = hasAlpha? 4: 3;
    if(colorValues.length !== expectedValues){
        return null; //Or throw an error
    }
  
    // Convert the values to numbers.  Use parseFloat to handle decimals in rgba.
    const r = parseInt(colorValues[0].trim(), 10);
    const g = parseInt(colorValues[1].trim(), 10);
    const b = parseInt(colorValues[2].trim(), 10);
    const a = hasAlpha ? parseFloat(colorValues[3].trim()) : 1; // Default alpha is 1 if not provided
  
    // Check if the parsed values are valid
    if (
        isNaN(r) || r < 0 || r > 255 ||
        isNaN(g) || g < 0 || g > 255 ||
        isNaN(b) || b < 0 || b > 255 ||
        (hasAlpha && (isNaN(a) || a < 0 || a > 1))
    ) {
        return null; // Or throw an error: throw new Error('Invalid RGB/RGBA values');
    }
  
    return hasAlpha? { r, g, b, a } : { r, g, b }; // Return as an object
}


// export async function init() {
//     return new Promise((resolve, reject) => {
//         debugger;       //dosomething
// 		await FF.msDelay(5000);
//         resolve(this);
//         return;
//         // reject(err); // ifError
//         // return;
//     });
// };

function __getFileLineInfo(err) {
	try {
		throw err;
	} catch (error) {
		// Split the stack trace to find the line that initiated the current script
		const stackLines = error.stack.split('\n');
		// The line we are interested in is the one that contains the script's URL
		let currentScriptLine = null;
		let skip = 1;
		for (let i = 0; skip >= 0 && i < stackLines.length; i++) {
			if (stackLines[i].indexOf('@') > -1 || stackLines[i].indexOf('at ') > -1) {
				currentScriptLine = stackLines[i];
				--skip;	// skip 1st one found as that's THIS file!
			}
		}
	
		if (skip == -1 && currentScriptLine) { 
			let filename = currentScriptLine.substring(currentScriptLine.lastIndexOf('/') + 1);
			filename = filename.substring(0, filename.indexOf(')'));
			// let url = currentScriptLine.match(/(https?:\/\/[^/]+)?(\/[^:]+)/);
			// if (url && url.length > 2) {
			// 	const path = url[2];
			// 	const filename = path.substring(path.lastIndexOf('/') + 1);
			// 	return filename;
			// } else if (currentScriptLine.indexOf("blob:") > -1) {
			// 	let url = currentScriptLine.match(/(blob:\/\/[^/]+)/);
			// 	if (url && url.length > 0) {
			// 		return "<notfound>.js"; //Cannot get the name of the script.
			// 	}
			// }
			return filename;
		}
		return "<?noFileInfo?>.???";
	}
}

FF.__FILE__ = function() {
	return __getFileLineInfo(new Error());
}
