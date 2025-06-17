
/* extract the contents of a living dch AND its children into a dict as:
dict = [
    [
        dcw.dchRecId,
       {  
           N:   "BOX",
           S:   dcw.style as {L:0,W:0,R:0,T:0,B:0,H:0},
           C:   dcw.childCount
        }
    ], ...
]
*/

import { DFDict } from "/public/classes/DFDict.mjs";

export class DocExtracter {
    dcwDict;
    extract(dcw) {        // returns the dcwFlatTree of a doc [[recId, {N,S,C}],...] as a DFDict
        this.dcwDict = new DFDict();
        this. _extract(dcw);  // turn the dch into a stream
        return JSON.stringify(this.dcwDict.export());
    }

    _extract(dcw) { // no async/await as no longer reaching into uncharted territory(into the dch itself)
        let style = {};
        if (dcw.sysDiv.style.left   != '') { style.L = parseInt(dcw.sysDiv.style.left);   }
        if (dcw.sysDiv.style.right  != '') { style.R = parseInt(dcw.sysDiv.style.right);  }
        if (dcw.sysDiv.style.width  != '') { style.W = parseInt(dcw.sysDiv.style.width);  }
        if (dcw.sysDiv.style.top    != '') { style.T = parseInt(dcw.sysDiv.style.top);    }
        if (dcw.sysDiv.style.bottom != '') { style.B = parseInt(dcw.sysDiv.style.bottom); }
        if (dcw.sysDiv.style.height != '') { style.H = parseInt(dcw.sysDiv.style.height); }
        const data = {
            N: FF.getDchName(dcw.dch),   // stow name always so we can at least apply dch if importData/exportData fails
            S: style, 
            C: dcw.children.length,
        };

        this.dcwDict.append(dcw.dchRecId, data);              // must happen before walking children
        for (let idx = 0; idx < dcw.children.length; idx++) {
            this._extract(dcw.children[idx]);
        }
    }
};
