
class DCH_BOX extends FG.DCH_BASE {

    children = [];      // changing to [] to allow children

    static menuText    = "Box container";
    static menuTooltip = "A rectangle that other editor can be put inside of";

    async construct() {
        this._div.style.backgroundColor = "#C1C1C1";
        this._div.style.border = "1px dashed black";
    }


    async importData(data) {    // populate this component with data
        // debugger;
    }


    async exportData() {       // return data to be preserved/exported as a {}
        return {};
    }

    
    // async render() {
    //     for (const child of this.children) {
    //         await child.render();
    //     }
    // }
};
export { DCH_BOX as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH


