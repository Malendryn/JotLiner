
// see https://www.tiny.cloud/blog/using-html-contenteditable/
// also consider tinyMCE



class DCH_CTE extends FG.DCH_BASE {     // CTE for div contenteditable="true" (poor man's RichText Editor)
    el;                 // becomes childof this.div and is a "div" that is "contexteditable"  (see construct())


    async construct() {
        this.el = document.createElement("div");
        this.div.appendChild(this.el);
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
    
    
//     async render() {
// // we don't use render cuz this.el.innerHTML handles all that for us automatically
// // --however-- another way is to set this.txt = await sr.readChunk() in importDoc() above, and then here
// // use this.el.innerHTML = this.txt
// // but this.el already fully handles the textology entirely so we can get away with 
// // storing the content directly in it, instead of storing it on this object AND inside this.el
//     }
};
export { DCH_CTE as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH
