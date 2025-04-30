
class DCH_DOC extends FG.DCH_BASE {
    hasDiv = false;     // component does not require a <div> to operate within

    children = [];      // changing to [] to allow children
    
    ver = FG.VERSION;
    uuid = null;

    static menuText    = null;
    static menuTooltip = null;

    async construct() {
        this.uuid = FF.makeUUID();                          // WILL be replaced if importData()
        this._div = document.getElementById("docWrapper");  // so children[] have something to attach to
    }


    async importData(data) {    // populate this component with data
        this.ver = data.V;
        this.uuid = data.U;
        // debugger;
    }


    async exportData() {       // return data to be preserved/exported as a {}
        const data = {
            V: this.ver,
            U: this.uuid,
        }
        return data;
    }

    
    // async render() {
    //     for (const child of this.children) {
    //         await child.render();
    //     }
    // }
};
export { DCH_DOC as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH


