
class DCH_BOX extends FG.DCH_BASE {
// this component has children[]

    async construct() {
        // debugger;
    }


    async importData(data) {    // populate this component with data
        // debugger;
    }


    async exportData() {       // return data to be preserved/exported as a {}
        // debugger; return {};
    }

    
    // async render() {
    //     for (const child of this.children) {
    //         await child.render();
    //     }
    // }
};
export { DCH_BOX as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH


