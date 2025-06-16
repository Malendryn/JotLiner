
import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class DCH_TXA extends DCH_BASE {
    el;                 // becomes childof this.host and is a "textarea"  (see construct())

    static pluginName    = "<textarea> node";
    static pluginTooltip = "A basic <textarea> node for simple and quick text entry";
           hasToolbar    = false;

    async construct() {
        this.el = document.createElement("textarea");
//        this.el.classList.add("AAA=el.TXA");
        this.el.style.position = "absolute";
        this.el.style.inset = "0px";
        this.el.style.resize = "none";                      // turn off the textarea's resizer drag-gadget at lowerright corner
        this.el.style.backgroundColor = "lightGreen";
        this.host.appendChild(this.el);
        this.tracker.add(this.el, "input", this.onContentChanged);
    }


    async importData(data) {    // populate this component with data
        this.el.value = data["C"];        // C for content
    }
    
    
    async exportData() {       // return data to be preserved/exported as a {}
        return { "C" : this.el.value };   // C for content
    }
    
    async isDirty() {
        debugger; return false;   // changes in here already handled by autoSave() so just return false-always
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// below here is DCH Plugin's  stuff ////////////////////////////////////////////////
    async onContentChanged(evt) {
        debugger; this.autoSave();
    }
};
export { DCH_TXA as DCH };      // always export 'as DCH' so DCH_<type>BASE can load-on-the-fly and attach to globalThis.DCH
