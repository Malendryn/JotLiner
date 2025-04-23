
// globally available functions to keep the main files cleaner  (BF stands for 'Backend Functions')

// FF.functions
// return---?snc? funcname-----------------Description-------------------------------------------------------
// ==== FROM index.js =================================================================================================
// module   async loadModule(modulePath)   load and return module, if has an init(), call that before returning

// ==== FROM fem_core_Functions.js ====================================================================================
// --------       shutdown(event)          called before server exits entirely.  closes database and does other cleanup
// -------- async msDelay(ms)              cause a delay of ms,  EG: 'await FF.msDelay(1500);'
// uuid   = async makeUUID()               make and return a UUID
// hash   = async makeHash(txt)            convert txt into a one-way SHA-1 hash value and return it
// -------- async clearDoc()               detach all docEventHandlers and docComponents, set innerHTML=""
// -------- async newDoc()                 call clearDoc(), then start brand new one with an empty DCH_BOX

// ==== FROM fem_core_WSockHandler.js ====================================================================================
// pkt    = makePacket(name)               create and return a new packet
// pkt    = parsePacket(stream)			   reconstruct a packet instance from the stream

// ==== FROM ????????????????????? ====================================================================================
// --------       logout()                 detach and forget current user and go back to login screen
// -------- async loadView(.jsName)        load a .js child of FG.ViewBASE from within the "views" subdir
// -------- async loadText(path)           load a text(or html) file (relative to rootPath) and return it
// -------- async updateTitleBar()         update the topmost titleBar showing curbook
// -------- async getBookById(bookId)      fetch book rec (from FG.bookList) for this bookId


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


FF.makeUUID = async () => {
	debugger; return crypto.randomUUID();
}


FF.makeHash = async (txt) => {
	debugger; return Array.from(
		new Uint8Array(
			await crypto.subtle.digest('SHA-1', new TextEncoder().encode(txt))
		),
		(byte) => byte.toString(16).padStart(2, '0')
	).join('');
}


FF.clearDoc = async() => {	// detach all listeners and remove entire document tree
	if (FG.docRoot) {
		FG.docRoot.destroy();
	}

// then nuke it all!
	const div = document.getElementById("docWrapper");  // attach div to outermost <div id="docWrapper">
	div.innerHTML = "";									// blowout any existing rendering
	FG.docRoot = null;
}


FF.newDoc = async () => {
	await FF.clearDoc();

// then create a new doc by adding a single BOX handler as the docRoot
	const dch = await FG.DCH_BASE.create("BOX", null, null);	// blowout any loaded handlers and create toplevel BOX
	// dch._div.style.position    = "absolute";
	dch._div.style.left   = "0px";	// note DO NOT use 'inset' here as we expect to read dch._div.style.top/bottom/etc during exportDoc()
	dch._div.style.top    = "0px";	// set here cuz .create() didn't get a DocParser passed to it
	dch._div.style.right  = "0px";
	dch._div.style.bottom = "0px";
	dch._div.style.backgroundColor = "lightgrey";	// RSTODO make this a user-definable scheme/style
	//	dch._div.style.overflow = "hidden";
	//	dch._div.style.whiteSpace = "nowrap";		// unnecessary in a BOX as everything inside it is more divs
	//
	FG.docRoot = dch;
};


// export async function init() {
//     return new Promise(async (resolve, reject) => {
//         debugger;       //dosomething
// 		await FF.msDelay(5000);
//         resolve(this);
//         return;
//         // reject(err); // ifError
//         // return;
//     });
// };



/*
RSTODO this stuff here is NOT CORE FUNCTIONS so move them somewhere else!


// we load views from .js rather than .view files so that we can code them with intellisense and highlighting

const _cssList = [];	// list of .css entries in header to remove when unloading page
FF.loadView = async (src) => {
	if (FG.curView) {
		if (!await FG.curView._beforeUnload()) {	// if unload returned false
			return;
		}
		for (let idx = 0; idx < _cssList.length; ++idx) {
			_cssList[idx].remove();
		}
		_cssList.length = 0;
	}
	FG.curView = null;									// in case import fails
	let clazz;
	try {
		clazz = await FF.loadModule("views/" + src);	// get the module
	} catch (err) {
		console.log(`Could not load view ${src}, reason=${err.message}`)
		process.exit(1);
	}
	clazz = clazz.default;								// get the class from within the module
	FG.curView = await clazz.create();					// create the class and call .onCreate() if present
	if ("getCssList" in FG.curView) {
		let css = await FG.curView.getCssList();
		if (!Array.isArray(css)) {
			css = [css];
		}
		for (let idx = 0; idx < css.length; ++idx) {
			const el = document.createElement("link");
//			el.id = "cssInjectedId" + idx;
			el.rel = "stylesheet";
			el.type = "text/css";
			el.href = css[idx];
			el.crossOrigin = "";	// to prevent CORS errors
			document.head.appendChild(el);
			_cssList.push(el);
		}
	}
	const tbar = document.getElementById('divToolbar');
	if ("getToolbarHTML" in FG.curView) {
		const innerHTML = await FG.curView.getToolbarHTML();	// fetch and instance the innerHTML
		tbar.innerHTML = innerHTML;
	}
	if ("getMainViewHTML" in FG.curView) {
		const innerHTML = await FG.curView.getMainViewHTML();	// fetch and instance the innerHTML
		document.getElementById('divMainView').innerHTML = innerHTML;
	}


//	document.addEventListener("beforeunload", FG.curView._beforeUnload);	//trap the unload event  (useless cuz async...)
	if ("onLoad" in FG.curView) {
		FG.curView.onLoad();								// and finally call the .onLoad() if present
	}
}


FF.loadText = async (src) => {
	return new Promise((resolve, reject) => {
		fetch(src)
		.then(async (response) => {
			if (!response.ok) {
				throw new Error(`Could not load '${path}', reason=${err.message}`);
			}
			const text = await response.text();
			resolve(text);
		}).catch((err) => {
			throw new Error(`Could not load '${path}', reason=${err.message}`);
		});
	});
}


FF.getBookById = function (bookId) {
	for (let idx = 0; idx < FG.bookList.length; ++idx) {
		if (bookId == FG.bookList[idx].bookId) {
			return FG.bookList[idx];
		}
	}
}


FF.updateTitleBar = async function() {
// used to hide/show the book dropdown in the titlebar, now just updates the booklist
	await populateDdsCurBook();		// this is only place this func is ever called so NOT attached to FF
}


async function populateDdsCurBook() {	// only called from FF.updateTitleBar() so NOT attached to FF
    const el = document.getElementById("ddsCurBook");
    el.innerHTML = "";
    let found = false;
    for (let idx = 0; idx < FG.bookList.length; ++idx) {
        const option = new Option(FG.bookList[idx].bookName, FG.bookList[idx].bookId);
        if (FG.bookList[idx].bookId == await FG.sessionInfo.getCurBookId()) {
            option.selected = true;
            found = true;
        }
        el.add(option);
    }
    let option;
    option = new Option("---------------------------------");
    option.disabled = true;
    el.add(option);
    option = new Option("Manage Books and Profiles", "bookManager");
    if (!found) {
        option.selected = true;
    }
    el.add(option);
}

*/