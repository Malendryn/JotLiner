
class DCH_BOX extends FG.DCH_BASE {
    __children = [];      // changing to [] to allow children

    static menuText    = "Box container";
    static menuTooltip = "A rectangle that other editor can be put inside of";

    zX = 0;         // how far to shift .host via translateXY
    zY = 0;
    scrollX = 0;    // how far to move the scrollbar 
    scrollY = 0;

    // static async onClassDef() {
    //     console.log(FF.__FILE__(), "****** onClassDef() ***********")
    //     await FG.DCH_BASE.loadCSS("DCH_BOX.css");
    // }
    

    async construct() {
        // most styles are now in the DCH_BOX.css file
        this.__sysDiv.classList.add("DCH_BOX");
        this.__scroll.classList.add("DCH_BOX_scroller");
        // this.__scroll.style.overflow = "auto";                  // enable scrollbars on the __scroll div NOT the __sysDiv
        // this.__scroll.style.backgroundColor = "#C1C1C1";        // make the scrollbox's background grey
        this.host.style.left = "0px";   // width/height are set during .update() but left/top are always 0
        this.host.style.top = "0px";
    }

    async destruct() {
        for (let idx = this.__children.length - 1; idx >= 0; idx--) {     // destroy them (in reverse order cuz 'parent.splice()'
            const child = this.__children[idx];
            await child.destroy();          // does the .splice() of my .__children internally so don't do it here!
            // this.__children.splice(idx, 1);
        }
    }

    async importData(data) {    // populate this component with data
        if (Object.keys(data).length > 0) {
            console.log(FF.__FILE__(), "importData xZ xY etc...")
            this.zX = data.zX;
            this.zY = data.zY;
            this.scrollX = data.sX;
            this.scrollY = data.sY;
        }
    }

    async exportData() {       // return data to be preserved/exported as a {}
        return {
            zX: this.zX,
            zY: this.zY,
            sX: this.scrollX,
            sY: this.scrollY,
        };
    }

    async update() {    // walk children to get bounding box size, then deal with zX zY etc...
        console.log(FF.__FILE__(), "UPDATE()");
        const pBox = this.__sysDiv.getBoundingClientRect();
        const rect = {
            x:      0,          // startat x=y=0 not 99999 cuz we only care if it goes negative
            y:      0, 
            width:  pBox.width, // startat w=h=host so if xy DOES go negative the scrollbar appears
            height: pBox.height 
        };
        for (let idx = 0; idx < this.__children.length; idx++) {
            const child = this.__children[idx];
            const box = child.__sysDiv.getBoundingClientRect();
            box.x = box.x - pBox.x;     // mod offsets so it's relative to parent
            box.y = box.y - pBox.y;
            if (box.x < rect.x) { rect.x = box.x; }
            if (box.y < rect.y) { rect.y = box.y; }
            if (box.x + box.width > rect.width) { rect.width = box.x + box.width; }
            if (box.y + box.height > rect.height) { rect.height = box.y + box.height; }
         }
         this.zX = (rect.x < 0) ? 0 - rect.x : 0;   // howFarTo shift X positively-only
         this.zY = (rect.y < 0) ? 0 - rect.y : 0;
         this.host.style.width = rect.width + "px";
         this.host.style.height = rect.height + "px";
         this.host.style.transform = `translate(${this.zX}px,${this.zY}px)`;


         console.log(FF.__FILE__(), "__scroll == next thoughts, we need to try to keep the scrollpos relative to this.scroll");
         //  this.__scroll.scrollLeft = this.zX;
        //  this.__scroll.scrollTop = this.zY;
    }
};
export { DCH_BOX as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH


