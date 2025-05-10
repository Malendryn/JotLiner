
class DCH_CKEditor5 extends FG.DCH_BASE {     // https://ckeditor.com/docs/ckeditor5/latest/index.html
    el;                 // becomes childof this.rootDiv and is another  "div"  (see construct())

    static menuText    = "CK5 based node";
    static menuTooltip = "An editor based on CK5 (see https://ckeditor.com/docs/ckeditor5/latest/index.html)";

    async construct() {
        this.el = document.createElement("div");
        this.rootDiv.appendChild(this.el);
        this.el.style.position = "absolute";
        this.el.style.left = "0px";
        this.el.style.top = "0px";
        this.el.style.right = "0px";
        this.el.style.bottom = "0px";
        // el.style.backgroundColor = "lightgreen";

        this.el.setAttribute("contenteditable", "true");
        this.el.style.resize = "none";
    }


    async importData(data) {    // populate this component with data
        this.el.innerHTML = data["C"];        // C for content
    }
    
    
    async exportData() {       // return data to be preserved/exported as a {}
        return { "C" : this.el.innerHTML };
    }
};
export { DCH_CKEditor5 as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH
