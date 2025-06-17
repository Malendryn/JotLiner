// here is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// 'wrapper' class for actual DCH object.   this class handles the outermost alt+shift stuff like resize/anchor/depth

import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class DCW_BASE {   // base 'wrapper' class of all document components (where resize/anchor/depth are controlled)
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// static async create(parentDcw, style) {  // create with only the most basic ._h_host, give it style and parentage
//        async attachDch(name); // new dch() --> dch._wh_construct() (which attaches #host and #toolbar --> dch.construct())
//        async destroy(); // recurse, children first; --> this.#dch._wh_destroy(); removeall <div>'s, unlink from #parentDcw

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////// internal prefixed properties and functions, (comms between dch, dcw, and system ) ///////////////

// as a general rule of thumb, things with 
// #    prefixed: private to just the class

// funcall rules:
// _wh_ prefixed: called from the dcw into the dch
// _hw_ prefixed: called from the dch to the dcw: (see DCH_BASE for actual useFunc)
//      noprefix: called from somewhere outside the class NOT by DCH_BASE or the plugin itself

// static async create(parentDcw, style{})  --> docAttacher._attachNext(parentDcw, dcwEntry.S)
// ------ ----- createShadowHost()
// ------ ----- createShadowToolbar()
// ------ ----- showToolbar()
// ------ ----- hideToolbar()
// ------ async attachDch(name)
// ------ async destroy()          --> recurse children first; 
// ------ async importDchData(u8a) --> this.#dch._wh_importData(u8a)
// u8a  = async exportDchData()    --> this.#dch._wh_exportDchData()
// ------ async isDirty()          --> this.#dch._wh_isDirty()
// ------ ----- translateChildren(zX,zY) --> foreach child:  child.#sysDiv.style.transform = "translate(" + zX + "px," + zY + "px)"

// ------ ----- dch       (set/get) this.#dch
// ------ ----- dchRecId  (set/get) this.#dch.#dchRecId
// ------ ----- bump      (set/get) this.#dch.#bump

// _hw_ prefixed: called from DCH_BASE to DCW_BASE: (see DCH_BASE for actual useFunc)
// _hw_loadStyle(style, which) adds style to this.#hostStyle
// _hw_autoSave(delay = 1000)  --> FF.autoSave("DCH", this, delay)


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static async create(parentDcw, style) {
        let parentDiv;
        if (parentDcw == null) {                                // if self has no parent...
            parentDiv = document.getElementById("divDocView");  // attach div to toplevel div
        } else {
            parentDiv = parentDcw._h_host                          // else attach to parent's _h_host <div>
        }

        const dcw = new DCW_BASE();   // dcw = Document Component Wrapper
        dcw._dcwDbgId = ++_dcwDbgIdCounter;
        dcw.#parentDcw = parentDcw;
        dcw.#sysDiv = document.createElement("div");           // create div
        dcw._addDbgId(dcw.#sysDiv, "#sysDiv");
        // dcw.#sysDiv._dchMouseOp = "dchComponent";       // how to know mouse is over a dcw
        dcw.#sysDiv["el->Dcw"] = dcw;                         // howtoKnow mouse is over this dcw

        // dcw.#sysDiv.tabIndex = -1;                          // doing this makes the .#sysDiv focussable but not tabbable
        dcw.#sysDiv.classList.add("DCW_DefaultRect");
        // dcw.#sysDiv.style.position  = "absolute";      // the wrapping 'dcw.#sysDiv' is ALWAYS absolute!
        // dcw.#sysDiv.style.boxSizing = "border-box";    // prevent oversizing due to padding,borders,margin,...
        // dcw.#sysDiv.style.padding   = "0px";
        // dcw.#sysDiv.style.margin    = "0px";
        dcw.#sysDiv.style.minWidth = "20px";           //prevent resizing smaller than 20px
        dcw.#sysDiv.style.minHeight = "20px";

        dcw.#sysDiv.style.left       = '';     // start by setting all these to '' (to override .css 'inset:0px;')
        dcw.#sysDiv.style.right      = '';
        dcw.#sysDiv.style.width      = '';
        dcw.#sysDiv.style.top        = '';
        dcw.#sysDiv.style.bottom     = '';
        dcw.#sysDiv.style.height     = '';

        for (const key in style) {              // get and parse the style values
            const val = style[key] + "px";      // get the value and append "px"
            switch(key) {
                case 'L':   dcw.#sysDiv.style.left   = val;   break;
                case 'R':   dcw.#sysDiv.style.right  = val;   break;
                case 'W':   dcw.#sysDiv.style.width  = val;   break;
                case 'T':   dcw.#sysDiv.style.top    = val;   break;
                case 'B':   dcw.#sysDiv.style.bottom = val;   break;
                case 'H':   dcw.#sysDiv.style.height = val;   break;
            }
        }
        parentDiv.appendChild(dcw.#sysDiv);

// create a 'temporary non-shadow' _h_host until we discover what type of dch is loading

        dcw._h_host = document.createElement("div")          // this is now where all child elements get appended to
        dcw._addDbgId(dcw._h_host, "host");
        dcw._h_host.classList.add("DCW_DefaultRect");
        dcw._h_host.innerHTML = "Loading...";
        // dcw._h_host.style.position = "absolute";
        // dcw._h_host.style.inset = "0px";
        // dcw._h_host.style.boxSizing = "border-box";    // prevent oversizing due to padding,borders,margin,...
        // dcw._h_host.style.width = "100%";
        // dcw._h_host.style.height = "100%";                   // make sure _h_host always fills parent completely

        dcw.#sysDiv.appendChild(dcw._h_host);

        if (parentDcw) {                       // if parent was passed, attach this to its children
            parentDcw.#children.push(dcw);
        }

        return dcw;
    }

    createShadowHost() {
        this.#host = this._h_host;  // hijack the temporary _h_host and use it as our faux-host for the shadowDom
        this._addDbgId(this.#host, "(was)_h_host (now)#host");
        this.#host.classList.add("shadowWrapper__host");         // see index.css
        // this.#host.style.position = "absolute";
        // this.#host.style.inset = "0px";           // make sure this div stays sized to the #sysDiv

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
        this._addDbgId(this.#hostStyle, "#hostStyle(InShadow)");
        this.#hostStyle.style.display = "none";            // hide this div
        this.#hostShadow.appendChild(this.#hostStyle);    // here is where all loadStyle() el's go

        this._h_host = document.createElement("div");      // create 'final' <body>-like div to pass to plugin
        this._addDbgId(this._h_host, "_h_host(InShadow)");
        this._h_host.classList.add("DCW_DefaultRect");
        this.#hostShadow.appendChild(this._h_host);
    }


    createShadowToolbar() {
        let toolbarDiv = document.getElementById("divToolbar");
        this.#toolWrap = document.createElement("div"); // we NEED this cuz a shadowDiv has no .style for us to .display="none"
        this._addDbgId(this.#toolWrap, "#toolWrap");
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
        this._addDbgId(this.#toolStyle, this.constructor.name + "#toolStyle(InShadow)");
        this.#toolStyle.classList.add("DCW_DefaultToolbar");           // see index.css
        // this.#toolStyle.style.display = "none";                // hide this div
        this.#toolShadow.appendChild(this.#toolStyle);
        this._h_toolbar = document.createElement("div");
        this._addDbgId(this._h_toolbar, "_h_toolbar(InShadow)");
        this._h_toolbar.classList.add("DCW_DefaultToolbar");           // see index.css
        // this._h_toolbar["el->Dcw"] = this;                            // needed for 'hide all toolbars'
        this._h_toolbar.style.backgroundColor = "rgb(155, 253, 161)";
                
        this.#toolShadow.appendChild(this._h_toolbar);            // add useraccessable toolbar as child of #toolShadow
    }


    showToolbar() {
        if (this._h_toolbar) {
            this.#toolWrap.style.display = "";
            if (this.toolbarHeight !== undefined) {
                FF.setToolbarHeight(this.toolbarHeight);
            }
        }
    }

    hideToolbar() {  // works, but never used
        debugger; if (this._h_toolbar) {
            this.#toolWrap.style.display = "none";
            FF.setToolbarHeight(FG.defaultToolbarHeight);
        }
    }


    async attachDch(name) {     // return true=good false=failed
        this._h_srcUrl = DCH[name].srcUrl; // set this here&now so keep the ability to change it out of DCH_BASE

        let msg = null;
        try {
            this.#dch = new DCH[name].dchClass(this);        // create handler, do nothing else!
        } catch (err) {
            msg = err.message;
        }
        if (msg) {
            this._h_host.overflow = "auto";        // allow errormsg to wrap/scroll
            this._h_host.innerHTML = name + " Create fail: " + msg;
            console.warn("Failed to create plugin '" + name + "', reason: " + msg);
            return false;
            // await this.destroy();
        } else {
            this._h_host.innerHTML = "";        // get rid of 'loading...' msg cuz things like BOX won't.
            await this.#dch._wh_construct();  // creates shadowHost&Toolbar as needed, then calls dch's .construct()
        }
        return true;
    }


// override above pre-defs in the help comments at the top of the class
    async destroy() { // recurse, children first; detach this dcw and owned dch from doc, removing all listeners too, and destroy it
        while(this.#children.length) {                          // destroy all children first
            const child = this.#children[this.#children.length - 1]; // last to first cuz created first to last (just feels right!)
            await child.destroy();  // recurse into HERE
        }
        await this.#dch._wh_destroy();                  // give the dch a chance to cleanup
        this.#sysDiv.remove();             // remove our dcw toplevel div
        if (this.#toolWrap) {
            this.#toolWrap.remove();       // if it had a toolbar, remove that too
        }
        if (this.#parentDcw) {                // if not at topmost dcw, remove us from our parents children
            const idx = this.#parentDcw.children.indexOf(this);
            this.#parentDcw.children.splice(idx, 1);
        }
    }


    async importDchData(u8a) {
        debugger; this.#dch._wh_importData(u8a);
    }

    async exportDchData() {
        debugger; return await this.#dch._wh_exportData();
    }

    // async isDirty() {
    //     return await this.#dch._wh_isDirty();
    // }


    get dch()       { return this.#dch;}
    // set dch(v)      { this.#dch = v;   }
    get recId()     { return this.#dchRecId; }
    // set recId(v)    { this.#dchRecId = v;    }
    get bump()      { return this.#bump; }
    // set bump(v)     { this.#bump = v;    }

// getters only
    get parentDcw() { return this.#parentDcw; }
    get children()  { return this.#children;  }
    get sysDiv()    { return this.#sysDiv;    }


    ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    _hw_translateChildren(zX, zY) { // called via fem_core_DocViewHandler.js AND from dch_BOX.js
        for (let idx = 0; idx < this.#children.length; idx++) {        // get the bounding box around all children
            const child = this.#children[idx];
            child.#sysDiv.style.transform = "translate(" + zX + "px," + zY + "px)";
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
            const cssPath = this._h_srcUrl + "/" + style;        // else go load it!
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
            this._addDbgId(el, "#hostStyle(InShadow)");
            el.textContent = style;
            this.#hostStyle.appendChild(el);
        }

        if (which.toolbar) {
            if (this.#dch.hasToolbar != true) {
                throw new Error("Attempt to load style into toolbar when 'hasToolbar' != true");
            }
            let el = document.createElement("style");
            this._addDbgId(el, "#toolStyle(InShadow)");
            el.textContent = style;
            this.#toolStyle.appendChild(el);
        }
    }

    _hw_autoSave(delay) {       // dirty flag gets set on #dch, not this obj  (see async exportData() below)
        FF.autoSave("DCH", this, delay);
    } 


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// system-only properties and functions, they should never be modified or overridden by the child class in any way

// RSTODO privatize these (#parent #sysDiv) and maybe rename _sysDiv to #dcwDiv)


#sysDiv     = null;  // toplevel absolute div  housing entire dcw element tree
    #host         = null;  // #sysDiv.#host ... where we will .attachShadow() to
    #hostShadow   = null;  // #sysDiv.#host.#hostShadow = #host.attachShadow() ||| handle to attached Shadow
    #hostStyle    = null;  // #sysDiv.#host.#hostShadow.#hostStyle   (hidden)  ||| where <style/>s for host go
    _h_host       = null;  // #sysDiv.#host.#hostShadow._h_host                ||| <div> where plugin places <body> stuff


    #toolWrap   = null;    // <divToolBar>.#toolWrap
    #toolShadow = null;    // <divToolBar>.#toolWrap.#toolShadow = #toolWrap.attachShadow() ||| handle to the attached Shadow
    #toolStyle  = null;    // <divToolBar>.#toolWrap.#toolShadow.#toolStyle     (hidden)    ||| where<style/>s for toolbar go
    _h_toolbar  = null;    // <divToolBar>.#toolWrap.#toolShadow._h_toolbar                 ||| <div> where plugin places toolbar stuff

    _h_srcUrl   = null;

    #parentDcw = null;   // parent dcw (or null if topLevel, (ONLY the root BOX element will ever be null))
    #children  = [];

    #dch;       // attached dch or undefined
    #dchRecId;  // db dch rec id
    #bump       // db rec bumpNum

    _dcwDbgId; 

    _addDbgId(el, str) {
        let ss = "DcwDbgId=" + this._dcwDbgId + " divDbgId=" + _divDbgIdCounter++ + "   this." + str;
        el.dataset._dbgid = ss;
    }
};
export { DCW_BASE };

let _divDbgIdCounter = 0;    // for debug purposes
let _dcwDbgIdCounter = 0;


 