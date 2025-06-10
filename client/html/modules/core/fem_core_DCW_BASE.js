// here is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// 'wrapper' class for actual DCH object.   this class handles the outermost alt+shift stuff like resize/anchor/depth

import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class DCW_BASE {   // base 'wrapper' class of all document components (where resize/anchor/depth are controlled)
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// PLUGIN SUPPLIED PROPERTIES: plugin-makers MUST override these following variables with their own values
    static pluginName    = "Unnamed Plugin";   // The plugin's name as shown in menus and command modes
    static pluginTooltip = "No tooltip given"; // Shown when pluginName is hovered over in menus
/* *** these next few are 'get-only' properties that are BaseClass-supplied 'HTML relevant' accessors and functions

    srcUrl  = "./pathTo/this/plugin"  // relative path to this plugin (so plugin can access related content)
    parent  = parentDcw  reference to parent dcw (or id=divDocView if this is the topmost dcw which is always a BOX)
    host    = DOM <div>  where plugin's content should go.  for DCW_BASE this is a div inside a shadow DOM and thus isolated
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
    async update()         {}   // called right after imported or properties of it (or its children) were modified
                                // if hasChildren, updates the children's transform() based on this's zX,zY

    onResize()  {}
    onMove()    {}
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// baseclass helper properties and functions for convenience ----------------------------------------------------------

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// create/destroy and other helper functions on baseclass (do not override!)-------------------------------------------
    // static async create(parentDcw, style) {  // create with only the most basic .host, give it style and parentage

    // async attachDch(name); // create dch, attach ShadowHost and shadowToolbar if needed
    // async destroy(); // recursive, calls this.destruct() on attached dch, then removes all listeners, then destroys 
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// internal functions,  (do not override!)-----------------------------------------------------------------------------
//  none!



    async attachDch(name) {     // return true=good false=failed
        this.srcUrl = DCH[name].srcUrl; // set this here&now so keep the ability to change it out of DCH_BASE

        try {
            this.__dch = new DCH[name].dchClass(this);        // create handler, do nothing else!
        } catch (err) {
            console.warn("Failed to create plugin '" + name + "', reason: " + err.message);
            return null;
        }
        if (!this.__dch) {
            await this.destroy();
            return false;
        }
    
        // if (name != "BOX") {   // special case, only BOX does not get a shadow host
        //     this.createShadowHost();
        // }
        // if (this.__dch.hasToolbar) {
        //     this.createShadowToolbar();
        // }

        await this.__dch.__construct();  // creates shadowHost&Toolbar as needed, then calls dch's .construct()
        
        return true;
    }


    static async create(parentDcw, style) {
        const dcw = new DCW_BASE();   // dcw = Document Component Wrapper
        dcw._dcwId = ++_dcwIdCounter;
        dcw.parentDcw = parentDcw;
        dcw.__sysDiv = document.createElement("div");           // create div
        dcw.addDbgId(dcw.__sysDiv, "__sysDiv");
        // dcw.__sysDiv.tabIndex = -1;                          // doing this makes the .__sysDiv focussable but not tabbable
        let parentDiv;
        if (parentDcw == null) {                                // if self has no parent...
            parentDiv = document.getElementById("divDocView");  // attach div to toplevel div
        } else {
            parentDiv = dcw.parentDcw.host                     // else attach to parent's host <div>
        }
        dcw.__sysDiv.classList.add("DCW_DefaultRect");
        // dcw.__sysDiv.style.position  = "absolute";      // the wrapping 'dcw.__sysDiv' is ALWAYS absolute!
        // dcw.__sysDiv.style.boxSizing = "border-box";    // prevent oversizing due to padding,borders,margin,...
        // dcw.__sysDiv.style.padding   = "0px";
        // dcw.__sysDiv.style.margin    = "0px";
        dcw.__sysDiv.style.minWidth = "20px";           //prevent resizing smaller than 20px
        dcw.__sysDiv.style.minHeight = "20px";

        dcw.__sysDiv.style.left       = '';     // start by setting all these to '' (to override .css 'inset:0px;')
        dcw.__sysDiv.style.right      = '';
        dcw.__sysDiv.style.width      = '';
        dcw.__sysDiv.style.top        = '';
        dcw.__sysDiv.style.bottom     = '';
        dcw.__sysDiv.style.height     = '';

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
        parentDiv.appendChild(dcw.__sysDiv);

// create a 'temporary non-shadow' host until we discover what type of dch is loading

        dcw.host = document.createElement("div")          // this is now where all child elements get appended to
        dcw.addDbgId(dcw.host, "host");
        dcw.host.classList.add("DCW_DefaultRect");
        // dcw.host.style.position = "absolute";
        // dcw.host.style.inset = "0px";
        // dcw.host.style.boxSizing = "border-box";    // prevent oversizing due to padding,borders,margin,...
        // dcw.host.style.width = "100%";
        // dcw.host.style.height = "100%";                   // make sure host always fills parent completely

        dcw.__sysDiv.appendChild(dcw.host);

        if (parentDcw) {                       // if parent was passed, attach this to its children
            parentDcw.children.push(dcw);
        }

        return dcw;
    }


    createShadowHost() {
        this.__host = this.host;  // hijack the temporary host and use it as our faux-host for the shadowDom
        this.addDbgId(this.__host, "(was)host (now)__host");
        this.__host.classList.add("shadowWrapper__host");         // see index.css
        // this.__host.style.position = "absolute";
        // this.__host.style.inset = "0px";           // make sure this div stays sized to the __sysDiv

        this.#hostShadow = this.__host.attachShadow({ mode: "open" });
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
        this.__hostStyle = document.createElement("div");   // this is now where all style elements get appended to
        this.addDbgId(this.__hostStyle, "__hostStyle(InShadow)");
        this.__hostStyle.style.display = "none";            // hide this div
        this.#hostShadow.appendChild(this.__hostStyle);    // here is where all loadStyle() el's go

        this.host = document.createElement("div");      // create 'final' <body>-like div to pass to plugin
        this.addDbgId(this.host, "host(InShadow)");
        this.host.classList.add("DCW_DefaultRect");
        this.#hostShadow.appendChild(this.host);
    }


    createShadowToolbar() {
        let toolbarDiv = document.getElementById("divToolbar");
        this.__toolWrap = document.createElement("div"); // we NEED this cuz a shadowDiv has no .style for us to .display="none"
        this.addDbgId(this.__toolWrap, "__toolWrap");
        this.__toolWrap.classList.add("DCW_DefaultToolbar");           // see index.css
        this.__toolWrap.classList.add("shadowWrapper__toolbar");      // see index.css
        // this.__toolWrap.style.position = "absolute";
        // this.__toolWrap.style.inset = "0px";
        this.__toolWrap.style.display = "none";              // do not display it at creation time!
        toolbarDiv.appendChild(this.__toolWrap);             // attach to toolBar div

        this.__toolShadow = this.__toolWrap.attachShadow({ mode: "open" });
//         this.__toolShadow.innerHTML = `
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
        this.__toolStyle = document.createElement("div");       // this is now where all child elements get appended to
        this.addDbgId(this.__toolStyle, this.constructor.name + "__toolStyle(InShadow)");
        this.__toolStyle.classList.add("DCW_DefaultToolbar");           // see index.css
        // this.__toolStyle.style.display = "none";                // hide this div
        this.__toolShadow.appendChild(this.__toolStyle);
        this.toolbar = document.createElement("div");
        this.addDbgId(this.toolbar, "toolbar(InShadow)");
        this.toolbar.classList.add("DCW_DefaultToolbar");           // see index.css
        // this.toolbar._dchHandler = dch;                      // same for the toolbar
        // this.toolbar._dchMouseOp = "dchToolBtn";
        // this.toolbar.style.position = "absolute";
        // this.toolbar.style.inset = "0px 0px 0px 0px";       // top, right, bottom, left
        // this.toolbar.style.boxSizing = "border-box";
        this.toolbar.style.backgroundColor = "rgb(155, 253, 161)";
                
        this.__toolShadow.appendChild(this.toolbar);            // add useraccessable toolbar as child of __toolbar
    }


    async loadStyle(style, which={}) {
        if (Object.keys(which).length == 0) {
            throw new Error("loadStyle missing destination parameter");
        }
        const match = style.match(/<style[^>]*>([\s\S]*?)<\/style>/i);  // see if it's wrapped in <style></style>
        if (!match) {
        // const isBlock = /^\s*<style[\s>][\s\S]*<\/style>\s*$/i.test(style.trim()); //true if valid  "<style></style>"  else false=assume filepath
        // if (!isBlock) {
            const cssPath = this.srcUrl + "/" + style;        // else go load it!
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
            this.addDbgId(el, "host.style(InShadow)");
            el.textContent = style;
            this.__hostStyle.appendChild(el);
        }

        if (which.toolbar) {
            if (this.__dch.hasToolbar != true) {
                throw new Error("Attempt to load style into toolbar when 'hasToolbar' != true");
            }
            let el = document.createElement("style");
            this.addDbgId(el, "__toolShadow.style(InShadow)");
            el.textContent = style;
            this.__toolStyle.appendChild(el);
        }
    }

     showToolbar() {
        debugger; if (this.toolbar) {
            this.__toolWrap.style.display = "";
            if (this.toolbarHeight !== undefined) {
                this.setToolbarHeight(this.toolbarHeight);
            }
        }
    }
    hideToolbar() {
        debugger; if (this.toolbar) {
            this.__toolWrap.style.display = "none";
            this.setToolbarHeight(FG.toolbarHeight);
        }
    }

    setToolbarHeight(px) {
        debugger; if (this.toolbar) {
            // let el = document.getElementById("divTitlebar");
            // let top = el.getBoundingClientRect().height;
            let el = document.getElementById("divToolbar");
            let rect = el.getBoundingClientRect();
            el.style.height = px + "px";
            el = document.getElementById("divMainView");
            el.style.top = (rect.top + px) + "px";
        }
    }


// override above pre-defs in the help comments at the top of the class
    async destruct() {
        debugger; for (let idx = this.children.length - 1; idx >= 0; idx--) {     // destroy them (in reverse order cuz 'parent.splice()'
            const child = this.children[idx];
            await child.destroy();          // does the .splice() of my .children internally so don't do it here!
            // this.children.splice(idx, 1);
        }
    }

    async destroy() { // detach this dcw and owned dch from doc, removing all listeners too, and destroy it
        debugger; await this.destruct();
        this.__sysDiv.remove();                                     // remove our dcw toplevel div
        if (this.__toolWrap) {
            this.__toolWrap.remove();                               // if it had a toolbar, remove that too
        }
        if (this.parentDcw) {                                      // if not at topmost dcw, remove us from our parents children
            const idx = this.parentDcw.children.indexOf(this);
            this.parentDcw.children.splice(idx, 1);
        }
    }



    constructor() {     // RSTODO move all the other 'on class' defines into here, supposedly it's 'the right way'
    }


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// system-only properties and functions, they should never be modified or overridden by the child class in any way

// RSTODO privatize these (#parent #sysDiv) and maybe rename _sysDiv to #dcwDiv)
// as a general rule of thumb, things with 
// 
// '' (no prefix) are accessable to DCH's attached to this (through a getter)
// '#' are private to this class only
// '__' are available to the main system, but NOT the attached DCH

    __sysDiv     = null;  // toplevel absolute div  housing entire dcw element tree
    __host       = null;  // __sysDiv.__host ... where we will .attachShadow() to
    #hostShadow = null;  // __sysDiv.__host.#hostShadow = __host.attachShadow() ||| handle to attached Shadow
    __hostStyle  = null;  // __sysDiv.__host.#hostShadow.__hostStyle   (hidden)  ||| where <style/>s for host go
    host         = null;  // __sysDiv.__host.#hostShadow.host                    ||| <div> where plugin places <body> stuff


    __toolWrap   = null;   // <divToolBar>.__toolWrap
    __toolShadow = null;   // <divToolBar>.__toolWrap.__toolShadow = __toolWrap.attachShadow() ||| handle to the attached Shadow
    __toolStyle  = null;   // <divToolBar>.__toolWrap.__toolShadow.__toolStyle     (hidden)    ||| where<style/>s for toolbar go
    toolbar      = null;   // <divToolBar>.__toolWrap.__toolShadow.toolbar                     ||| <div> where plugin places toolbar stuff

    srcUrl     = null;

    parentDcw  = null;      // private! parent dcw (or null if topLevel, (ONLY the root BOX element will ever be null))
    children   = [];

    __dch;   // attached dch or undefined

    _dcwId;

    addDbgId(el, str) {
        let ss = "DcwId=" + this._dcwId + " divId=" + _debugIdCounter++ + "   this." + str;
        el.dataset._dbgid = ss;
    }
};
export { DCW_BASE };

let _debugIdCounter = 0;    // for debug purposes
let _dcwIdCounter = 0;


