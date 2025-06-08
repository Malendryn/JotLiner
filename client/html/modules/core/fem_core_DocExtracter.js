
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
        if (dch.__sysDiv.style.left   != '') { style.L = parseInt(dch.__sysDiv.style.left);   }
        if (dch.__sysDiv.style.right  != '') { style.R = parseInt(dch.__sysDiv.style.right);  }
        if (dch.__sysDiv.style.width  != '') { style.W = parseInt(dch.__sysDiv.style.width);  }
        if (dch.__sysDiv.style.top    != '') { style.T = parseInt(dch.__sysDiv.style.top);    }
        if (dch.__sysDiv.style.bottom != '') { style.B = parseInt(dch.__sysDiv.style.bottom); }
        if (dch.__sysDiv.style.height != '') { style.H = parseInt(dch.__sysDiv.style.height); }
        dchEl.style = style;
        dchEl.name = FF.getDchName(dch);
        dchEl.data = await dch.exportData();                              // get data from dch
        dchEl.children = (dch.__children && dch.__children.length) || 0; 
        this.dchList.push(dchEl);
        for (let idx = 0; idx < dchEl.children; idx++) {
            const child = dch.__children[idx];
            await this._extract(child);
        }
    }
};
