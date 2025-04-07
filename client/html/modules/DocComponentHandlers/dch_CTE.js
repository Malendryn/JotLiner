
class DCH_ContentEditable extends FG.DCH_BASE {     // CTE for div contenteditable="true" (poor man's RichText Editor)
    hasDiv    = true;  // see baseclass
    hasChunk  = true;  // see baseclass

    el;


    async construct() {
        this.el = await this.makeEl("div");
        this.el.setAttribute("contenteditable", "true");
        this.el.style.resize = "none";
    }


    async parse(sr) {
        this.el.innerHTML = await sr.readNext();
    }
    
    
    async unparse() {     // this loader loads the 'out of band' stuff not specifically inside a component
        debugger; return "";
    }
    
    
    async render() {
// we don't use render cuz this.el.innerHTML handles all that for us automatically
// --however-- another way is to set this.txt = await sr.readNext() in parse() above, and then here
// use this.el.innerHTML = this.txt
// but this.el already fully handles the textology entirely so we can get away with 
// storing the content directly in it, instead of storing it on this object AND inside this.el
    }
};
export { DCH_ContentEditable as DCH };      // always export 'as DCH' for docloader to attach to globalThis.DCH
