
// base class of all DocumentComponentHandlers (dch's)

import { DFListenerTracker } from "/public/classes/DFListenerTracker.js";

class DCH_BASE {   // base class of all document components
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PLUGIN SUPPLIED MUST-OVERRIDE PROPERTIES: plugins MUST override these properties with their own values /////////////
    static pluginName    = "Unnamed Plugin";   // The plugin's name as shown in menus and command modes
    static pluginTooltip = "No tooltip given"; // Shown when pluginName is hovered over in menus
           hasToolbar    = undefined;          // Supply plugin with a 'this.toolbar' during construction
           toolbarHeight = undefined;          // (OPTIONAL) set height when plugin is active (default=index.css:#divToolbar.height)

// *** these next few are 'get-only' properties that are BaseClass-supplied 'HTML relevant' accessors and functions
// srcUrl  = "./pathTo/this/plugin"  // relative path to this plugin (so plugin can access related content)
// host    = DOM <div>  where plugin content should go.  (this is a div inside a shadow DOM)
// toolbar = DOM <div>  where plugin toolbar icons/dropdowns/etc go (also a shadow DOM)

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// child CAN-or-MUST IMPLEMENT/OVERRIDE functions -----------------------------------------------------------------------------
// ****NOTE it is CRITICAL that these functions fully complete their ops before returning (EG must be async/await)
//  async construct()      // MUST: called this.host created, (plugins construct their interface in here.)
//  async destruct()       // CAN : called right before removing all listeners and html, and destroying object

//  async importData(u8a)  // MUST: data = Uint8Array (dch must support zeroLen when dch first instanced)
//  async exportData()     // MUST: return an object of key-value pairs to be preserved/exported

//  async isDirty()        // MUST: return true/false, called right before removing this dch


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/* helper properties and functions ------------------------------------------------------------------------------------
    async loadStyle(str, which) str= "<style></style>", "./path/x.css" or "https://site/x.css" and places it at 'which'
                                which= a dict {toolbar:true,host:false} where either missing assumes false

    ----- autoSave([delay])   when any changes made to dch content need to be saved, call this.
                              delay=millis, [optional, defaults to 1000 (1 sec)], call with (0) for instant save
    async flushAll()          autoSaves immediately (autocalled on destroy)

// listener add/remove functions --------------------------------------------------------------------------------------
    id = this.tracker.add(el, type, cb, opts = false)     aka el.addEventListener(type, cb, opts) ... returns id
    this.tracker.remove(id)                               remove a tracked listener by id
    this.tracker.removeAll()                              remove all listeners (autoCalled by destroy())
*/


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////// internal functions, (comms between dch and dcw) /////////////////////////////////////////////////
// below this line is for baseclass use only


///////////////////// internal functions, (comms between dch and dcw) /////////////////////////////////////////////////
// _hw_ prefixed items are called from dcw into dch
// _wh_ prefixed items are called from dch into dcw
// _wh_ and _hw_ functions should NEVER BE ACCESSED OUTSIDE of these two classes!
// _s_ prefixed are available systemwide to everyone /except/ the plugin itself! (not prevented though)

//          await _wh_construct()     --> create #host and #toolbar --> this.construct()
//          await _wh_destroy()       --> this.tracker.removeAll() --> this.destroy()
//          await _wh_importData(u8a) --> x=DFDecoder.decode(u8a) --> this.importData()
// u8a    = await _wh_exportData()    --> x=this.exportData() --> return DFEncoder.encode(x)


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// overridable functions the plugin can (and in some cases must) override
    async construct()      { throw new Error("Subclass must implement construct()"); }
    async destruct()       {}                              // do any other kind of cleanup before class destruction
    async importData(u8a)  { throw new Error("Subclass must implement importData()"); }  // populate this component with data
    async exportData()     { throw new Error("Subclass must implement exportData()"); }  // *overridable* return data to be preserved/exported as a {}
    async isDirty()        { throw new Error("Subclass must implement isDirty()"); }

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

    async _wh_construct() { // called from DCW_BASE.attachDch()
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


    async _wh_destroy() { // called from DCW_BASE.destroy()
        await this.tracker.removeAll();
        await this.destruct();  // destruct, not destroy, to pair with construct
    }


    async _wh_importData(u8a) {  // called from DCW_BASE.importDchData();
        debugger; this.#dirty = false;
        let decoder = new DFDecoder(u8a)
        this.importData(decoder.decode())
    }

    async _wh_exportData() {     // called from DCW_BASE.exportDchData();
        debugger; this.#dirty = false;
        let encoder = new DFEncoder();
        let u8a = encoder.encode(this.exportData());
        return u8a;
    }

    async _wh_isDirty() {     // called from DCW_BASE.isDirty();
        debugger; return await this.isDirty() || this.#dirty;   // return if plugin says its dirty OR if #dirty was set via autoSave()
    }

    #throwErr(propName) { throw new Error(`${this.constructor.name} attempted to set readonly property '${propName}'`); }

// extending classes must never talk to owner directly so we have these passthrough get/setters
    get srcUrl()   { return this.#owner._h_srcUrl;     }    set srcUrl(v)   { this.#throwErr("srcUrl");   }
    get host()     { return this.#owner._h_host;       }    set host(v)     { this.#throwErr("host");     }
    get toolbar()  { return this.#owner._h_toolbar;    }    set toolbar(v)  { this.#throwErr("toolbar");  }

    async loadStyle(str, which={}) {  await this.#owner._hw_loadStyle(str, which); }

    autoSave(delay = 1000) {
        debugger; this.#dirty = true;
        this.#owner._w_autoSave(delay);
    }

    __getOwner() { return this.#owner; }     // special just for BOX

    #owner;       // DCW_BASE that owns us
    #dirty;
    _s_recId = 0;  // database record id
    _s_bump  = 0;  // database rec bumpVal (for comparisons)
};
export { DCH_BASE };

// below this are for debug purposes
let _debugIdCounter = 0;
function addDbgId(el, str) {
    el.dataset._dbgid = str;
}
