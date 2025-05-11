/////////////////////////////////////////////////////////
// Licensed under Apache 2.0 - see LICENSE for details //
/////////////////////////////////////////////////////////

// herein is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// NOTE: do not instance any DCH class directly, use FG.DCH_BASE.create() instead
FG._idCounter = 0;

FG.DCH_BASE = class DCH_BASE {   // base class of all document components
////////// vars extending classes MUST provide on their own!  /////////////////////////////////////////////////////////
    hasDiv = true;          // true = create 'this.__sysDiv' @ construction AND read styles from stream when created via DocImporter
    hasToolbar = false;     // true = create this.toolbar' @ construction

    parent;          // parent component of this component (or null if topLevel, (typically ONLY a DOC element will ever be null))

// *** these next few are where inheriting classes add their own html elements.  these should never be modified in any other way. ***
    host    = null;    // ownedBy BASE. if hasDiv:     an 'absolute' <div> where child classes add visual elements (like <textarea> etc)
    toolbar = null;    // ownedBy BASE. if hasToolbar: an 'absolute' <div> where child classes add 'icons and toolbar stuff' to
                     // for listeners, use this.addDCHListener() & this.removeDCHListener...()  so dch can autoremove when destroying

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// these next values are static so we can access them at the class level for building menus and accessing files, etc
    static srcUrl = "";        // SYSTEM supplied; (do not change!) relative url to module's subdir (so can access own icons, etc...)
    static menuText    = null; // CHILD supplied;  text to show in 'add editor' menus (skipped if null)
    static menuTooltip = null; // CHILD supplied;  tooltip to show when hovering over menuText in menus (skipped if null)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// child-CAN-IMPLEMENT functions -------------------------------------------------------------------------------------
// ****NOTE it is CRITICAL that these functions fully complete their ops before returning (EG must be async/await)
    //        async construct(data=null)     // called by static create() after this.host created and saved styles applied
                                                // if data != null, it contains a {} of data to be put on 'this' as properties
                                                // in here is where to add your own <el>s and listeners to .host, etc..
    //        async destruct()               // called immediately before removing all listeners and html, and destroying object
    //        async importData(data)         // populate this component with data{} (calls Object.assign if NOT overridden)
    // text = async exportData()             // return data to be preserved/exported as a {}
    
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// create/destroy and other helper functions on baseclass (do not override!)----------------------------------------------------
    //  async create('box', parent=null, style=null)  // create new DocComponentHandler of type 'dchName'
                    // whos parent is parent
                    // and if .hasDiv and style populate div style with style data
                    // finally call this.construct() for post-construction activities

    //  async destroy(); // recursive, calls this.destruct(), then removes all listeners, then destroys it

    // async loadCss("file.css")  // attach a <link rel="stylesheet" href="<yourmodulepath>/file.css"> to the <head>

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// listener add/remove functions --------------------------------------------------------------------------------------
//RSTODO OBSOLETE these have been replaced by FF.addTrackedListener, FF.removeTracked...
    //OBSOLETE  id   = addDCHListener(el, action, callback, opts=undefined)
    //OBSOLETE  succ = removeDCHListenerById(id)
    //OBSOLETE         removeAllDCHListeners()
// NOTE it is perfectly valid for 'el' to be 'document' or 'window' and it will get auto-removed when dch is removed

// BE WARNED /NOW/ listeners added by addTrackedListener for an element that is NOT a child of 'this.host' WILL NOT be
// auto-removed when the dch is destroyed! so if the child class needs to implement them they must add and remove them
// by themselves.  (they can still use addTrackedListener and removeTracked...  but they just won't be automatically)
// removed on destruction

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// internal functions,  (do not override!)-----------------------------------------------------------------------------
//  none!

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// system-only properties, they should never be modified by the child class in any way

__sysDiv = null;     // ownedBy DCH_BASE. ...  if hasDiv==true, this will be a handle to an 'absolute' <div> that is
                     // the parent of every other element created by this component (autocreated during create())


    static async create(dchName, parent=null, style=null) {
        const dch = new DCH[dchName].dchClass();            // create handler, do nothing else!
        dch.srcUrl = DCH[dchName].srcUrl;                   // set the path to its available content
        dch.parent = parent;
        if (dch.hasDiv) {                                       // is dch a visible object that needs a <div> to render in? 
            dch.__sysDiv = document.createElement("div");       // create div
            dch.__sysDiv.id = (FG._idCounter++).toString();
            dch.__sysDiv.tabIndex = -1;                         // doing this makes the .__sysDiv focussable but not tabbable
            dch.__sysDiv._dchHandler = dch;                     // ptr to let me work with it from any child
            dch.__sysDiv._dchMouseOp = "dchComponent";          // to let us know via mouse/kbd evts that this is <el> is a dch component
            let parentDiv;
            if (dch.parent == null) {                               // if self has no parent...
                parentDiv = document.getElementById("divDocView");  // attach div to toplevel div
            } else {
                parentDiv = dch.parent.host                    // else attach to parent's host <div>
            }
            dch.__sysDiv.style.position  = "absolute";      // the wrapping 'dch.__sysDiv' is ALWAYS absolute!
            dch.__sysDiv.style.boxSizing = "border-box";    // prevent adding padding and borders to dch's .getBoundingClientRect()
            dch.__sysDiv.style.padding   = "0px";
            dch.__sysDiv.style.margin    = "0px";
            dch.__sysDiv.style.minWidth = "20px";
            dch.__sysDiv.style.minHeight = "20px";
            parentDiv.appendChild(dch.__sysDiv);

            if (dchName == "BOX") {                    // if it's a BOX, DON'T give it a shadowDom! 
                dch.host = document.createElement("div");   // this is now where all child elements get appended to
                dch.host.id = (FG._idCounter++).toString();
                dch.host.style.position = "absolute";
                dch.host.style.inset = "0px";           // make sure this div stays sized to the __sysDiv
                dch.__sysDiv.appendChild(dch.host);      
            } else {                                // if it's NOT a BOX, give it a shadowDom!
                dch.__host = document.createElement("div"); 
                dch.__host.id = (FG._idCounter++).toString();
                dch.__host.style.position = "absolute";
                dch.__host.style.inset = "0px";           // make sure this div stays sized to the __sysDiv
                dch.__sysDiv.appendChild(dch.__host);      
                dch.__shadow = dch.__host.attachShadow({ mode: "open" });
                dch.__host.classList.add("shadowBox");            // see index.css
                // dch.__host.classList.add("disable");           // dont add this here, example only!
                dch.host = document.createElement("div")          // this is now where all child elements get appended to
                dch.host.id = (FG._idCounter++).toString();
                dch.host = dch.__shadow.appendChild(dch.host);    // give it its first element as it has none to start with
            }

            if (style) {
                for (const key in style) {              // get and parse the style values
                    const val = style[key] + "px";      // get the value and append "px"
                    switch(key) {
                        case 'L':   dch.__sysDiv.style.left   = val;   break;
                        case 'R':   dch.__sysDiv.style.right  = val;   break;
                        case 'W':   dch.__sysDiv.style.width  = val;   break;
                        case 'T':   dch.__sysDiv.style.top    = val;   break;
                        case 'B':   dch.__sysDiv.style.bottom = val;   break;
                        case 'H':   dch.__sysDiv.style.height = val;   break;
                    }
                }
            }
        }
        if (dch.hasToolbar) {
            dch.toolbar = document.createElement("div");
            dch.toolbar._dchHandler = dch;                      // same for the toolbar
            dch.toolbar._dchMouseOp = "dchToolBtn";
            dch.toolbar.style.position = "absolute";
            dch.toolbar.style.inset = "0px 0px 0px 0px";       // top, right, bottom, left
            dch.toolbar.style.backgroundColor = "rgb(155, 253, 161)";
            dch.toolbar.style.display = "none";                // do not display it at creation time!
            
            let parentDiv = document.getElementById("divToolbar");
            parentDiv.appendChild(dch.toolbar);                // add the toolbar as a direct child of "divToolBar"
        }
        
        await dch.construct();
        return dch;
    }

    async importData(data) {Object.assign(this, data); }   // *overridable* populate this component with data
    async exportData()     { return {}; }                  // *overridable* return data to be preserved/exported as a {}
    async destruct()       {}                              // *overridable* do any other kind of cleanup before class destruction

    async destroy() { // detach this dch from doc, removing all listeners too, and destroy it
        FF.removeAllTrackedListeners(this.__sysDiv);      // remove all listeners registered to this dch FIRST
        await this.destruct();
        if (this.hasDiv && this.__sysDiv) {
            this.__sysDiv.remove();
        }
        if (this.hasToolbar && this.toolbar) {
            this.toolbar.remove();
        }
    }

    
    async loadCss(cssFile) {
        // console.log(FF.__FILE__(), "HERE IS WHERE WE LOAD CSS");
        const cssPath = this.srcUrl + "/" + cssFile;
        const response = await fetch(cssPath);
        if (!response.ok) {
            throw new Error("could not load requested css file '" + cssFile + "'");
        }
        const data = await response.text();

        // const style = "<style>\n" + data + "\n</style>\n";
        const el = document.createElement("style");
        el.textContent = data;
        this.host.prepend(el);

    }


    // static __registeredEventListeners = [];     // [[id, dch(this), el, action, callback, opts]]
    // static __nextListenerId = 1;
    // addDCHListener = function(el, action, callback, opts=undefined) {
    //     let id = FG.DCH_BASE.__nextListenerId++;
    //     FG.DCH_BASE.__registeredEventListeners.push([id, this, el, action, callback, opts]);
    //     el.addEventListener(action, callback/*.bind(this)*/, opts); // so the callback knows what dchComp it's working with
    //     return id;
    // }

    
    // removeDCHListenerById = function(id) {
    //     debugger; for (let idx = 0; idx < FG.DCH_BASE.__registeredEventListeners.length; idx++) {
    //         let tmp = FG.DCH_BASE.__registeredEventListeners[idx];
    //         if (tmp[0] == id) {
    //             tmp[2].removeEventListener(tmp[3], tmp[4]);            // unlisten
    //             FG.DCH_BASE.__registeredEventListeners.splice(idx, 1);    // and remove
    //             return true;
    //         }
    //     }
    //     return false;
    // }
    

    // removeAllDCHListeners = function() {   //        console.log("fem_core_DCH_BASE.js:removeAllDCHListeners");
    //     for (let idx = FG.DCH_BASE.__registeredEventListeners.length - 1; idx >= 0; idx--) {
    //         let tmp = FG.DCH_BASE.__registeredEventListeners[idx];        // [id, dch, el, action, callback, opts]
    //         if (tmp[1] == this) {
    //             tmp[2].removeEventListener(tmp[3], tmp[4]);            // unlisten
    //             FG.DCH_BASE.__registeredEventListeners.splice(idx, 1);    // and remove
    //         }
    //     }
    // }
}; // end class

