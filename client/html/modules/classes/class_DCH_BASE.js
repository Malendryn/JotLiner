// here is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// NOTE: do not instance any DCH class directly, use DCH_<type>BASE.create() instead

import { DCW_BASE } from "../core/fem_core_DCW_BASE.js";
import { DFListenerTracker } from "/public/classes/DFListenerTracker.js";

class DCH_BASE {   // base class of all document components
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PLUGIN SUPPLIED MUST-SET PROPERTIES: plugin-makers MUST override these following variables with their own values
    static pluginName    = "Unnamed Plugin";   // The plugin's name as shown in menus and command modes
    static pluginTooltip = "No tooltip given"; // Shown when pluginName is hovered over in menus
           hasToolbar    = undefined;          // Supply plugin with a 'this.toolbar' during construction
           toolbarHeight = undefined;          // (OPTIONAL) set height when plugin is active (default=index.css:#divToolbar.height)

/* *** these next few are 'get-only' properties that are BaseClass-supplied 'HTML relevant' accessors and functions

    srcUrl  = "./pathTo/this/plugin"  // relative path to this plugin (so plugin can access related content)
    host    = DOM <div>  where plugin content should go.  (this is a div inside a shadow DOM)
    toolbar = DOM <div>  where plugin toolbar icons/dropdowns/etc go (also a shadow DOM)*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// child CAN-IMPLEMENT/OVERRIDE functions -----------------------------------------------------------------------------
/* ****NOTE it is CRITICAL that these functions fully complete their ops before returning (EG must be async/await)
    async construct()      // called this.host created, (plugins construct their interface in here.)
    async destruct()       // called right before removing all listeners and html, and destroying object

    async importData(data) // data = key-value pairs to populate this component with. (uses Object.assign if NOT overridden)
    async exportData()     // RETURNS:  an object of key-value pairs to be preserved/exported

    async update()         // called right after imported or properties of it (or its children) were modified
*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* helper properties and functions ------------------------------------------------------------------------------------
    async loadStyle(str, which) str= "<style></style>", "./path/x.css" or "https://site/x.css" and places it at 'which'
                                which= a dict {toolbar:true,host:false} where either missing assumes false

          autoSave([delay])   when any changes made to dch content, call this to save to backend.
                              delay=millis, [optional, defaults to 1000 (1 sec)], call with (0) for instant save
    async flushAll()          process all waiting autoSaves immediately (autocalled on destroy)

// listener add/remove functions --------------------------------------------------------------------------------------
    id = this.tracker.add(el, type, cb, opts = false)     aka el.addEventListener(type, cb, opts) ... returns id
    this.tracker.remove(id)                               remove a tracked listener by id
    this.tracker.removeAll()                              remove all listeners (autoCalled by destroy())
*/

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// override above pre-defs in the help comments at the top of the class
    async construct()      { throw new Error("Subclass is missing method construct()"); }
    async importData(data) { Object.assign(this, data); }  // *overridable* populate this component with data
    async exportData()     { return {}; }                  // *overridable* return data to be preserved/exported as a {}
    async destruct()       {}                              // *overridable* do any other kind of cleanup before class destruction
    async update()         {}                              // *overridable*


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// below this line is for baseclass use only
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

    async __construct() { // called from DCW_BASE.attachDch()
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

    async __destroy() { // called from DCW_BASE.destroy()
        this.tracker.removeAll();
        await this.destruct();
    }


    #throwErr(propName) { throw new Error(`${this.constructor.name} attempted to set readonly property '${propName}'`); }

// extending classes can never talk to owner directly so we have these passthrough get/setters
    get srcUrl()   { return this.#owner._c_srcUrl;     }    set srcUrl(v)   { this.#throwErr("srcUrl");   }
    get host()     { return this.#owner._c_host;       }    set host(v)     { this.#throwErr("host");     }
    get toolbar()  { return this.#owner._c_toolbar;    }    set toolbar(v)  { this.#throwErr("toolbar");  }

    translateChildren(x,y) { this.#owner._c_translateChildren(x,y); }     // special just for BOX
    async loadStyle(str, which={}) {  await this.#owner.loadStyle(str, which); }

    autosave(delay = 1000) {
        debugger; FF.autoSave("modDch", this, delay);
    }
    async flushAll() {
        debugger; await FF.flushAll();
    }

    #owner;       // DCW_BASE that owns us
    __recId = 0;  // database record id
    __bump  = 0;  // database rec bumpVal (for update comparisons)
};
export { DCH_BASE };

// below this are for debug purposes
let _debugIdCounter = 0;
function addDbgId(el, str) {
    el.dataset._dbgid = str;
}
