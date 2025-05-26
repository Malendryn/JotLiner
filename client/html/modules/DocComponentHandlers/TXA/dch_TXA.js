
class DCH_TXA extends FG.DCH_BASE {
    el;                 // becomes childof this.host and is a "textarea"  (see construct())

    static pluginName    = "<textarea> node";
    static menuTooltip = "A basic <textarea> node for simple and quick text entry";

    async construct() {
        this.el = document.createElement("textarea");
        this.el.style.position = "absolute";
        this.el.style.left = "0px";
        this.el.style.top = "0px";
        this.el.style.right = "0px";
        this.el.style.bottom = "0px";
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
    
    async onContentChanged(evt) {
        FF.autoSave();
    }
};
export { DCH_TXA as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH
