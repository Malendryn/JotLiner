// here is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// NOTE: do not instance any DCH class directly, use DCH_<type>BASE.create() instead

import { DFListenerTracker } from "/public/classes/DFListenerTracker.js";

class DCH_ShadowBASE {   // base class of all document components
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PLUGIN SUPPLIED PROPERTIES: plugin-makers MUST override these following variables with their own values
    static pluginName    = "Unnamed Plugin";   // The plugin's name as shown in menus and command modes
    static pluginTooltip = "No tooltip given"; // Shown when pluginName is hovered over in menus
           hasToolbar    = undefined;          // Supply plugin with a 'this.toolbar' during construction
           toolbarHeight = undefined;          // (OPTIONAL) set height when plugin is active (default=index.css #divToolbar.height)
/* *** these next few are 'get-only' properties that are BaseClass-supplied 'HTML relevant' accessors and functions

    srcUrl  = "./pathTo/this/plugin"  // relative path to this plugin (so plugin can access related content)
    parent  = parentDCH  reference to parent dch (or id=divDocView if this is the topmost dch which is always a BOX)
    host    = DOM <div>  where plugin's content should go.  for DCH_ShadowBASE this is a div inside a shadow DOM and thus isolated
                         from the main html page
    toolbar = DOM <div>  where the toolbar icons and dropdowns etc should be placed.  Like host, this is also a shadow DOM when the
                         parent is DCH_ShadowBASE
*/

//  id = addStyle(code) adds a style in <head> but tracks it via returned id and auto-prevents duplication if plugin loaded more than once
//                      (code can be a "path-or-URL" to a .css file-or- direct "<style>text</style>" textblock)
//  removeStyle(id);    remove style added by id returned from addStyle()
//  removeAllStyles();  remove ALL styles added by this plugin, (AUTOMATICALLY called when plugin is destroy()'d)

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

    async loadStyle(str) {} // loads a "<style></style>" text block or a .css file if str is a URL string and places it at
                            // the very top of the this.host <div>

    showToolbar() {}
    hideToolbar() {}
    setToolbarHeight(px) {}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// create/destroy and other helper functions on baseclass (do not override!)-------------------------------------------
    //  async create('box', parent=null, style=null)  // create new DocComponentHandler of type 'dchName'
                    // whos parent is parent
                    // and populate div style with style data
                    // finally call this.construct() for post-construction activities

    //  async destroy(); // recursive, calls this.destruct(), then removes all listeners, then destroys it


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// listener add/remove functions --------------------------------------------------------------------------------------
// a DFListenerTracker is attached to the DCH_<type>BASE class as 'this.tracker' that can be used as an automatic means
// to track and cleanup/remove listeners when the plugin is destroy()ed.   To use, 
//  instead of using 'el.addListener("click", callback, opts)', use 'this.tracker.add("click", callback, opts)'

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// internal functions,  (do not override!)-----------------------------------------------------------------------------
//  none!


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
        if (typeof dch.hasToolbar != "boolean") {
            throw new Error(`${this.constructor.name} must set static property 'hasToolbar' to true or false`);
        }

        dch.#srcUrl = DCH[dchName].srcUrl;
        dch.#parentEl = parent;
        dch.__sysDiv = document.createElement("div");       // create div
addDbgId(dch.__sysDiv, "_dbg_" + dch.constructor.name + ".__sysDiv id=" + (_debugIdCounter++).toString());
// dch.__sysDiv.dataset._dbgid = (_debugIdCounter++).toString();
        // dch.__sysDiv.tabIndex = -1;                         // doing this makes the .__sysDiv focussable but not tabbable
        dch.__sysDiv._dchHandler = dch;                     // ptr to let me work with it from any child
        dch.__sysDiv._dchMouseOp = "dchComponent";          // to let us know via mouse/kbd evts that this is <el> is a dch component
        let parentDiv;
        if (dch.#parentEl == null) {                              // if self has no parent...
            parentDiv = document.getElementById("divDocView");  // attach div to toplevel div
        } else {
            parentDiv = dch.#parentEl.host                        // else attach to parent's host <div>
        }
        dch.__sysDiv.style.position  = "absolute";      // the wrapping 'dch.__sysDiv' is ALWAYS absolute!
        dch.__sysDiv.style.boxSizing = "border-box";    // prevent adding padding and borders to dch's .getBoundingClientRect()
        dch.__sysDiv.style.padding   = "0px";
        dch.__sysDiv.style.margin    = "0px";
        dch.__sysDiv.style.minWidth = "20px";           //prevent resizing smaller than 20px
        dch.__sysDiv.style.minHeight = "20px";
        parentDiv.appendChild(dch.__sysDiv);

        if (dchName == "BOX") {                  // BOX is SpecialCase, DON'T give it a shadowDom, DO give it a .host! 
            dch.__hostStyle = document.createElement("div");       // this is now where all child elements get appended to
            dch.__sysDiv.appendChild(dch.__hostStyle);
            dch.#host = document.createElement("div");       // this is now where all child elements get appended to
addDbgId(dch.#host, "_dbg_" + dch.constructor.name + ".host id=" + (_debugIdCounter++).toString());
// dch.#host.dataset._dbgid = (_debugIdCounter++).toString();
            dch.#host.style.position = "absolute";
            dch.__sysDiv.appendChild(dch.#host);
        } else {                                // if it's NOT a BOX, give it a shadowDom in .__host, THEN give it a .host!
            dch.__host = document.createElement("div");     // create a 'faux host' to put the shadow DOM in
addDbgId(dch.__host, "_dbg_" + dch.constructor.name + ".__host(ForShadow) id=" + (_debugIdCounter++).toString());
// dch.__sysDiv.dataset._dbgid = (_debugIdCounter++).toString();
            dch.__host.classList.add("shadowWrapper__host");         // see index.css
            dch.__host.style.position = "absolute";
            dch.__host.style.inset = "0px";           // make sure this div stays sized to the __sysDiv
            dch.__sysDiv.appendChild(dch.__host);
            dch.__hostShadow = dch.__host.attachShadow({ mode: "open" });
//invalid   dch.__hostShadow.classList.add("AAA__hostShadow");
// /*AAAA*/            dch.__hostShadow.innerHTML = `
// <style>
//     :host {
//         display: block;
//         width:  100%;
//         height: 100%;
//     }

//     *, *::before, *::after {
//     box-sizing: border-box;
//     }
// </style>
// `;
            dch.__hostStyle = document.createElement("div");   // this is now where all child elements get appended to
            dch.__hostStyle.style.display = "none";            // hide this div
addDbgId(dch.__hostStyle, "_dbg_" + dch.constructor.name + ".host(InShadow) id=" + (_debugIdCounter++).toString());
            dch.__hostShadow.appendChild(dch.__hostStyle);
            dch.#host = document.createElement("div")          // this is now where all child elements get appended to
addDbgId(dch.#host, "_dbg_" + dch.constructor.name + ".host(InShadow) id=" + (_debugIdCounter++).toString());
// dch.#host.dataset._dbgid = (_debugIdCounter++).toString();
            dch.#host.style.width = "100%";
            dch.#host.style.height = "100%";                   // make sure host always fills parent completely
            dch.#host = dch.__hostShadow.appendChild(dch.#host);    // give it its first element as it has none to start with
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
            let toolbarDiv = document.getElementById("divToolbar");
            dch.__toolWrap = document.createElement("div"); // we NEED this cuz a shadowDiv has no .style for us to .display="none"
            dch.__toolWrap._dchHandler = dch;
addDbgId(dch.__toolWrap, "_dbg_" + dch.constructor.name + ".__toolWrap id=" + (_debugIdCounter++).toString());
            dch.__toolWrap.classList.add("shadowWrapper__host");      // see index.css
            dch.__toolWrap.style.position = "absolute";
            dch.__toolWrap.style.inset = "0px";
            dch.__toolWrap.style.display = "none";              // do not display it at creation time!
            toolbarDiv.appendChild(dch.__toolWrap);             // attach to toolBar div 
            dch.__toolShadow = dch.__toolWrap.attachShadow({ mode: "open" });
// AAAA            dch.__toolShadow.innerHTML = `
// <style>
//     :host {
//         display: block;
//         width:  100%;
//         height: 100%;
//     }

//     *, *::before, *::after {
//     box-sizing: border-box;
//     }
// </style>
// `;
            dch.__toolStyle = document.createElement("div");       // this is now where all child elements get appended to
            dch.__toolShadow.appendChild(dch.__toolStyle);
            dch.#toolbar = document.createElement("div");
addDbgId(dch.#toolbar, "_dbg_" + dch.constructor.name + ".toolbar(InShadow) id=" + (_debugIdCounter++).toString());
            dch.#toolbar._dchHandler = dch;                      // same for the toolbar
            dch.#toolbar._dchMouseOp = "dchToolBtn";
            dch.#toolbar.style.position = "absolute";
            dch.#toolbar.style.inset = "0px 0px 0px 0px";       // top, right, bottom, left
            dch.#toolbar.style.backgroundColor = "rgb(155, 253, 161)";
            
            dch.__toolShadow.appendChild(dch.#toolbar);            // add useraccessable #toolbar as child of __toolbar
            dch.loadStyle("../../../dchToolbarBasics.css", {toolbar:true});
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
        this.__sysDiv.remove();                                     // remove our dch toplevel div
        if (this.hasToolbar) {                                      // if we had a toolbar, remove its toplevel div
            this.__toolWrap.remove();
        }
        if (this.#parentEl) {                                       // if not at topmost dch, remove us from our parents children
            const idx = this.#parentEl.__children.indexOf(this);
            this.#parentEl.__children.splice(idx, 1);
        }
    }

    async loadStyle(str, which = {host:true,toolbar:true}) {
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

        if (which.host) {
            let el = document.createElement("style");
addDbgId(el, "_dbg_" + this.constructor.name + ".host.style(InShadow) id=" + (_debugIdCounter++).toString());
            // dch.#host.dataset._dbgid = (_debugIdCounter++).toString();
            el.textContent = str;
            this.__hostStyle.appendChild(el);
        }

        if (which.toolbar) {
            let el = document.createElement("style");
addDbgId(el, "_dbg_" + this.constructor.name + ".__toolShadow.style(InShadow) id=" + (_debugIdCounter++).toString());
            // dch.#host.dataset._dbgid = (_debugIdCounter++).toString();
            el.textContent = str;
            this.__toolStyle.appendChild(el);
        }
    }

    showToolbar() {
        if (this.hasToolbar) {
            this.__toolWrap.style.display = "";
            if (this.toolbarHeight !== undefined) {
                this.setToolbarHeight(this.toolbarHeight);
            }
        }
    }
    hideToolbar() {
        if (this.hasToolbar) {
            this.__toolWrap.style.display = "none";
            this.setToolbarHeight(FG.toolbarHeight);
        }
    }

    setToolbarHeight(px) {
        // let el = document.getElementById("divTitlebar");
        // let top = el.getBoundingClientRect().height;
        let el = document.getElementById("divToolbar");
        let rect = el.getBoundingClientRect();
        el.style.height = px + "px";
        el = document.getElementById("divMainView");
        el.style.top = (rect.top + px) + "px";
    }

    constructor() {     // RSTODO move all the other 'on class' defines into here, supposedly it's 'the right way'
        if (this.constructor.pluginName == DCH_ShadowBASE.pluginName) {
            throw new Error(`${this.constructor.name} must override static property 'pluginName'`);
        }
        if (this.constructor.pluginTooltip == DCH_ShadowBASE.pluginTooltip) {
            throw new Error(`${this.constructor.name} must override static property 'pluginName'`);
        }
        this.tracker  = new DFListenerTracker(); // see below under 'listener add/remove functions'
    }

    get srcUrl()   { return this.#srcUrl; }
    set srcUrl(v)  { throw new Error (`${this.constructor.name} attempted to set readonly property 'srcUrl'`);  }
    // get parentEl()   { return this.#parentEl; }
    // set parentEl(v)  { throw new Error (`${this.constructor.name} attempted to set readonly property 'parentEl'`);  }
    get host()     { return this.#host;   }
    set host(v)    { throw new Error (`${this.constructor.name} attempted to set readonly property 'host'`);    }
    get toolbar()  { return this.#toolbar; }
    set toolbar(v) { throw new Error (`${this.constructor.name} attempted to set readonly property 'toolbar'`); }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// system-only properties and functions, they should never be modified or overridden by the child class in any way

// RSTODO privatize these (#parent #sysDiv) and maybe rename _sysDiv to #dchDiv)  also howto rename __host != #host
    __sysDiv = null;     // private! handle to toplevel absolute div  housing entire dch element tree (created during create())
    __host   = null;     // private! all NON-DCH_BOX's get this
    __hostShadow = null;     // private! all NON-DCH_BOX's get this (full chain is: this.__sysDiv.__host.__hostShadow.host);
    __toolWrap   = undefined;   // NEEDED so we can .style.display="none"  a shadowDiv(aka __toolShadow) has no .style
    __toolShadow = undefined;

    __hostStyle = null;         // immediately above #host,    where styles for host go
    __toolStyle = undefined;    // immediately above #toolbar, where styles for toolbar go

    #srcUrl;
    #parentEl  = null;      // private! parent dch (or null if topLevel, (ONLY the root BOX element will ever be null))
    #host      = null;      // ownedBy BASE. an 'absolute' <div> usable as this plugin's equivalent to '<body>'
    #toolbar   = undefined; // ownedBy BASE. if .hasToolbar: an 'absolute' <div> where child classes add 'icons and toolbar stuff' to
                    // for listeners, use this.addDCHListener() & this.removeDCHListener...()  so dch can autoremove when destroying

};
export { DCH_ShadowBASE };

let _debugIdCounter = 0;    // for debug purposes


function addDbgId(el, str) {
    el.dataset._dbgid = str;
}
