// herein is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// NOTE: do not instance any DCH class directly, use FG.DCH_BASE.create() instead


FG.DCH_BASE = class DCH_BASE {   // base class of all document components
////////// vars extending classes MUST provide on their own!  /////////////////////////////////////////////////////////
    hasDiv = true;  // true = create 'this._div' @ construction AND read styles from stream when created via DocImporter
    parent;         // parent component of this component (or null if topLevel)
    _div = null;    // OWNEDBY BASE! ...  if hasDiv==true, this will be a handle to an 'absolute' <div> that must be
                    // the parent of every other element created by this component (autocreated during create())
    children = [];  // IF POPULATED exporter will automatically handle it, likewise during creating/importing component

    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// child-must-implement functions -------------------------------------------------------------------------------------
    //        async construct(data=null)     // called by static create() after <div> created and styles applied
                                             // if data != null then it contains a {} of data to be put on the object
                                             // in here is technically where to add your own <> elements and listeners
    //        async destruct()               // detach and destroy all <el> added by construct() (but not this._div)

    //        async importData(data)         // populate this component with data{} (calls Object.assign if NOT overridden)
    // data = async exportData()             // return data to be preserved/exported as a {}
    
    //X        async render()                 // render object into its own 'this._div' docElement (called every time any change occurs)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// create/destroy helper functions ------------------------------------------------------------------------------------
    // handler = async create('box', parent=null, style=null)  // create new DocComponentHandler of type 'dchName'
                            // whos parent is parent
                            // and if .hasDiv and style populate div style with style data
                            // finally call this.construct() for post-construction activities
    
    //           destroy(); // recursive, calls this.destruct(), then removes all listeners, then destroys it


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// listener add/remove functions --------------------------------------------------------------------------------------
    //  id   = addListener(el, action, callback, opts=undefined)
    //  succ = removeListenerById(id)
    //  succ = removeListenerByEA(el, action)
    //         removeAllListeners()
// NOTE it is perfectly valid for 'el' to be 'document' or 'window' and it will get auto-removed when dch is removed

    static async create(dchName, parent=null, style=null) {
        if (!DCH.hasOwnProperty(dchName)) {          // load the module(plugin) if not already loaded
            const dch = await FF.loadModule("./modules/DocComponentHandlers/dch_" + dchName + ".js")
            DCH[dchName] = dch.DCH;
        }
        const dch = new DCH[dchName]();         // create handler, do nothing else!
        dch.parent = parent;
        if (dch.hasDiv) {                                   // is dch a visible object that needs a <div> to render in? 
            dch._div = document.createElement("div");        // create div
            dch._div.dchHandler = dch;                       // flag to let me work with it from any child
            let parentDiv;
            if (dch.parent == null) {                               // if self has no parent...
                parentDiv = document.getElementById("docWrapper");  // attach div to outermost <div id="docWrapper">
            } else {
                parentDiv = dch.parent._div                     // else attach to parent's <div>
            }
            dch._div.style.position = "absolute";            // the wrapping 'dch._div' is ALWAYS absolute!
            parentDiv.appendChild(dch._div);
            if (style) {
                for (const key in style) {              // get and parse the style values
                    const val = style[key] + "px";      // get the value and append "px"
                    switch(key) {
                        case 'L':   dch._div.style.left   = val;   break;
                        case 'R':   dch._div.style.right  = val;   break;
                        case 'W':   dch._div.style.width  = val;   break;
                        case 'T':   dch._div.style.top    = val;   break;
                        case 'B':   dch._div.style.bottom = val;   break;
                        case 'H':   dch._div.style.height = val;   break;
                    }
                }
                
                //RSTEMP get-us-going mods to experiment on the el
                    dch._div.style.border = "1px solid black";
                    dch._div.style.backgroundColor = "lightsalmon";
                    dch._div.style.overflow = "hidden";
                    dch._div.style.whiteSpace = "nowrap";
                //RSTEMP.end
            }
        }
        dch.construct();
        return dch;
    }


    async importData(data) {Object.assign(this, data); }   // *overridable* populate this component with data
    async exportData()     {}                              // *overridable* return data to be preserved/exported as a {}


    async destroy() { // detach this dch from doc, removing all listeners too, and destroy it
        debugger; for (let idx = this.children.length - 1; idx >= 0; idx--) {     // destroy all children first
            this.children[idx].destroy();
        }
        this.removeAllListeners();      // remove all listeners registered to this dch
        if (this.parent) {
            for (let idx = this.parent.children.length - 1; idx >= 0; idx--) {  // remove 'this' from parent.children
                if (this.parent.children[idx] == this) {
                    this.parent.children.splice(idx, 1);
                    break;
                }                
            }
        }
    }


    static __registeredEventListeners = [];     // [[id, dch(this), el, action, callback, opts]]
    static __nextListenerId = 1;
    
    addListener = function(el, action, callback, opts=undefined) {
        debugger; let id = FG.DCH_BASE.__nextListenerId++;
        FG.DCH_BASE.__registeredEventListeners.push([id, this, el, action, callback, opts]);
        el.addEventListener(action, callback.bind(this), opts); // so the callback knows what dchCmop it's working with
        return id;
    }

    
    removeListenerById = function(id) {
        debugger; for (let idx = 0; idx < FG.DCH_BASE.__registeredEventListeners.length; idx++) {
            let tmp = FG.DCH_BASE.__registeredEventListeners[idx];
            if (tmp[0] == id) {
                el.removeEventListener(tmp[2], tmp[3]);            // unlisten
                FG.DCH_BASE.__registeredEventListeners.splice(idx, 1);    // and remove
                return true;
            }
        }
        return false;
    }
    
    
    removeListenerByEA = function(el, action) {
        debugger; for (let idx = 0; idx < FG.DCH_BASE.__registeredEventListeners.length; idx++) {
            let tmp = FG.DCH_BASE.__registeredEventListeners[idx];        // [id, dch, el, action, callback, opts]
            if (tmp[1] == this && tmp[2] == el && tmp[3] == action) {
                el.removeEventListener(tmp[2], tmp[3]);            // unlisten
                FG.DCH_BASE.__registeredEventListeners.splice(idx, 1);    // and remove
                return true;
            }
        }
        return false;
    }
    
    
    removeAllListeners = function() {
        debugger; for (let idx = FG.DCH_BASE.__registeredEventListeners.length - 1; idx >= 0; idx--) {
            let tmp = FG.DCH_BASE.__registeredEventListeners[idx];        // [id, dch, el, action, callback, opts]
            if (tmp[1] == this) {
                el.removeEventListener(tmp[2], tmp[3]);             // unListen
                FG.DCH_BASE.__registeredEventListeners.splice(idx, 1);    // and remove
            }
        }
    }
}; // end class

