
// see https://www.tiny.cloud/blog/using-html-contenteditable/
// also consider tinyMCE

//             <!-- icons from https://icons8.com/icons/set/strikethrough--size-medium -->

import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class DCH_CTE extends DCH_BASE {     // CTE for div contenteditable="true" (poor man's RichText Editor)

    static pluginName    = "RichText CTE Editor";
    static pluginTooltip = "A RichText-like editor built using a contenteditable <div>";
           hasToolbar    = true;
           toolbarHeight = 30;

    el;                     // becomes childof this.host and is a "div" that is "contexteditable"  (see construct())

    states = {              // RSTODO current state of buttons based on where cursor is
        "bold": false,
        "italic": false,
        "underline": false,
        "strikethrough":false
    }; 

    async construct() {
        await this.loadStyle("./dch_CTE_toolbar.css", {toolbar:true});    // add some <style> to the beginning of this.host
        await this.loadStyle("./dch_CTE_host.css", {host:true});          // add some <style> to the beginning of this.host
        this.el = document.createElement("div");        // create a div inside .host and make it contenteditable
        this.el.classList.add("CTE");                   // use the above-loaded .css class
        this.el.setAttribute("contenteditable", "true");

        this.el.innerHTML = '';         // if I don't do this and we don't type in it, it exports "undefined"
        this.host.appendChild(this.el);
        this.tracker.add(this.el, "input", this.onContentChanged);

// create the icons for the toolbar and attach them to this._tbar
        let btn, img;
        btn = document.createElement("button");         // create a dchToolbarButton for Bold, Italic, and Underline
        btn.className = "button";
        this.toolbar.appendChild(btn);                // add it to the toolbar
        img = document.createElement("img");            // create a 24x24px img to put on button
        img.src = this.srcUrl + "/icons/bold-96.png";    //             <!-- icons from https://icons8.com/icons/set/strikethrough--size-medium -->
        btn.appendChild(img);
        this.tracker.add(btn, "click", this.onToolBtnBold.bind(this));

        btn = document.createElement("button");
        btn.className = "button";
        this.toolbar.appendChild(btn);
        img = document.createElement("img");
        img.src = this.srcUrl + "/icons/italic-52.png";
        btn.appendChild(img);
        this.tracker.add(btn, "click", this.onToolBtnItalic.bind(this));

        btn = document.createElement("button");
        btn.className = "button";
        this.toolbar.appendChild(btn);
        img = document.createElement("img");
        img.src = this.srcUrl + "/icons/underline-64.png";
        btn.appendChild(img);
        this.tracker.add(btn, "click", this.onToolBtnUnderline.bind(this));

        btn = document.createElement("button");
        btn.className = "button";
        this.toolbar.appendChild(btn);
        img = document.createElement("img");
        img.src = this.srcUrl + "/icons/strikethrough-64.png";
        btn.appendChild(img);
        this.tracker.add(btn, "click", this.onToolBtnStrikethrough.bind(this));
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
    
    async isDirty() {
        return false;   // changes in here already handled by autoSave() so just return false-always
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// below here is DCH Plugin's  stuff ////////////////////////////////////////////////
    async onContentChanged(evt) {
        debugger; this.autoSave();
    }

};
export { DCH_CTE as DCH };      // always export 'as DCH' so DCH_<type>BASE can load-on-the-fly and attach to globalThis.DCH
