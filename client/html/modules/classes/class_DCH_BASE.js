// herein is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// NOTE: do not instance any DCH class directly, use DCH_BASE.create() instead

import { DFListenerTracker } from "/public/classes/DFListenerTracker.js";

let _debugIdCounter = 0;    // for debug purposes
class DCH_BASE {   // base class of all document components
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// these next values are static so we can access them at the class level for building menus and accessing files, etc
static pluginName  = "Unnamed Plugin";  // PLUGIN supplied; the plugin's name as shown in menus and command modes
static menuTooltip = null; // PLUGIN supplied;  tooltip to show when pluginName is hovered over in menus (skipped if null)

       srcUrl      = "";   // SYSTEM supplied; (do not change!) relative url to module's subdir (so can access own icons, etc...)

////////// vars extending classes MUST provide on their own!  /////////////////////////////////////////////////////////
    hasToolbar = false;     // true = create this.toolbar' @ construction

// *** these next few are where inheriting classes add their own html elements.  these should never be modified in any other way. ***
    host    = null;    // ownedBy BASE. an 'absolute' <div> where child classes add visual elements (like <textarea> etc)
    toolbar = null;    // ownedBy BASE. if hasToolbar: an 'absolute' <div> where child classes add 'icons and toolbar stuff' to
                     // for listeners, use this.addDCHListener() & this.removeDCHListener...()  so dch can autoremove when destroying

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// child-CAN-IMPLEMENT functions -------------------------------------------------------------------------------------
// ****NOTE it is CRITICAL that these functions fully complete their ops before returning (EG must be async/await)
    async construct()      {}   // called by static create() after this.host created and saved styles applied
                                  // if data != null, it contains a {} of data to be put on 'this' as properties
                                  // in here is where to add your own <el>s and listeners to .host, etc..
    async destruct()       {}   // called immediately before removing all listeners and html, and destroying object
    async importData(data) {}   // data = key-value pairs to populate this component with. NOTE: Calls Object.assign if NOT overridden
    async exportData()     {}   // RETURNS:  an object of key-value pairs to be preserved/exported
    async update()         {}   // called right after imported or properties of it (or its children) were modified

    onResize()  {}
    onMove()    {}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// baseclass helper properties and functions for convenience ----------------------------------------------------------
    tracker  = new DFListenerTracker(); // see below under 'listener add/remove functions'

    async loadStyle(str) {} // loads a "<style></style>" text block or a .css file if str is a URL string and places it at
                            // the very top of the this.host <div>

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// create/destroy and other helper functions on baseclass (do not override!)-------------------------------------------
    //  async create('box', parent=null, style=null)  // create new DocComponentHandler of type 'dchName'
                    // whos parent is parent
                    // and populate div style with style data
                    // finally call this.construct() for post-construction activities

    //  async destroy(); // recursive, calls this.destruct(), then removes all listeners, then destroys it


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// listener add/remove functions --------------------------------------------------------------------------------------
// a DFListenerTracker is attached to the DCH_BASE class as 'this.tracker' that can be used as an automatic means
// to track and cleanup/remove listeners when the plugin is destroy()ed.   To use, 
//  instead of using 'el.addListener("click", callback, opts)', use 'this.tracker.add("click", callback, opts)'

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// internal functions,  (do not override!)-----------------------------------------------------------------------------
//  none!

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// system-only properties and functions, they should never be modified or overridden by the child class in any way

    __parent = null;     // private! parent dch (or null if topLevel, (ONLY the root BOX element will ever be null))
    __sysDiv = null;     // private! handle to toplevel absolute div  housing entire dch element tree (created during create())
    __host   = null;     // private! all NON-DCH_BOX's get this
    __shadow = null;     // private! all NON-DCH_BOX's get this (full chain is: this.__sysDiv.__host.__shadow.host);

    static async create(dchName, parent=null, style=null) {
        if (!dchName in DCH) {
            return null;
        }
        let dch;
        try {
            dch = new DCH[dchName].dchClass();        // create handler, do nothing else!
        } catch (err) {
            console.warn("Failed to create plugin '" + dchName + "', reason: " + err.message);
            return null;
        }
        dch.srcUrl = DCH[dchName].srcUrl;                   // set the path to its available content ('ghosts over' static srcUrl)
        dch.__parent = parent;
        dch.__sysDiv = document.createElement("div");       // create div
        dch.__sysDiv.dataset._id = (_debugIdCounter++).toString();
        // dch.__sysDiv.tabIndex = -1;                         // doing this makes the .__sysDiv focussable but not tabbable
        dch.__sysDiv._dchHandler = dch;                     // ptr to let me work with it from any child
        dch.__sysDiv._dchMouseOp = "dchComponent";          // to let us know via mouse/kbd evts that this is <el> is a dch component
        let parentDiv;
        if (dch.__parent == null) {                               // if self has no parent...
            parentDiv = document.getElementById("divDocView");  // attach div to toplevel div
        } else {
            parentDiv = dch.__parent.host                    // else attach to parent's host <div>
        }
        dch.__sysDiv.style.position  = "absolute";      // the wrapping 'dch.__sysDiv' is ALWAYS absolute!
        dch.__sysDiv.style.boxSizing = "border-box";    // prevent adding padding and borders to dch's .getBoundingClientRect()
        dch.__sysDiv.style.padding   = "0px";
        dch.__sysDiv.style.margin    = "0px";
        dch.__sysDiv.style.minWidth = "20px";           //prevent resizing smaller than 20px
        dch.__sysDiv.style.minHeight = "20px";
        parentDiv.appendChild(dch.__sysDiv);

        if (dchName == "BOX") {                  // BOX is SpecialCase, DON'T give it a shadowDom, DO give it a .host! 
            dch.host = document.createElement("div");       // this is now where all child elements get appended to
            dch.host.dataset._id = (_debugIdCounter++).toString();
            dch.host.style.position = "absolute";
            dch.__sysDiv.appendChild(dch.host);
        } else {                                // if it's NOT a BOX, give it a shadowDom in .__host, THEN give it a .host!
            dch.__host = document.createElement("div"); 
            dch.__host.dataset._id = (_debugIdCounter++).toString();
            dch.__host.style.position = "absolute";
            dch.__host.style.inset = "0px";           // make sure this div stays sized to the __sysDiv
            dch.__sysDiv.appendChild(dch.__host);      
            dch.__shadow = dch.__host.attachShadow({ mode: "open" });
            dch.__shadow.innerHTML = `
<style>
    :host {
        display: block;
        width:  100%;
        height: 100%;
    }

    *, *::before, *::after {
    box-sizing: border-box;
    }
</style>
`;
            dch.__host.classList.add("shadowBox");            // see index.css
            // dch.__host.classList.add("disabled");          // dont add this here, example only!
            dch.host = document.createElement("div")          // this is now where all child elements get appended to
            dch.host.style.width = "100%";
            dch.host.style.height = "100%";                   // make sure host always fills parent completely
            dch.host.dataset._id = (_debugIdCounter++).toString();
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

// override above pre-defs in the help comments at the top of the class
    async construct()      { throw new Error("Subclass is missing method construct()"); }
    async importData(data) { Object.assign(this, data); }  // *overridable* populate this component with data
    async exportData()     { return {}; }                  // *overridable* return data to be preserved/exported as a {}
    async destruct()       {}                              // *overridable* do any other kind of cleanup before class destruction
    async update()         {}                              // *overridable*

    async destroy() { // detach this dch from doc, removing all listeners too, and destroy it
        this.tracker.removeAll();
        await this.destruct();
        this.__sysDiv.remove();
        if (this.hasToolbar) {
            this.toolbar.remove();
        }
        if (this.__parent) {                                  // if not at topmost dch
            const idx = this.__parent.__children.indexOf(this);
            this.__parent.__children.splice(idx, 1);
        }
    }

    async loadStyle(str) {
        const isBlock = /^\s*<style[\s>][\s\S]*<\/style>\s*$/i.test(str.trim()); //true if valid  "<style></style>"  else false=assume filepath
        if (!isBlock) {
            const cssPath = this.srcUrl + "/" + str;        // else go load it!
            const response = await fetch(cssPath);
            if (!response.ok) {
                console.warn("Failed to load requested css file '" + str + "'");
                return;
            }
            str = await response.text();
        }

        const el = document.createElement("style");
        el.textContent = str;
        this.host.parentNode.insertBefore(el, this.host); // insert this style right before the host div
    }
};
export { DCH_BASE };