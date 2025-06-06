
import { DCH_ShadowBASE } from "/modules/classes/class_DCH_ShadowBASE.js";

class DCH_BOX extends DCH_ShadowBASE {
    __children = [];      // changing to [] to allow children

    static pluginName    = "Infinite Box";
    static pluginTooltip = "A rectangle that other plugins can exist inside of";
           hasToolbar    = false;

    zX = 0;            // how far ALL children are shifted to give the appearance of infinite canvas
    zY = 0;

    async construct() {
        // most styles are now in the DCH_BOX.css file
        this.__sysDiv.classList.add("DCH_BOX");
        this.host.style.left   = "0px";   // host always sizes to match __sysDiv
        this.host.style.top    = "0px";
        this.host.style.right  = "0px";
        this.host.style.bottom = "0px";
        this.update();                    // applies the transform:translate() if needed
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
            this.zX      = parseInt(data.zX);  // transform:translate(zX,zY) of all children of BOX to give the infinite canvas illusion
            this.zY      = parseInt(data.zY);  // NOTE: parseInt() not needed for FileFormat > 1.0, here only for backwards compatibility
        }
    }

    async exportData() {       // return data to be preserved/exported as a {}
        return {
            zX: this.zX,
            zY: this.zY,
        };
    }


    async update() {    // walk children to get bounding box size, then deal with zX zY etc...
        if (!this.__children.length) {  // no children?  no update!
            return false;
        }

        for (let idx = 0; idx < this.__children.length; idx++) {        // get the bounding box around all children
            const child = this.__children[idx];
            child.__sysDiv.style.transform = "translate(" + this.zX + "px," + this.zY + "px)";
        }
     }
};
export { DCH_BOX as DCH };      // always export 'as DCH' so DCH_ShadowBASE can load-on-the-fly and attach to globalThis.DCH
