// here is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// 'wrapper' class for actual DCH object.   this class handles the outermost alt+shift stuff like resize/anchor/depth

import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class DCW_BASE {   // base 'wrapper' class of all document components (where resize/anchor/depth are controlled)
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// static async create(parentDcw, style) {  // create with only the most basic ._c_host, give it style and parentage
//        async attachDch(name); // new dch() --> dch._wh_construct() (which attaches #host and #toolbar --> dch.construct())
//        async destroy(); // recurse, children first; --> this._s_dch._wh_destroy(); removeall <div>'s, unlink from _s_parentDcw

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////// internal functions, (comms between dch and dcw) /////////////////////////////////////////////////
// _hw_ prefixed: items get called from the dch to the dcw:
// _wh_ prefixed: items get called from the dcw into the dch
// ****** _wh_ and _hw_ functions should NEVER BE ACCESSED OUTSIDE of these two classes! ******
// _s_  prefixed: are available systemwide to everyone /including/ the DCH_BASE but /not/ the plugin itself!
// #    prefixed: private to just the class
//      noprefix: called from somewhere outside the class

// _hw_autoSave(delay = 1000)
// _hw_loadStyle(style, which) adds style to this.#hostStyle


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static async create(parentDcw, style) {
        let parentDiv;
        if (parentDcw == null) {                                // if self has no parent...
            parentDiv = document.getElementById("divDocView");  // attach div to toplevel div
        } else {
            parentDiv = parentDcw._c_host                          // else attach to parent's _c_host <div>
        }

        const dcw = new DCW_BASE();   // dcw = Document Component Wrapper
        dcw.#dcwId = ++_dcwIdCounter;
        dcw._s_parentDcw = parentDcw;
        dcw._s_sysDiv = document.createElement("div");           // create div
        dcw.addDbgId(dcw._s_sysDiv, "_s_sysDiv");
        // dcw._s_sysDiv._dchMouseOp = "dchComponent";       // how to know mouse is over a dcw
        dcw._s_sysDiv["el->Dcw"] = dcw;                         // howtoKnow mouse is over this dcw

        // dcw._s_sysDiv.tabIndex = -1;                          // doing this makes the ._s_sysDiv focussable but not tabbable
        dcw._s_sysDiv.classList.add("DCW_DefaultRect");
        // dcw._s_sysDiv.style.position  = "absolute";      // the wrapping 'dcw._s_sysDiv' is ALWAYS absolute!
        // dcw._s_sysDiv.style.boxSizing = "border-box";    // prevent oversizing due to padding,borders,margin,...
        // dcw._s_sysDiv.style.padding   = "0px";
        // dcw._s_sysDiv.style.margin    = "0px";
        dcw._s_sysDiv.style.minWidth = "20px";           //prevent resizing smaller than 20px
        dcw._s_sysDiv.style.minHeight = "20px";

        dcw._s_sysDiv.style.left       = '';     // start by setting all these to '' (to override .css 'inset:0px;')
        dcw._s_sysDiv.style.right      = '';
        dcw._s_sysDiv.style.width      = '';
        dcw._s_sysDiv.style.top        = '';
        dcw._s_sysDiv.style.bottom     = '';
        dcw._s_sysDiv.style.height     = '';

        for (const key in style) {              // get and parse the style values
            const val = style[key] + "px";      // get the value and append "px"
            switch(key) {
                case 'L':   dcw._s_sysDiv.style.left   = val;   break;
                case 'R':   dcw._s_sysDiv.style.right  = val;   break;
                case 'W':   dcw._s_sysDiv.style.width  = val;   break;
                case 'T':   dcw._s_sysDiv.style.top    = val;   break;
                case 'B':   dcw._s_sysDiv.style.bottom = val;   break;
                case 'H':   dcw._s_sysDiv.style.height = val;   break;
            }
        }
        parentDiv.appendChild(dcw._s_sysDiv);

// create a 'temporary non-shadow' _c_host until we discover what type of dch is loading

        dcw._c_host = document.createElement("div")          // this is now where all child elements get appended to
        dcw.addDbgId(dcw._c_host, "host");
        dcw._c_host.classList.add("DCW_DefaultRect");
        dcw._c_host.innerHTML = "Loading...";
        // dcw._c_host.style.position = "absolute";
        // dcw._c_host.style.inset = "0px";
        // dcw._c_host.style.boxSizing = "border-box";    // prevent oversizing due to padding,borders,margin,...
        // dcw._c_host.style.width = "100%";
        // dcw._c_host.style.height = "100%";                   // make sure _c_host always fills parent completely

        dcw._s_sysDiv.appendChild(dcw._c_host);

        if (parentDcw) {                       // if parent was passed, attach this to its children
            parentDcw._s_children.push(dcw);
        }

        return dcw;
    }

    createShadowHost() {
        debugger; this.#host = this._c_host;  // hijack the temporary _c_host and use it as our faux-host for the shadowDom
        this.addDbgId(this.#host, "(was)_c_host (now)#host");
        this.#host.classList.add("shadowWrapper__host");         // see index.css
        // this.#host.style.position = "absolute";
        // this.#host.style.inset = "0px";           // make sure this div stays sized to the _s_sysDiv

        this.#hostShadow = this.#host.attachShadow({ mode: "open" });
//         this.#hostShadow.innerHTML = `
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
        this.#hostStyle = document.createElement("div");   // this is now where all style elements get appended to
        this.addDbgId(this.#hostStyle, "#hostStyle(InShadow)");
        this.#hostStyle.style.display = "none";            // hide this div
        this.#hostShadow.appendChild(this.#hostStyle);    // here is where all loadStyle() el's go

        this._c_host = document.createElement("div");      // create 'final' <body>-like div to pass to plugin
        this.addDbgId(this._c_host, "_c_host(InShadow)");
        this._c_host.classList.add("DCW_DefaultRect");
        this.#hostShadow.appendChild(this._c_host);
    }


    createShadowToolbar() {
        debugger; let toolbarDiv = document.getElementById("divToolbar");
        this.#toolWrap = document.createElement("div"); // we NEED this cuz a shadowDiv has no .style for us to .display="none"
        this.addDbgId(this.#toolWrap, "#toolWrap");
        this.#toolWrap.classList.add("DCW_DefaultToolbar");           // see index.css
        this.#toolWrap.classList.add("shadowWrapper__toolbar");      // see index.css
        // this.#toolWrap.style.position = "absolute";
        // this.#toolWrap.style.inset = "0px";
        this.#toolWrap.style.display = "none";              // do not display it at creation time!
        toolbarDiv.appendChild(this.#toolWrap);             // attach to toolBar div

        this.#toolShadow = this.#toolWrap.attachShadow({ mode: "open" });
//         this.#toolShadow.innerHTML = `
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
        this.#toolStyle = document.createElement("div");       // this is now where all child elements get appended to
        this.addDbgId(this.#toolStyle, this.constructor.name + "#toolStyle(InShadow)");
        this.#toolStyle.classList.add("DCW_DefaultToolbar");           // see index.css
        // this.#toolStyle.style.display = "none";                // hide this div
        this.#toolShadow.appendChild(this.#toolStyle);
        this._c_toolbar = document.createElement("div");
        this.addDbgId(this._c_toolbar, "_c_toolbar(InShadow)");
        this._c_toolbar.classList.add("DCW_DefaultToolbar");           // see index.css
        // this._c_toolbar["el->Dcw"] = this;                            // needed for 'hide all toolbars'
        this._c_toolbar.style.backgroundColor = "rgb(155, 253, 161)";
                
        this.#toolShadow.appendChild(this._c_toolbar);            // add useraccessable toolbar as child of #toolShadow
    }


    showToolbar() {
        debugger; if (this._c_toolbar) {
            this.#toolWrap.style.display = "";
            if (this.toolbarHeight !== undefined) {
                FF.setToolbarHeight(this.toolbarHeight);
            }
        }
    }

    hideToolbar() {  // works, but never used
        debugger; if (this._c_toolbar) {
            this.#toolWrap.style.display = "none";
            FF.setToolbarHeight(FG.defaultToolbarHeight);
        }
    }


    async attachDch(name) {     // return true=good false=failed
        this._c_srcUrl = DCH[name].srcUrl; // set this here&now so keep the ability to change it out of DCH_BASE

        let msg = null;
        try {
            this._s_dch = new DCH[name].dchClass(this);        // create handler, do nothing else!
        } catch (err) {
            msg = err.message;
        }
        if (msg) {
            this._c_host.overflow = "auto";        // allow errormsg to wrap/scroll
            this._c_host.innerHTML = name + " Create fail: " + msg;
            console.warn("Failed to create plugin '" + name + "', reason: " + msg);
            return false;
            // await this.destroy();
        } else {
            this._c_host.innerHTML = "";        // get rid of 'loading...' msg cuz things like BOX won't.
            await this._s_dch._wh_construct();  // creates shadowHost&Toolbar as needed, then calls dch's .construct()
        }
        return true;
    }


// override above pre-defs in the help comments at the top of the class
    async destroy() { // recurse, children first; detach this dcw and owned dch from doc, removing all listeners too, and destroy it
        while(this._s_children.length) {                          // destroy all children first
debugger;   const child = this._s_children[this._s_children.length - 1];    // last to first cuz created first to last (just feels right!)
            await child.destroy();
        }
        this._s_dch._wh_destroy();                  // give the dch a chance to cleanup
        this._s_sysDiv.remove();             // remove our dcw toplevel div
        if (this.#toolWrap) {
            this.#toolWrap.remove();       // if it had a toolbar, remove that too
        }
        if (this._s_parentDcw) {                // if not at topmost dcw, remove us from our parents children
            const idx = this._s_parentDcw._s_children.indexOf(this);
            this._s_parentDcw._s_children.splice(idx, 1);
        }
    }


    async importDchData(u8a) {
        debugger; this._s_dch._w_importData(u8a);
    }

    async exportDchData() {
        debugger; const data = await this._s_dch._w_exportData();
        debugger; /*RSTODO create/send a ModDch packet here*/
    }

    async isDirty() {
        return await this._s_dch._w_isDirty();
    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    translateChildren(zX, zY) { // called via fem_core_DocViewHandler.js AND from dch_BOX.js
        for (let idx = 0; idx < this._s_children.length; idx++) {        // get the bounding box around all children
            const child = this._s_children[idx];
            child._s_sysDiv.style.transform = "translate(" + zX + "px," + zY + "px)";
        }
    }

    async _hw_loadStyle(style, which={}) {
        if (Object.keys(which).length == 0) {
            throw new Error("loadStyle missing at least one destination parameter");
        }
        const match = style.match(/<style[^>]*>([\s\S]*?)<\/style>/i);  // see if it's wrapped in <style></style>
        if (!match) {
        // const isBlock = /^\s*<style[\s>][\s\S]*<\/style>\s*$/i.test(style.trim()); //true if valid  "<style></style>"  else false=assume filepath
        // if (!isBlock) {
            const cssPath = this._c_srcUrl + "/" + style;        // else go load it!
            const response = await fetch(cssPath);
            if (!response.ok) {
                console.warn("Failed to load requested css file '" + style + "'");
                return;
            }
            style = await response.text();
        } else {
            style = match[1];     // take only the guts part of <style>guts</style>
        }

        if (which.host) {
            let el = document.createElement("style");
            this.addDbgId(el, "#hostStyle(InShadow)");
            el.textContent = style;
            this.#hostStyle.appendChild(el);
        }

        if (which.toolbar) {
            if (this._s_dch.hasToolbar != true) {
                throw new Error("Attempt to load style into toolbar when 'hasToolbar' != true");
            }
            let el = document.createElement("style");
            this.addDbgId(el, "#toolStyle(InShadow)");
            el.textContent = style;
            this.#toolStyle.appendChild(el);
        }
    }

    _hw_autoSave(delay) {       // dirty flag gets set on _s_dch, not this obj  (see async exportData() below)
        FF.autoSave(delay);
    } 


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// system-only properties and functions, they should never be modified or overridden by the child class in any way

// RSTODO privatize these (#parent #sysDiv) and maybe rename _sysDiv to #dcwDiv)
// as a general rule of thumb, things with 
// 
// '_c_' are accessable to DCH's (dCh aka 'C'omponent) attached to this (through a getter)
// '#' are private to this class only
// '_s_' are available to the main system, but NOT the attached DCH

    _s_sysDiv     = null;  // toplevel absolute div  housing entire dcw element tree
    #host         = null;  // _s_sysDiv.#host ... where we will .attachShadow() to
    #hostShadow   = null;  // _s_sysDiv.#host.#hostShadow = #host.attachShadow() ||| handle to attached Shadow
    #hostStyle    = null;  // _s_sysDiv.#host.#hostShadow.#hostStyle   (hidden)  ||| where <style/>s for host go
    _c_host       = null;  // _s_sysDiv.#host.#hostShadow._c_host                ||| <div> where plugin places <body> stuff


    #toolWrap   = null;    // <divToolBar>.#toolWrap
    #toolShadow = null;    // <divToolBar>.#toolWrap.#toolShadow = #toolWrap.attachShadow() ||| handle to the attached Shadow
    #toolStyle  = null;    // <divToolBar>.#toolWrap.#toolShadow.#toolStyle     (hidden)    ||| where<style/>s for toolbar go
    _c_toolbar  = null;    // <divToolBar>.#toolWrap.#toolShadow._c_toolbar                 ||| <div> where plugin places toolbar stuff

    _c_srcUrl   = null;

    _s_parentDcw = null;   // parent dcw (or null if topLevel, (ONLY the root BOX element will ever be null))
    _s_children  = [];

    _s_dch;   // attached dch or undefined

    #dcwId;

    addDbgId(el, str) {
        let ss = "DcwId=" + this.#dcwId + " divId=" + _debugIdCounter++ + "   this." + str;
        el.dataset._dbgid = ss;
    }
};
export { DCW_BASE };

let _debugIdCounter = 0;    // for debug purposes
let _dcwIdCounter = 0;


 