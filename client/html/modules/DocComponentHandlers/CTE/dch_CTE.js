
// see https://www.tiny.cloud/blog/using-html-contenteditable/
// also consider tinyMCE

//             <!-- icons from https://icons8.com/icons/set/strikethrough--size-medium -->

class DCH_CTE extends FG.DCH_BASE {     // CTE for div contenteditable="true" (poor man's RichText Editor)
    hasToolbar = true;

    el;                     // becomes childof this.host and is a "div" that is "contexteditable"  (see construct())

    static pluginName    = "RichText CTE Editor";
    static menuTooltip = "A RichText-like editor built using a contenteditable <div>";

    states = {              // RSTODO current state of buttons based on where cursor is
        "bold": false,
        "italic": false,
        "underline": false,
        "strikethrough":false
    }; 

    async construct() {
        await this.loadStyle("CTE.css");                // add some <style> to the beginning of this.host
        this.el = document.createElement("div");        // create a div inside .host and make it contenteditable
        this.el.classList.add("CTE");                   // use the above-loaded .css class
        this.el.setAttribute("contenteditable", "true");

        this.el.innerHTML = '';         // if I don't do this and we don't type in it, it exports "undefined"
        this.host.appendChild(this.el);
        FF.addTrackedListener(this.el, "input", this.onContentChanged);

// create the icons for the toolbar and attach them to this._tbar
        let btn, img;
        btn = document.createElement("button");         // create a dchToolbarButton for Bold, Italic, and Underline
        btn.className = "dchButton";
        this.toolbar.appendChild(btn);                // add it to the toolbar
        img = document.createElement("img");            // create a 24x24px img to put on button
        img.src = this.srcUrl + "/icons/bold-96.png";    //             <!-- icons from https://icons8.com/icons/set/strikethrough--size-medium -->
        btn.appendChild(img);
        FF.addTrackedListener(btn, "click", this.onToolBtnBold.bind(this));

        btn = document.createElement("button");
        btn.className = "dchButton";
        this.toolbar.appendChild(btn);
        img = document.createElement("img");
        img.src = this.srcUrl + "/icons/italic-52.png";
        btn.appendChild(img);
        FF.addTrackedListener(btn, "click", this.onToolBtnItalic.bind(this));

        btn = document.createElement("button");
        btn.className = "dchButton";
        this.toolbar.appendChild(btn);
        img = document.createElement("img");
        img.src = this.srcUrl + "/icons/underline-64.png";
        btn.appendChild(img);
        FF.addTrackedListener(btn, "click", this.onToolBtnUnderline.bind(this));

        btn = document.createElement("button");
        btn.className = "dchButton";
        this.toolbar.appendChild(btn);
        img = document.createElement("img");
        img.src = this.srcUrl + "/icons/strikethrough-64.png";
        btn.appendChild(img);
        FF.addTrackedListener(btn, "click", this.onToolBtnStrikethrough.bind(this));
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
        this.el.innerHTML = data["C"];        // "C" for content
    }
    
    async exportData() {       // return data to be preserved/exported as a {}
        return { "C" : this.el.innerHTML };   // "C" for content
    }
    
    async onContentChanged(evt) {
        FF.autoSave();
    }
};
export { DCH_CTE as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH
