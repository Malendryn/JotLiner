
import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class DCH_BOX extends DCH_BASE {
    _s_children = [];      // changing to [] to allow children

    static pluginName    = "Infinite Box";
    static pluginTooltip = "A rectangle that other plugins can exist inside of";
           hasToolbar    = false;


    get zX()  { return this.#zX; }
    set zX(v) { throw new Error("BOX.zX is readonly"); }
    get zY() { return this.#zY; }
    set zY(v) { throw new Error("BOX.zY is readonly"); }


    #zX = 0;            // how far ALL children are shifted to give the appearance of infinite canvas
    #zY = 0;

    setZXY(x, y) {
        if (this.#zX != x || this.#zY != y) {
            this.#zX = x;
            this.#zY = y;
            this.owner._hw_translateChildren(this.#zX, this.#zY);
            this.autoSave();
        }
    }
    async construct() {
        // most styles are now in the DCH_BOX.css file
        // this.sysDiv.classList.add("DCH_BOX");
        
        this.host.classList.add("DCH_BOX"); // now = "DCW_DefaultRect DCH_BOX"
        await this.owner._hw_translateChildren(this.#zX, this.#zY);     // applies the transform:translate() if needed
    }

    _wh_updateZxy() {   // called straight through from DCW_BASE
        this.owner._hw_translateChildren(this.#zX, this.#zY);     // applies the transform:translate() if needed
    }
    async importData(data) {    // populate this component with data
        this.#zX = parseInt(data.zX);  // transform:translate(zX,zY) of all children of BOX to give the infinite canvas illusion
        this.#zY = parseInt(data.zY);  // (parseInt() not needed for FileFormat > 1.0, only for backwards compatibility)
        this.owner._hw_translateChildren(this.#zX, this.#zY);     // applies the transform:translate() if needed
    }

    async exportData() {       // return data to be preserved/exported as a {}
        return {
            zX: this.#zX,
            zY: this.#zY,
        };
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// below here is DCH Plugin's  stuff ////////////////////////////////////////////////
};
export { DCH_BOX as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH
