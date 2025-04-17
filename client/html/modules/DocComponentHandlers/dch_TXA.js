
class DCH_TXA extends FG.DCH_BASE {
    hasDiv    = true;  // see baseclass

    el;                 // becomes childof this.div and is a "textarea"  (see construct())


    async construct() {
        this.el = document.createElement("textarea");
        this.div.appendChild(this.el);
        this.el.style.position = "absolute";
        this.el.style.left = "0px";
        this.el.style.top = "0px";
        this.el.style.right = "0px";
        this.el.style.bottom = "0px";
        // el.style.backgroundColor = "lightgreen";

        this.el.style.resize = "none";                      // turn off the textarea's resizer dragbar
        this.el.style.backgroundColor = "lightGreen";
    }


    async loadDoc(sr) {
        this.el.innerHTML = await sr.readChunk();
    }
    
    
    async unloadDoc() {     // this loader loads the 'out of band' stuff not specifically inside a component
        debugger; return "";
    }
    

    async render() {
// we don't use render cuz this.el.innerHTML handles all that for us automatically
// --however-- another way is to set this.txt = await sr.readChunk() in loadDoc() above, and then here
// use this.el.innerHTML = this.txt
// but this.el already fully handles the textology entirely so we can get away with 
// storing the content directly in it, instead of storing it on this object AND inside this.el
    }
};
export { DCH_TXA as DCH };      // always export 'as DCH' for docloader to attach to globalThis.DCH
