
class DCH_BOX extends FG.DCH_BASE {
    __children = [];      // changing to [] to allow children

    static menuText    = "Box container";
    static menuTooltip = "A rectangle that other editor can be put inside of";


    // static async onClassDef() {
    //     console.log(FF.__FILE__(), "****** onClassDef() ***********")
    //     await FG.DCH_BASE.loadCSS("DCH_BOX.css");
    // }
    

    async construct() {
        // host styles are now in the DCH_BOX.css file
        // this.__sysDiv.style.border = "1px dashed black";    // put border around dch div NOT the host within
        // this.__sysDiv.style.boxShadow = "0 0 0 1px black";    // put faux border around dch div NOT the host within
        this.__sysDiv.style.overflow = "auto";              // enable scrollbars
        // this.host.style.border = "1px dashed black";        // put border around host, NOT __sysDiv
        this.__sysDiv.classList.add("DCH_BOX");
        this.host.style.backgroundColor = "#C1C1C1";        // make the user-accessable host's background grey
    }

    async destruct() {
        for (let idx = this.__children.length - 1; idx >= 0; idx--) {     // destroy them (in reverse order cuz 'parent.splice()'
            const child = this.__children[idx];
            await child.destroy();
            this.__children.splice(idx, 1);
        }
    }

    async importData(data) {    // populate this component with data
        // debugger;
    }


    async exportData() {       // return data to be preserved/exported as a {}
        return {};
    }
};
export { DCH_BOX as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH


