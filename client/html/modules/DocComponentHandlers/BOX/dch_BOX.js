
import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class DCH_BOX extends DCH_BASE {
    _s_children = [];      // changing to [] to allow children

    static pluginName    = "Infinite Box";
    static pluginTooltip = "A rectangle that other plugins can exist inside of";
           hasToolbar    = false;

    zX = 0;            // how far ALL children are shifted to give the appearance of infinite canvas
    zY = 0;

    setZXY(x, y) {
        debugger; if (zX != x || zY != y) {
            this.zX = x;
            this.zY = y;
            this._hw_translateChildren(dcw._s_dch.zX, dcw._s_dch.zY);
            this.autoSave();
        }
    }
    async construct() {
        // most styles are now in the DCH_BOX.css file
        // this._s_sysDiv.classList.add("DCH_BOX");
        this.host.classList.add("DCH_BOX"); // now = "DCW_DefaultRect DCH_BOX"
        await this.__getOwner()._hw_translateChildren(this.zX, this.zY);     // applies the transform:translate() if needed
    }

    async importData(data) {    // populate this component with data
        this.zX      = parseInt(data.zX);  // transform:translate(zX,zY) of all children of BOX to give the infinite canvas illusion
        this.zY      = parseInt(data.zY);  // (parseInt() not needed for FileFormat > 1.0, only for backwards compatibility)
    }

    async exportData() {       // return data to be preserved/exported as a {}
        debugger; return {
            zX: this.zX,
            zY: this.zY,
        };
    }

    async isDirty() {
        return false;   // changes in here already handled by autoSave() so just return false-always
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////////////////// below here is DCH Plugin's  stuff ////////////////////////////////////////////////
};
export { DCH_BOX as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH
