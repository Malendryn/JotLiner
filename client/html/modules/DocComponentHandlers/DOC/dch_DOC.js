
class DCH_DOC extends FG.DCH_BASE {
    hasDiv = false;

    ver = FG.VERSION;
    uuid = null;

    menuName() { debugger; return null; }
    menuDesc() { debugger; return null; }

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


