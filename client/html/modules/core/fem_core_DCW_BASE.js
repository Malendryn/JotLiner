'use strict';   // so it throws errors if anyone tries to add/remove properties on the class

// here is the base class of all DocumentComponentHandlers

// ALL components are always inside a <div> that is 'absolute', with all measurements done in pixels

// 'wrapper' class for actual DCH object.   this class handles the outermost alt+shift stuff like resize/anchor/depth

import { DFDecoder,DFEncoder } from "/public/classes/DFCoder.mjs";
import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class DCW_BASE {   // base 'wrapper' class of all document components (where resize/anchor/depth are controlled)
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// static async create(parentDcw, style) {  // create with only the most basic .#host, give it style and parentage

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////// internal prefixed properties and functions, (comms between dch, dcw, and system ) ///////////////

// as a general rule of thumb, things with 
// #    prefixed: private to just the class

// funcall rules:
// _wh_ prefixed: called from the dcw -->  dch
// _hw_ prefixed: called from the dch -->  dcw: (see DCH_BASE for actual useFunc)
//      noprefix: called from somewhere outside the class NOT by DCH_BASE or the plugin itself

// static async create(parentDcw, style{})  --> docAttacher._attachNext(parentDcw, dcwEntry.S)
// ------ ----- createShadowHost()
// ------ ----- createShadowToolbar()
// ------ ----- showToolbar()
// ------ ----- hideToolbar()
//        async attachDch(dchRecId, name); // new dch() --> dch._wh_construct() (which attaches #host and #toolbar --> dch.construct())
//        async destroy(); // recurse, children first; --> this.#dch._wh_destroy(); removeall <div>'s, unlink from #parentDcw
// ------ async importDchData(u8a) --> this.#dch._wh_importData(u8a)
// u8a  = async exportDchData()    --> this.#dch._wh_exportDchData()
// ------ async isDirty()          --> this.#dch._wh_isDirty()
// ------ ----- translateChildren(zX,zY) --> foreach child:  child.#sysDiv.style.transform = "translate(" + zX + "px," + zY + "px)"

// ------ ----- dch       (set/get) this.#dch
// ------ ----- dchRecId  (set/get) this.#dch.#dchRecId
// ------ ----- bump      (set/get) this.#dch.#bump

// _hw_ prefixed: called from DCH_BASE to DCW_BASE: (see DCH_BASE for actual useFunc)
// _hw_loadStyle(style, which) adds style to this.#hostHead
// _hw_autoSave(delay = 1000)  --> FF.autoSave("ModDch", this, delay)


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

    static async create(parentDcw, style) {
        let parentDiv;
        if (parentDcw == null) {                                // if self has no parent...
            parentDiv = document.getElementById("divDocView");  // attach div to toplevel div
        } else {
            parentDiv = parentDcw.host;                     // else attach to parent's host <div>
        }

        const dcw = new DCW_BASE();   // dcw = Document Component Wrapper
        dcw.dcwDbgId = ++_dcwDbgIdCounter;
        dcw.#parentDcw = parentDcw;

        dcw.#sysDiv = FF.makeDocEl("div", dcw.#dcwDbgId, "sysDiv");           // create div
//        dcw._addDbgId(dcw.#sysDiv, "#sysDiv");
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

        dcw.setStyle(style);
        parentDiv.appendChild(dcw.#sysDiv);

// create a 'temporary non-shadow' host until we discover what type of dch is loading

        dcw.#host = FF.makeDocEl("div", dcw.#dcwDbgId, "host");           // create div
        // dcw.#host = document.createElement("div")          // this is now where all child elements get appended to
//        dcw._addDbgId(dcw.#host, "host");
        dcw.#host.classList.add("DCW_DefaultRect");
        dcw.#host.innerHTML = "Loading...";

        dcw.#sysDiv.appendChild(dcw.#host);

        if (parentDcw) {                       // if parent was passed, attach this to its children
            parentDcw.#children.push(dcw);
            parentDcw.dch._wh_updateZxy();         // parents are always BOX's and this will call its _hw_translateChildren()
        }

        return dcw;
    }

    setStyle(style) {
        this.#sysDiv.style.left       = '';     // start by setting all these to '' (to override .css 'inset:0px;')
        this.#sysDiv.style.right      = '';
        this.#sysDiv.style.width      = '';
        this.#sysDiv.style.top        = '';
        this.#sysDiv.style.bottom     = '';
        this.#sysDiv.style.height     = '';

        for (const key in style) {              // get and parse the style values
            const val = style[key] + "px";      // get the value and append "px"
            switch(key) {
                case 'L':   this.#sysDiv.style.left   = val;   break;
                case 'R':   this.#sysDiv.style.right  = val;   break;
                case 'W':   this.#sysDiv.style.width  = val;   break;
                case 'T':   this.#sysDiv.style.top    = val;   break;
                case 'B':   this.#sysDiv.style.bottom = val;   break;
                case 'H':   this.#sysDiv.style.height = val;   break;
            }
        }
    }

    createShadowHost() {
        this.#host.remove();
        this.#shadowHost = FF.makeDocEl("div", this.dcwDbgwIdhId, "shadowHost");   // remove&replace to start with fresh wrapper
        // this.#shadowHost = document.createElement("div");               // remove&replace to start with completely fresh wrapper
//        this._addDbgId(this.#shadowHost, "(was)host (now)shadowHost");
        this.#shadowHost.classList.add("DCW_DefaultRect");
        this.#sysDiv.appendChild(this.#shadowHost);

        this.#hostShadow = this.#shadowHost.attachShadow({ mode: "open" });
        this.#hostShadow.innerHTML = `
<style>
    :host {
        display:  block;
        position: absolute;
    }

    *, *::before, *::after {
        box-sizing: border-box;
    }
    #host {
        width:    100%;
        height:   100%;
        position: absolute;
    }
    #host.disabled {
        pointer-events: none;   
        opacity:0.5;
    }
</style>
`;
        this.#hostHead = FF.makeDocEl("div", this.dcwDbgwIdhId, "hostHead");   // where all style elements get appended to
        // this.#hostHead = document.createElement("div");   // this is now where all style elements get appended to
//        this._addDbgId(this.#hostHead, "#hostHead(InShadow)");
        this.#hostHead.style.display = "none";            // hide this div
        this.#hostShadow.appendChild(this.#hostHead);    // here is where all loadStyle() el's go

        this.#host = FF.makeDocEl("div", this.dcwDbgwIdhId, "host");
        // this.#host = document.createElement("div");      // create new #host to replace old one
        // this.#host.id = "__hostInShadow";
//        this._addDbgId(this.#host, "#host(InShadow)");
        // this.#host.classList.add("DCW_DefaultRect");     
        // this.#host.classList.add("shadowWrapper__host");     // not accessible inside shadow!
        this.#hostShadow.appendChild(this.#host);
    }


    createShadowToolbar() {
        let toolbarDiv = document.getElementById("divToolbar");
        this.#toolWrap = FF.makeDocEl("div", this.dcwDbgwIdhId, "toolWrap");
        // this.#toolWrap = document.createElement("div"); // we NEED this cuz a shadowDiv has no .style for us to .display="none"
//        this._addDbgId(this.#toolWrap, "#toolWrap");
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
        this.#toolStyle = FF.makeDocEl("div", this.dcwDbgwIdhId, "toolStyle");
        // this.#toolStyle = document.createElement("div");       // this is now where all child elements get appended to
//        this._addDbgId(this.#toolStyle, this.constructor.name + "#toolStyle(InShadow)");
        this.#toolStyle.classList.add("DCW_DefaultToolbar");           // see index.css
        // this.#toolStyle.style.display = "none";                // hide this div
        this.#toolShadow.appendChild(this.#toolStyle);
        this.#toolbar = FF.makeDocEl("div", this.dcwDbgwIdhId, "toolbar");
        // this.#toolbar = document.createElement("div");
//        this._addDbgId(this.#toolbar, "#toolbar(InShadow)");
        this.#toolbar.classList.add("DCW_DefaultToolbar");           // see index.css
        // this.#toolbar["el->Dcw"] = this;                            // needed for 'hide all toolbars'
        this.#toolbar.style.backgroundColor = "rgb(155, 253, 161)";
                
        this.#toolShadow.appendChild(this.#toolbar);            // add useraccessable toolbar as child of #toolShadow
    }


    showToolbar() {
        if (this.#toolbar) {
            this.#toolWrap.style.display = "";
            if (this.toolbarHeight !== undefined) {
                FF.setToolbarHeight(this.toolbarHeight);
            }
        }
    }

    hideToolbar() {  // works, but never used
        if (this.#toolbar) {
            this.#toolWrap.style.display = "none";
            FF.setToolbarHeight(FG.defaultToolbarHeight);
        }
    }


    async attachDch(dchRecId, name) {     // return true=good false=failed
        this.#srcUrl = DCH[name].srcUrl; // set this here&now so keep the ability to change it out of DCH_BASE
        let msg = null;
        try {
            this.#dch = new DCH[name].dchClass(this);        // create handler, do nothing else!
            this.#dchRecId = dchRecId;
        } catch (err) {
            msg = err.message;
        }
        if (msg) {
            this.#host.overflow = "auto";        // allow errormsg to wrap/scroll
            this.#host.innerHTML = name + " Create fail: " + msg;
            console.warn("Failed to create plugin '" + name + "', reason: " + msg);
            return false;
            // await this.destroy();
        } else {
            this.#host.innerHTML = "";        // get rid of 'loading...' msg cuz things like BOX won't.
            await this.#dch._wh_construct();  // creates shadowHost&Toolbar as needed, then calls dch's .construct()
        }

        let pkt = WS.makePacket("GetDch", {id:dchRecId});    // NOT BROADCAST!  get the dch's name and content and attach it
        pkt = await WS.sendExpect(pkt, _onGetDch, this);

        // if (true) {//await dcw.attachDch(pkt.id, pkt.rec.name)) {
        //     const decoder = new DFDecoder(pkt.rec.content);
        //     const dict = decoder.decode();      // will return undefined if u8a is empty
        //     if (dict != decoder.EOSTREAM) {     // if stream was empty
        //         dcw.dch.importData(dict);
        //     }
        // }

        return true;
    }


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
        this.#dch._wh_importData(u8a);
    }

    async exportDchData() {
        return await this.#dch._wh_exportData();
    }

    // async isDirty() {
    //     return await this.#dch._wh_isDirty();
    // }


    get dch()       { return this.#dch;}
    set dch(v)      { this.#dch = v;   }
    get dchRecId()  { return this.#dchRecId; }
    set dchRecId(v) { this.#dchRecId = v;    }
    get bump()      { return this.#bump; }
    set bump(v)     { this.#bump = v;    }

// getters only

    #throwErr(propName) { throw new Error(`Cannot change readonly property '${propName}'`); }

    get parentDcw()  { return this.#parentDcw; }
    set parentDcw(v) { this.#throwErr("parentDcw"); }
    get children()   { return this.#children;  }
    set children(v)  { this.#throwErr("children"); }
    get sysDiv()     { return this.#sysDiv;    }
    set sysDiv(v)    { this.#throwErr("sysDiv"); }

    get divGhost()   { return this.#divGhost; }
    set divGhost(v)  { this.#divGhost = v; }

    get host()    { return this.#host;    }    // only DCH_BASE should access these
    get toolbar() { return this.#toolbar; }
    get srcUrl()  { return this.#srcUrl;  }

    set host(v)    { this.#host = v;    }     // DCH_BASE should NEVER access these (but system needs to)
    set toolbar(v) { this.#toolbar = v; }
    set srcUrl(v)  { this.#throwErr("srcUrl");  }
    

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
            const cssPath = this.#srcUrl + "/" + style;        // else go load it!
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
//            this._addDbgId(el, "#hostHead(InShadow)");
            el.textContent = style;
            this.#hostHead.appendChild(el);
        }

        if (which.toolbar) {
            if (this.#dch.hasToolbar != true) {
                throw new Error("Attempt to load style into toolbar when 'hasToolbar' != true");
            }
            let el = document.createElement("style");
//            this._addDbgId(el, "#toolStyle(InShadow)");
            el.textContent = style;
            this.#toolStyle.appendChild(el);
        }
    }

    _hw_autoSave(delay) {       // dirty flag gets set on #dch, not this obj  (see async exportData() below)
        FF.autoSave("ModDch", this, delay);
    } 


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// system-only properties and functions, they should never be modified or overridden by the child class in any way

// RSTODO privatize these (#parent #sysDiv) and maybe rename _sysDiv to #dcwDiv)

    #sysDiv       = null;  // toplevel absolute div  housing entire dcw element tree
    #shadowHost   = null;  // #sysDiv.#shadowHost  ... where we will .attachShadow() to
    #hostShadow   = null;  // #sysDiv.#shadowHost .#hostShadow = #host.attachShadow() ||| handle to attached Shadow
    #hostHead     = null;  // #sysDiv.#shadowHost .#hostShadow.#hostHead    (hidden)  ||| where <head> stuff like <style/> go
    #host         = null;  // #sysDiv.#shadowHost .#hostShadow.#host                  ||| <div> where plugin places <body> stuff

    #divGhost     = null;  // special div for showing the greyed 'ghost' to show outline of dcw no matter what its content is

    #toolWrap   = null;    // <divToolBar>.#toolWrap
    #toolShadow = null;    // <divToolBar>.#toolWrap.#toolShadow = #toolWrap.attachShadow() ||| handle to the attached Shadow
    #toolStyle  = null;    // <divToolBar>.#toolWrap.#toolShadow.#toolStyle     (hidden)    ||| where<style/>s for toolbar go
    #toolbar    = null;    // <divToolBar>.#toolWrap.#toolShadow.#toolbar                   ||| <div> where plugin places toolbar stuff
    #srcUrl     = null;

    #parentDcw = null;   // parent dcw (or null if topLevel, (ONLY the root BOX element will ever be null))
    #children  = [];

    #dch      = null; // attached dch or undefined
    #dchRecId = 0;    // db dch rec id
    #bump     = 0;    // db rec bumpNum

    // get dcwDbgId()  { return this.#dcwDbgId; }
    set dcwDbgId(v) { this.#dcwDbgId = v; }
    get dcwDbgwIdhId() { return this.#dcwDbgId + ":" + this.dchRecId; }

    #dcwDbgId; 

    // _addDbgId(el, str) {
    //     let ss = "DcwDbgId=" + this.dcwDbgId + " divDbgId=" + _divDbgIdCounter++ + "   this." + str;
    //     el.dataset._dbgid = ss;
    // }

    constructor() {
        Object.seal(this);        // prevent anyone from adding/removing/changing properties
    }
};
export { DCW_BASE };

// let _divDbgIdCounter = 0;    // for debug purposes
let _dcwDbgIdCounter = 0;


async function _onGetDch(pkt, dcw) {
    // await dcw.attachDch(pkt.id, pkt.rec.name);  // attach the approprate dch!

    const decoder = new DFDecoder(pkt.rec.content);
    const blob = decoder.decode();      // will return decoder.EOSTREAM if u8a is empty
    if (blob != decoder.EOSTREAM) {     // if stream was empty
        dcw.dch.importData(blob);
    }
}


