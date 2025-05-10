
// see https://www.tiny.cloud/blog/using-html-contenteditable/
// also consider tinyMCE

//             <!-- icons from https://icons8.com/icons/set/strikethrough--size-medium -->

class DCH_CTE extends FG.DCH_BASE {     // CTE for div contenteditable="true" (poor man's RichText Editor)
    hasToolbar = true;

    el;                     // becomes childof this.rootDiv and is a "div" that is "contexteditable"  (see construct())

    static menuText    = "Simple RichText node";
    static menuTooltip = "A RichText-like editor built using a contexteditable <div>";

    states = {              // RSTODO current state of buttons based on where cursor is
        "bold": false,
        "italic": false,
        "underline": false,
        "strikethrough":false
    }; 

    async construct() {
    // create the contenteditable div and attach it to this.rootDiv
        this.el = document.createElement("div");            // create a div inside .rootDiv and make it contenteditable
        this.el.style.position = "absolute";
        this.el.style.left = "0px";
        this.el.style.top = "0px";
        this.el.style.right = "0px";
        this.el.style.bottom = "0px";
        this.el.style.resize = "none";
        this.el.style.padding = "2px";  // without this the cursor gets lost at start-of-line if there's a solid border 
        this.el.setAttribute("contenteditable", "true");
this.el.style.border     = "1px solid black";      //??RSTEMP?? get-us-going mods to experiment on the el
// this.el.style.backgroundColor = "lightsalmon";
this.el.style.overflow   = "hidden";
this.el.style.whiteSpace = "nowrap";
        this.el.style.backgroundColor = "aqua";
        this.el.style.whiteSpace = "pre-wrap";       // preserve whitespace and wrap as needed
        this.el.style.wordWrap   = "break-word";     // auto-break very large words if needed
        this.el.innerHTML = '';         // if I don't do this and we don't type in it, it exports "undefined"
        this.rootDiv.appendChild(this.el);
        this.addDCHListener(this.el, "input", this.onContentChanged);

// create the icons for the toolbar and attach them to this._tbar
        let btn, img;
        btn = document.createElement("button");         // create a dchToolbarButton for Bold, Italic, and Underline
        btn.className = "dchButton";
        this.toolbar.appendChild(btn);                // add it to the toolbar
        img = document.createElement("img");            // create a 24x24px img to put on button
        img.src = DCH_CTE.srcUrl + "/icons/bold-96.png";    //             <!-- icons from https://icons8.com/icons/set/strikethrough--size-medium -->
        btn.appendChild(img);
        this.addDCHListener(btn, "click", this.onToolBtnBold.bind(this));

        btn = document.createElement("button");
        btn.className = "dchButton";
        this.toolbar.appendChild(btn);
        img = document.createElement("img");
        img.src = DCH_CTE.srcUrl + "/icons/italic-52.png";
        btn.appendChild(img);
        this.addDCHListener(btn, "click", this.onToolBtnItalic.bind(this));

        btn = document.createElement("button");
        btn.className = "dchButton";
        this.toolbar.appendChild(btn);
        img = document.createElement("img");
        img.src = DCH_CTE.srcUrl + "/icons/underline-64.png";
        btn.appendChild(img);
        this.addDCHListener(btn, "click", this.onToolBtnUnderline.bind(this));

        btn = document.createElement("button");
        btn.className = "dchButton";
        this.toolbar.appendChild(btn);
        img = document.createElement("img");
        img.src = DCH_CTE.srcUrl + "/icons/strikethrough-64.png";
        btn.appendChild(img);
        this.addDCHListener(btn, "click", this.onToolBtnStrikethrough.bind(this));
    }

    onToolBtnBold(evt) {
        evt.preventDefault;
        console.log("bold");
    }

    onToolBtnItalic(evt) {
        evt.preventDefault;
        console.log("italic");
        // debugger;
    }

    onToolBtnUnderline(evt) {
        evt.preventDefault;
            debugger;
    }

    onToolBtnStrikethrough(evt) {
        evt.preventDefault;
        debugger;
    }

    async importData(data) {    // populate this component with data
        this.el.innerHTML = data["C"];        // C for content
    }
    
    async exportData() {       // return data to be preserved/exported as a {}
        return { "C" : this.el.innerHTML };
    }
    
    async onContentChanged(evt) {
        FF.autoSave();
    }
};
export { DCH_CTE as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH
