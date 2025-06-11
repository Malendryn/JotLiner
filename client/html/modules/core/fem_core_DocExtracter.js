
/* extract the contents of a living dch AND its children into a dict as:
dict = {
    style:    {L:0,W:0,R:0,T:0,B:0,H:0},  // exactly FOUR of these six values ONLY
    name:     "dchName",
    children: [...]  // if this dch has children, extract them all as enries in this list
}
*/
export class DocExtracter {
    dchList;
    async extract(dch) {
        this.dchList = [];
        await this._extract(dch);  // turn the dch into a stream
        return this.dchList;
    }

    async _extract(dch) {
        let dchEl = {}
        let style = {};
        if (dch._s_sysDiv.style.left   != '') { style.L = parseInt(dch._s_sysDiv.style.left);   }
        if (dch._s_sysDiv.style.right  != '') { style.R = parseInt(dch._s_sysDiv.style.right);  }
        if (dch._s_sysDiv.style.width  != '') { style.W = parseInt(dch._s_sysDiv.style.width);  }
        if (dch._s_sysDiv.style.top    != '') { style.T = parseInt(dch._s_sysDiv.style.top);    }
        if (dch._s_sysDiv.style.bottom != '') { style.B = parseInt(dch._s_sysDiv.style.bottom); }
        if (dch._s_sysDiv.style.height != '') { style.H = parseInt(dch._s_sysDiv.style.height); }
        dchEl.style = style;
        dchEl.name = FF.getDchName(dch);
        dchEl.data = await dch.exportData();                              // get data from dch
        dchEl._s_children = (dch._s_children && dch._s_children.length) || 0; 
        this.dchList.push(dchEl);
        for (let idx = 0; idx < dchEl._s_children; idx++) {
            const child = dch._s_children[idx];
            await this._extract(child);
        }
    }
};
