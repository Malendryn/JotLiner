
/* extract the contents of a living dch AND its children into a dict as:
dict = {
    id: {    id of rec in table:dch
        S:   dcw.style as {L:0,W:0,R:0,T:0,B:0,H:0},
        C:   dcw.childCount
    }, ...
}
*/
export class DocExtracter {
    meta;
    dchList;
    async extract(dcw) {        // returns the meta of a doc {dchId.toString():{S,C},...}
        debugger; this.meta = {};
        await this. _extract(dcw);  // turn the dch into a stream
        return this.dchList;
    }

    async _extract(dcw) {
        debugger; const dch = dcw._s_dch;
        let style = {};
        if (dch._s_sysDiv.style.left   != '') { style.L = parseInt(dch._s_sysDiv.style.left);   }
        if (dch._s_sysDiv.style.right  != '') { style.R = parseInt(dch._s_sysDiv.style.right);  }
        if (dch._s_sysDiv.style.width  != '') { style.W = parseInt(dch._s_sysDiv.style.width);  }
        if (dch._s_sysDiv.style.top    != '') { style.T = parseInt(dch._s_sysDiv.style.top);    }
        if (dch._s_sysDiv.style.bottom != '') { style.B = parseInt(dch._s_sysDiv.style.bottom); }
        if (dch._s_sysDiv.style.height != '') { style.H = parseInt(dch._s_sysDiv.style.height); }
        for (let idx = 0; idx < dch._s_children; idx++) {
            await this._extract(dch._s_children[idx]);
        }
        this.meta[dch.__recId] = {
            S: style, 
            C: dcw._s_children
        };
    }
};
