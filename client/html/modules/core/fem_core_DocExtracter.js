
/* extract the contents of a living dch AND its children into a dict as:
dict = [
    [
        dch.recId,
       {  
           S:   dcw.style as {L:0,W:0,R:0,T:0,B:0,H:0},
           C:   dcw.childCount
        }
    ], ...
]
*/

import { DFDict } from "/public/classes/DFDict.mjs";

export class DocExtracter {
    dcwDict;
    extract(dcw) {        // returns the dcwList of a doc [[__recId, {S,C}],...] as a DFDict
        this.dcwDict = new DFDict();
        this. _extract(dcw);  // turn the dch into a stream
        return this.dcwDict;
    }

    _extract(dcw) { // no async/await as no longer reaching into uncharted territory(into the dch itself)
        let style = {};
        if (dcw._s_sysDiv.style.left   != '') { style.L = parseInt(dcw._s_sysDiv.style.left);   }
        if (dcw._s_sysDiv.style.right  != '') { style.R = parseInt(dcw._s_sysDiv.style.right);  }
        if (dcw._s_sysDiv.style.width  != '') { style.W = parseInt(dcw._s_sysDiv.style.width);  }
        if (dcw._s_sysDiv.style.top    != '') { style.T = parseInt(dcw._s_sysDiv.style.top);    }
        if (dcw._s_sysDiv.style.bottom != '') { style.B = parseInt(dcw._s_sysDiv.style.bottom); }
        if (dcw._s_sysDiv.style.height != '') { style.H = parseInt(dcw._s_sysDiv.style.height); }
        const data = {
            S: style, 
            C: dcw._s_children.length
        };
        this.dcwDict.append(dcw._s_dch.__recId, data);              // must happen before walking children
        for (let idx = 0; idx < dcw._s_children.length; idx++) {
            this._extract(dcw._s_children[idx]);
        }
    }
};
