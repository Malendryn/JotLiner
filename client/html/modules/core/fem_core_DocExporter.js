
export class DocExporter {

//  str = export(dch)  'streamify' dch and all children and return the string.
//  str = detach(dch)  detach/delete dch+children from doc entirely! (call export() seperately first to keep it! )

    async export(dch) {
        let str = await this._export(dch);                      // turn the dch into a stream
        return "@" + FG.VERSION + ";" + FG.docUuid + ";\n" + str;
    }


    async detach(dch) {
        //RSTODO walk everything starting from deepest, remove all handlers, then delete object from tree
        // all the way up the chain to the top
    }
    
    async _export(dch) {
        let cName;
        for (const key in DCH) {            // get it's cName by searching for it in the loaded DCH ComponentHandlers
            if (dch instanceof DCH[key]) {  
                cName = key;
                break;
            }
        }
        let str = "";
        if (dch.hasDiv) {
            if (dch._div.style.left   != '') {  str += this._elToStr("L", parseInt(dch._div.style.left));   }
            if (dch._div.style.right  != '') {  str += this._elToStr("R", parseInt(dch._div.style.right));  }
            if (dch._div.style.width  != '') {  str += this._elToStr("W", parseInt(dch._div.style.width));  }
            if (dch._div.style.top    != '') {  str += this._elToStr("T", parseInt(dch._div.style.top));    }
            if (dch._div.style.bottom != '') {  str += this._elToStr("B", parseInt(dch._div.style.bottom)); }
            if (dch._div.style.height != '') {  str += this._elToStr("H", parseInt(dch._div.style.height)); }
            str = this._elToStr("<>", str);             // now wrap it all in a "<>" 
        }
        let data = await dch.exportData();
        for (const key in data) {
            str += this._elToStr(key, data[key]);       // append all dch's private data to the str
        }
        str = this._elToStr(cName, str) + "\n";         // wrap it all with the cName and throw in a \n for readability
        let childCt = (dch.children !== null) ? dch.children.length : 0;   // if null, =0, else =length
        for (let idx = 0; idx < childCt; idx++) {
            const child = dch.children[idx];
            str += await this._export(child);
        }
        return childCt + ";" + str;         // prepend with how many children this dch has and return it
    }


    _elToStr(key, val) {
        if (typeof(val) === undefined) {            // undefined not supported so change it to a null  (RSTODO consider throwing error instead?)
            val = null;
        } else if (typeof(val) != "string") {
            val = val.toString();
        }
        function testB64(str) {
            for (let idx = 0; idx < str.length; idx++) {
                const ch = str.charCodeAt(idx);
                if (ch < 30 || ch > 126) {
                    return true;
                }
            }
            return false;
        }
        if (testB64(val)) {
            val = btoa(val);
        }
        return key + "=" + val.length + ";" + val;
    }
};
