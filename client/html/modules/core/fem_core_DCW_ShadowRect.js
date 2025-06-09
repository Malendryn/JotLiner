// here is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// NOTE: do not instance any DCH class directly, use DCH_<type>BASE.create() instead

import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class DCW_ShadowRect {   // base class of all document components
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PLUGIN SUPPLIED PROPERTIES: plugin-makers MUST override these following variables with their own values
    static pluginName    = "Unnamed Plugin";   // The plugin's name as shown in menus and command modes
    static pluginTooltip = "No tooltip given"; // Shown when pluginName is hovered over in menus
/* *** these next few are 'get-only' properties that are BaseClass-supplied 'HTML relevant' accessors and functions

    srcUrl  = "./pathTo/this/plugin"  // relative path to this plugin (so plugin can access related content)
    parent  = parentDcw  reference to parent dcw (or id=divDocView if this is the topmost dcw which is always a BOX)
    host    = DOM <div>  where plugin's content should go.  for DCW_ShadowRect this is a div inside a shadow DOM and thus isolated
                         from the main html page
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

    onResize()  {}
    onMove()    {}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// baseclass helper properties and functions for convenience ----------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// create/destroy and other helper functions on baseclass (do not override!)-------------------------------------------
    //  async create('box', parent=null, style=null)  // create new DocComponentHandler of type 'dchName'
                    // whos parent is parent
                    // and populate div style with style data
                    // finally call this.construct() for post-construction activities

    //  async destroy(); // recursive, calls this.destruct() on attached dch, then removes all listeners, then destroys it


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// internal functions,  (do not override!)-----------------------------------------------------------------------------
//  none!

    #dch;   // attached dch or undefined
    attachHandler(name) {
        debugger; try {
            this.#dch = DCH_BASE.create(name, this);      // create handler, do nothing else!
        } catch (err) {
            console.warn("Failed to create plugin '" + dchName + "', reason: " + err.message);
            return null;
        }
    }

    static async create(parentDcw, style) {
        const dcw = new DCW_ShadowRect();   // dcw = Document Component Wrapper
        dcw.#parentDcw = parentDcw;
        dcw.__sysDiv = document.createElement("div");           // create div
addDbgId(dcw.__sysDiv, "_dbg_" + dcw.constructor.name + ".__sysDiv id=" + (_debugIdCounter++).toString());
        // dcw.__sysDiv.tabIndex = -1;                          // doing this makes the .__sysDiv focussable but not tabbable
        let parentDiv;
        if (parentDcw == null) {                                // if self has no parent...
            parentDiv = document.getElementById("divDocView");  // attach div to toplevel div
        } else {
            parentDiv = dcw.#parentDcw.host                     // else attach to parent's host <div>
        }
        dcw.__sysDiv.style.position  = "absolute";      // the wrapping 'dcw.__sysDiv' is ALWAYS absolute!
        dcw.__sysDiv.style.boxSizing = "border-box";    // prevent oversizing due to padding,borders,margin,...
        dcw.__sysDiv.style.padding   = "0px";
        dcw.__sysDiv.style.margin    = "0px";
        dcw.__sysDiv.style.minWidth = "20px";           //prevent resizing smaller than 20px
        dcw.__sysDiv.style.minHeight = "20px";

        for (const key in style) {              // get and parse the style values
            const val = style[key] + "px";      // get the value and append "px"
            switch(key) {
                case 'L':   dcw.__sysDiv.style.left   = val;   break;
                case 'R':   dcw.__sysDiv.style.right  = val;   break;
                case 'W':   dcw.__sysDiv.style.width  = val;   break;
                case 'T':   dcw.__sysDiv.style.top    = val;   break;
                case 'B':   dcw.__sysDiv.style.bottom = val;   break;
                case 'H':   dcw.__sysDiv.style.height = val;   break;
            }
        }
console.log(FF.__FILE__(), "... can I discard __host and use __sysDiv directly here? ...")
        dcw.__host = document.createElement("div");     // create a 'faux host' to put the shadow DOM in
addDbgId(dcw.__host, "_dbg_" + dcw.constructor.name + ".__host(ForShadow) id=" + (_debugIdCounter++).toString());
        dcw.__host.classList.add("shadowWrapper__host");         // see index.css
        dcw.__host.style.position = "absolute";
        dcw.__host.style.inset = "0px";           // make sure this div stays sized to the __sysDiv
        dcw.__sysDiv.appendChild(dcw.__host);
        dcw.__hostShadow = dcw.__host.attachShadow({ mode: "open" });
// /*AAAA*/            dcw.__hostShadow.innerHTML = `
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
        dcw.__hostStyle = document.createElement("div");   // this is now where all style elements get appended to
        dcw.__hostStyle.style.display = "none";            // hide this div
addDbgId(dcw.__hostStyle, "_dbg_" + dcw.constructor.name + ".__hostStyle(InShadow) id=" + (_debugIdCounter++).toString());
        dcw.__hostShadow.appendChild(dcw.__hostStyle);
        dcw.#host = document.createElement("div")          // this is now where all child elements get appended to
addDbgId(dcw.#host, "_dbg_" + dcw.constructor.name + ".#host(InShadow) id=" + (_debugIdCounter++).toString());
        dcw.#host.style.width = "100%";
        dcw.#host.style.height = "100%";                   // make sure host always fills parent completely
        dcw.#host = dcw.__hostShadow.appendChild(dcw.#host);    // give it its first element as it has none to start with

        parentDiv.appendChild(dcw.__sysDiv);

        if (parentDcw) {                       // if parent was passed, attach this to its children
            parentDcw.__children.push(dcw);
        }

        return dcw;
    }

// override above pre-defs in the help comments at the top of the class
    async destruct()       {}                              // *overridable* do any other kind of cleanup before class destruction
    async update()         {}                              // *overridable*   (what and when is this called?)

    async destroy() { // detach this dcw and owned dch from doc, removing all listeners too, and destroy it
        await this.destruct();
        this.__sysDiv.remove();                                     // remove our dcw toplevel div
        if (this.#parentDcw) {                                      // if not at topmost dcw, remove us from our parents children
            const idx = this.#parentDcw.__children.indexOf(this);
            this.#parentDcw.__children.splice(idx, 1);
        }
    }

    async loadStyle(str, which={}) {
        if (Object.keys(which).length == 0) {
            throw new Error("loadStyle missing destination parameter");
        }
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
            el.textContent = str;
            this.__hostStyle.appendChild(el);
        }
    }

    constructor() {     // RSTODO move all the other 'on class' defines into here, supposedly it's 'the right way'
    }

    get srcUrl()   { return this.#srcUrl; }
    set srcUrl(v)  { throw new Error (`${this.constructor.name} attempted to set readonly property 'srcUrl'`);  }
    get host()     { return this.#host;   }
    set host(v)    { throw new Error (`${this.constructor.name} attempted to set readonly property 'host'`);    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// system-only properties and functions, they should never be modified or overridden by the child class in any way

// RSTODO privatize these (#parent #sysDiv) and maybe rename _sysDiv to #dcwDiv)
    __sysDiv = null;     // private! handle to toplevel absolute div  housing entire dcw element tree (created during create())
    __host   = null;     // private!
    __hostShadow = null;     // private! (full chain is: this.__sysDiv.__host.__hostShadow.#host);
    __hostStyle  = null;     // immediately above #host,    where styles for host go

    #srcUrl;

    #parentDcw = null;      // private! parent dcw (or null if topLevel, (ONLY the root BOX element will ever be null))
    __children = [];

    #host      = null;      // ownedBy BASE. an 'absolute' <div> usable as this plugin's equivalent to '<body>'

};
export { DCW_ShadowRect };

let _debugIdCounter = 0;    // for debug purposes


function addDbgId(el, str) {
    el.dataset._dbgid = str;
}
