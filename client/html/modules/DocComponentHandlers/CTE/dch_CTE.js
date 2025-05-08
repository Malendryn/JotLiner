
// see https://www.tiny.cloud/blog/using-html-contenteditable/
// also consider tinyMCE

//             <!-- icons from https://icons8.com/icons/set/strikethrough--size-medium -->

class DCH_CTE extends FG.DCH_BASE {     // CTE for div contenteditable="true" (poor man's RichText Editor)
    hasToolbar = true;

    el;                     // becomes childof this._div and is a "div" that is "contexteditable"  (see construct())

    static menuText    = "Simple RichText node";
    static menuTooltip = "A RichText-like editor built using a contexteditable <div>";

    states = {              // RSTODO current state of buttons based on where cursor is
        "bold": false,
        "italic": false,
        "underline": false,
        "strikethrough":false
    }; 

    async construct() {
    // create the contenteditable div and attach it to this._div
        this.el = document.createElement("div");            // create a div inside ._div and make it contenteditable
        this.el.style.position = "absolute";
        this.el.style.left = "0px";
        this.el.style.top = "0px";
        this.el.style.right = "0px";
        this.el.style.bottom = "0px";
        this.el.style.resize = "none";
        this.el.style.padding = "2px";  // without this the cursor gets lost at start-of-line if there's a solid border 
        this.el.setAttribute("contenteditable", "true");
        this.el.style.backgroundColor = "aqua";
        this._div.appendChild(this.el);
        this.addDCHListener(this.el, "input", this.onContentChanged);

// create the icons for the toolbar and attach them to this._tbar
        let btn, img;
        btn = document.createElement("button");         // create a dchToolbarButton for Bold, Italic, and Underline
        btn.className = "dchButton";
        this._tBar.appendChild(btn);                // add it to the toolbar
        img = document.createElement("img");            // create a 24x24px img to put on button
        img.src = DCH_CTE._path + "/icons/bold-96.png";    //             <!-- icons from https://icons8.com/icons/set/strikethrough--size-medium -->
        btn.appendChild(img);
        this.addDCHListener(btn, "click", this.onToolBtnBold);

        btn = document.createElement("button");
        btn.className = "dchButton";
        this._tBar.appendChild(btn);
        img = document.createElement("img");
        img.src = DCH_CTE._path + "/icons/italic-52.png";
        btn.appendChild(img);
        this.addDCHListener(btn, "click", this.onToolBtnItalic);

        btn = document.createElement("button");
        btn.className = "dchButton";
        this._tBar.appendChild(btn);
        img = document.createElement("img");
        img.src = DCH_CTE._path + "/icons/underline-64.png";
        btn.appendChild(img);
        this.addDCHListener(btn, "click", this.onToolBtnUnderline);

        btn = document.createElement("button");
        btn.className = "dchButton";
        this._tBar.appendChild(btn);
        img = document.createElement("img");
        img.src = DCH_CTE._path + "/icons/strikethrough-64.png";
        btn.appendChild(img);
        this.addDCHListener(btn, "click", this.onToolBtnStrikethrough);
    }

    async onToolBtnBold(evt) {
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
