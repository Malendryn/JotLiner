// ALL this does is load a SINGLE DocComponent, and populates it based on its type
// it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)

// reads data from a string(stream) and parses it out into a component in a few different ways.
// typical use 
// X = new DocImpExp();     // create the importer-exporter
// X.attach(str, div);      // attach the component (and all its children) to <div> (and div's handler)
// X.detach(div);           // detach component(and all its children) from <div> and return exportable str

import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

export class DocAttacher {   // create and return a DCH from a stream
    rootDch;
    dchList;
    dchLIdx;
    dict = {
        version: FG.VERSION,   // 1.2, etc  
        uuid: "",              // "12345678-1234-1234-1234-123456789abc" if a full doc, else empty string if just a component part
//        name: "",            // ONLY PRESENT IF V1.2 or later full name as shown in indexPane
//        error: ""            // ONLY PRESENT IF ERROR OCCURRED!
    }

    async attach(dchList, parent)  {        // attach as child of parent.__sysDiv  (or to "divDocView" if parent=null)
        this.rootDch = null;
        this.dchList = dchList;
        this.dchLIdx = 0;
        await this._importNext(parent);   // if a parent was passed, add this as child
        return this.rootDch;
    }


    async _importNext(parent) {
        if (this.dchLIdx > this.dchList.length) {       // if end of dchEls
            return null;                        
        }
        const dchEntry = this.dchList[this.dchLIdx++];
        const dch = await DCH_BASE.create(dchEntry.name, parent, dchEntry.style);  // create handler, assign parent, create <div>, set style
        if (!dch) {
            return;
        }
        if (this.rootDch == null) {         // record the topmost dch for returning
            this.rootDch = dch;
        }
        if (parent) {                       // if parent was passed, attach this to its children
            parent.__children.push(dch);
        }
        try {
            await dch.importData(dchEntry.data);                         // implant the data into the <div>
        } catch (err) {
            console.warn("Error importing data of dch '" + dchEntry.name + "', " + err.message);
        }

        for (let idx = 0; idx < dchEntry.children; idx++) {          // load children of component (if any)
            await this._importNext(dch);
        }
        await dch.update();     //finally AFTER ALL children loaded, update plugin!
    }
};
