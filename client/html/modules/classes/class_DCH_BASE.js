// here is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// NOTE: do not instance any DCH class directly, use DCH_<type>BASE.create() instead

import { DFListenerTracker } from "/public/classes/DFListenerTracker.js";

class DCH_BASE {   // base class of all document components
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PLUGIN SUPPLIED PROPERTIES: plugin-makers MUST override these following variables with their own values
    static pluginName    = "Unnamed Plugin";   // The plugin's name as shown in menus and command modes
    static pluginTooltip = "No tooltip given"; // Shown when pluginName is hovered over in menus
           hasToolbar    = undefined;          // Supply plugin with a 'this.toolbar' during construction
           toolbarHeight = undefined;          // (OPTIONAL) set height when plugin is active (default=index.css:#divToolbar.height)
/* *** these next few are 'get-only' properties that are BaseClass-supplied 'HTML relevant' accessors and functions

    srcUrl  = "./pathTo/this/plugin"  // relative path to this plugin (so plugin can access related content)
    parent  = parentDCH  reference to parent dch (or id=divDocView if this is the topmost dch which is always a BOX)
    host    = DOM <div>  where plugin's content should go.  for DCH_BASE this is a div inside a shadow DOM and thus isolated
                         from the main html page
    toolbar = DOM <div>  where the toolbar icons and dropdowns etc should be placed.  Like host, this is also a shadow DOM when the
                         parent is DCH_BASE
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

    async loadStyle(str, which) {} // loads a "<style></style>" text block or URL to a .css file and places it at
                                   // at 'which', a dict {toolbar:true,host:false} where either missing assumes false

    showToolbar() {}
    hideToolbar() {}

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


    // static async create(dchName, owner) {
    //     if (!dchName in DCH) {
    //         return null;
    //     }
    //     let dch;
    //     try {
    //         dch = new DCH[dchName].dchClass(owner);        // create handler, do nothing else!
    //     } catch (err) {
    //         console.warn("Failed to create plugin '" + dchName + "', reason: " + err.message);
    //         return null;
    //     }
    //     await dch.__construct();  // call private __construct() on base, which calls construct() on dch_NAME
    //     return dch;
    // }

// override above pre-defs in the help comments at the top of the class
    async construct()      { throw new Error("Subclass is missing method construct()"); }
    async importData(data) { Object.assign(this, data); }  // *overridable* populate this component with data
    async exportData()     { return {}; }                  // *overridable* return data to be preserved/exported as a {}
    async destruct()       {}                              // *overridable* do any other kind of cleanup before class destruction
    async update()         {}                              // *overridable*

    async destroy() { // detach this dch from doc, removing all listeners too, and destroy it
        this.tracker.removeAll();
        await this.destruct();

// this following stuff is now done in the dcw
        // this.__sysDiv.remove();                                     // remove our dch toplevel div
        // if (this.hasToolbar) {                                      // if we had a toolbar, remove its toplevel div
        //     this.__toolWrap.remove();
        // }
        // if (this.#parentDch) {                                       // if not at topmost dch, remove us from our parents children
        //     const idx = this.#parentDch.children.indexOf(this);
        //     this.#parentDch.children.splice(idx, 1);
        // }
    }

    constructor(owner) {
        if (this.constructor.pluginName == DCH_BASE.pluginName) {
            throw new Error(`${this.constructor.name} must override static property 'pluginName'`);
        }
        if (this.constructor.pluginTooltip == DCH_BASE.pluginTooltip) {
            throw new Error(`${this.constructor.name} must override static property 'pluginName'`);
        }
        this.#owner = owner;
        this.tracker  = new DFListenerTracker(); // see below under 'listener add/remove functions'
    }

    async __construct() {
        if (this.hasToolbar != true && this.hasToolbar != false) {
            throw new Error(`${this.constructor.name} must define boolean property 'hasToolbar'`);
        }
        if (this.constructor.name != "DCH_BOX") {   // special case, only BOX does not get a shadow host
            this.#owner.createShadowHost();
        }
        if (this.hasToolbar) {
            this.#owner.createShadowToolbar();
        }
      
        await this.construct();
    }


    #throwErr(propName) { throw new Error(`${this.constructor.name} attempted to set readonly property '${propName}'`); }

// extending classes can never talk to owner directly so we have these passthrough get/setters
    get srcUrl()   { return this.#owner.srcUrl;   }    set srcUrl(v)   { this.#throwErr("srcUrl");   }
    // get owner()    { return this.#owner;          }    set owner(v)    { this.#throwErr("owner");    }
    get host()     { return this.#owner.host;     }    set host(v)     { this.#throwErr("host");     }
    get toolbar()  { return this.#owner.toolbar;  }    set toolbar(v)  { this.#throwErr("toolbar");  }
    get children() { return this.#owner.children; }    set children(v) { this.#throwErr("children"); }

    async loadStyle(str, which={}) {  await this.#owner.loadStyle(str, which); }
          showToolbar()            {        this.#owner.showToolbar();         }
          hideToolbar()            {        this.#owner.hideToolbar();         }


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// system-only properties and functions, they should never be modified or overridden by the child class in any way

    #parentDch  = null;      // private! parent dch (or null if topLevel, (ONLY the root BOX element will ever be null))

    #owner; // DCW_BASE that owns us

};
export { DCH_BASE };

let _debugIdCounter = 0;    // for debug purposes


function addDbgId(el, str) {
    el.dataset._dbgid = str;
}
