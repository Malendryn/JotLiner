
class DCH_TXT extends FF.DocComBASE {
    txt = "";
    load(str)    { _load.call(this, str); }     // load str (possibly binary)
    render()     { _render.call(this); }        // rerender entire object and all its children


//#####################################################################################################################
    constructor(parent) {
        super(parent);
    };
};
export { DCH_TXT as DCH };      // always expoart 'as DCH' for docloader to attach to globalThis.DCH


function _load(str) {
    this.txt = str;
}


function _render() {                // render the box and all its children
    debugger;
}

