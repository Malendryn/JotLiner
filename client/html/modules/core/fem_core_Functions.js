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

--------       setIdxpanded(num, yesno) // set/remove entryId of docTreeRec to recall expanded/collapsed indexTree state

{...}  =       parseRgba(rgbString)     turn "rgb(1,2,3)" or "rgba(1,2,3,4)"" into {r:1, g:2, b:3[, a:4]}
{...}  =       getDocInfo(uuid)			find uuid in FG.docTree and return {...}
"txt"  =       __FILE__()               returns "filename.js:linenum"; of any file this is called from within
--------       reTimer(callback)        x = reTimer(callback);   x(5000); make timer, that can be set and reset
--------       autoSave(delay=5000)     uses a reTimer() to autoSave FG.curDoc after (delay) millisecs has passed
-------- async waitDirty()              spin-wait up to 15 secs while (FG.curdoc && FG.curDoc.dirty)


==== FROM fem_core_WSockHandler.js ====================================================================================
pkt    = makePacket(name)               create and return a new packet
pkt    = parsePacket(stream)			reconstruct a packet instance from the stream

==== FROM fem_core_TitlebarHandler.js
-------- async updateDBSelector()   fetch list of available dbs from server, populate dbDropdown in Titlebar 
                                    (also deletes localStorage keys if they disappeared)

-------- async selectDB()           workhorse;  tells Server which db to attach to, gets the docTree for that db, 
                                    selects the last selected doc from tree, displays doc for editing


==== FROM fem_core__IndexViewHandler.js =============================================================================
-------- async loadDocTree()                  get docTree from server, display it in index pane,  DOES NOT select any entries!
-------- async loadDoc(uuid,force)            fetch doc from backend, update display, update localStorage
-------- async selectAndLoadDoc(uuid,force)   update selection in indexView, load selected doc in dchView, update localStorage

==== FROM fem_core_DocViewHandler.js ==================================================================================
[]     =       getAllDch()              get list of all dch's in FF.curDoc.rootDch. (in same order as exporter puts them)
--------       getDchName(dch)          return name of dch as the subdirName in DocComponentHandlers
--------       getRawRect(el)           return LWRTHB of el direct from .style property
--------       moveDivRelative(el, deltaX, deltaY)  move a div by x/y pixels, accounting for LWRTHB anchors too
--------       moveDivAbsolute(el, locX, locY)      move a div to locX/Y, accounting for LWRTHB anchors too
--------       sizeDivRelative(el, nesw, dltX,dlty) resize a div based on nesw walls, (n,ne,e,se,...)  acct. anchors too

***********************************************************************************************************************/
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

import { DFEncoder,DFDecoder } from "/public/classes/DFCoder.mjs";


FF.shutdown = async (event) => {                       // webpage closing, do final terminations/cleanups

    if (FG.curDoc && FG.curDoc.dirty) {     // if something's still dirty
        FF.autoSave(0);                     // force immediate saving
        FF.waitDirty();                     // and wait for it to complete
    }

// obsolete, with waitDirty() we don't need to pop any dialogs any more
	// if (true) {		// to ask before exiting do this:   (THIS IS NOT STOPPING ME FROM LEAVING THE PAGE,  howto prevent?)
	// 	event.preventDefault();
	// 	const confirmationMessage = 'Are you sure you want to leave?';
	// 	event.returnValue = confirmationMessage;	
	// 	return confirmationMessage;
	// } else {		// or to leave with no confirmation do this:
	// 	return;
	// }
}
window.addEventListener("beforeunload", FF.shutdown);


FF.msDelay = (ms) => {  // this is primarily just a sample function
    return new Promise(resolve => setTimeout(resolve, ms)); 
}


FF.makeUUID = () => {
	return crypto.randomUUID();
}


FF.makeHash = async (txt) => {
	return Array.from(
		new Uint8Array(
			await crypto.subtle.digest('SHA-1', new TextEncoder().encode(txt))
		),
		(byte) => byte.toString(16).padStart(2, '0')
	).join('');
}


FF.clearDoc = async() => {
    WS.clearExpectByName("GetDoc");       // remove any pending GetDoc waitfors
    if (FG.curDoc) {
        WS.clearBatchExpect("GetDchData", FG.curDoc.uuid); // remove any pending GetDchData batch waitfors  
    
        if (FG.curDoc.dirty) {
            FF.autoSave(0);
            await FF.waitDirty();       // wait until doc save is clean
            console.log("beep");
        }
        await FG.curDoc.rootDch.destroy();	// detach all listeners and remove entire document tree
        FG.curDoc = null;
    }
    const el = document.getElementById("divDocView");
    el.classList.add("disabled");
    el.innerHTML = "Select an entry from the left pane";
}


FF.getDocInfo = function (uuid) {
	for (let idx = 0; idx < FG.docTree.length; idx++) {
		if (FG.docTree[idx].uuid == uuid) {
			return FG.docTree[idx];
		}
	}
	return null;
}


FF.setIdxpanded = function(docTreeId, yesno) {    
    let opened = LS.openIndexes;
    opened = opened.filter(item => item !== docTreeId);         // remove this id if already exists
    if (yesno) {
        opened.push(docTreeId);                                 // add (or add again) if needed
    }
    LS.openIndexes = opened;
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
			filename = filename.substring(0, filename.lastIndexOf(':')); // of 'fname.js:lineno:idx)'return 'fname:lno'      //.indexOf(')'));
			return filename;
		}
		return "<?noFileInfo?>.???";
	}
}
FF.__FILE__ = function(all = false) {
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
}


FF.reTimer = function(callback) {
	let id = 0;
	const startTimeout = async (delay, dict=null) => {	// delay = -n=kill, 0=callback(dict)Immediate, +n=delay ms then callback(dict)
		if (id > 0) {                               // kill any current running timer
			clearTimeout(id);
			id = 0;
		}
        if (delay == 0) {
            await callback(dict);               // when delay == 0 we await
        }
		if (delay > 0) {
			id = setTimeout(async () => {       // by making this async() in this way we... 
                callback(dict);
            }, delay);	// start new timer
		}
	}
	return startTimeout;
    console.log(FF.__FILE__(), "*** AUTOSAVE DISABLED ***");
}


const autoSaveCallback = async function() {
    if (FG.curDoc && FG.curDoc.dirty) {
        let extracter = new FG.DocExtracter();
        let encoder = new DFEncoder();

        let tmp = {
            dchList: await extracter.extract(FG.curDoc.rootDch, false),
        };
        tmp = encoder.encode(tmp);

        let pkt = WS.makePacket("SaveDoc")
        pkt.dict = {                        // NOTE: no version or name, only uuid and content
            uuid:       FG.curDoc.uuid,
            doc:        tmp
        }
        pkt = WS.send(pkt);	        // send to backend, /maybe/ get a response-or-Fault, ?don't care?
    	FG.curDoc.dirty = false;
    }
}
FF._autoSaveFunc = FF.reTimer(autoSaveCallback);		// '_' cuz this should only ever be called from FF.autoSave() below

FF.autoSave = function(delay=1000) {    // since we're talking to 'local' backend this can happen fast,  1 sec, maybe even less?
    if (FG.curDoc) {               // if we have a doc and it's not marked dirty    
        FG.curDoc.dirty = true;    // set dirty flag immediately
        FF._autoSaveFunc(delay);   // start-or-restart the autosave countdown
    }
}

FF.waitDirty = async function() {
    let tm, end = Date.now() + 15000;   // set end 15secs into the future
    return new Promise(async (resolve, reject) => {
        function waitOnDirty() {
            if (FG.curDoc && FG.curDoc.dirty && Date.now() < end) { // if doc and dirty and notyet15secs...
                tm(10);                     // spin very fast to not delay 'user experience'
            } else {
                resolve();
                return;
            }
        }
        tm = FF.reTimer(waitOnDirty);
        tm(10);                             // start the dirtychecker
    });
}

FF.showLS = function() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`${key}: ${value}`);
    }
}

FF.dump1 = function(u8a) {
    console.log(Array.from(u8a).map(byte => byte.toString(16).padStart(2, '0')).join(' '));
}

FF.dump2 = function(u8a) {
    let ss = "";
    for (let idx = 0; idx < u8a.byteLength; idx++) {
        if (idx % 16 == 0) {
            if (ss) {
                console.log(ss);
            }
            ss = idx.toString(16).padStart(4, '0') + " ";
        } 
        const byte = u8a[idx];
        ss += " " + byte.toString(16).padStart(2, '0') + ':' + String.fromCharCode(byte);
    }
    if (ss) {
        console.log(ss);
    }
}

