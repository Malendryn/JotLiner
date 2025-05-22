
export class DocExporter {

//  str = export(dch)  'streamify' dch and all children and return the string.
//  str = detach(dch)  detach/delete dch+children from doc entirely! (call export() seperately first to keep it! )

    async export(dch) {
        let str = await this._export(dch);  // turn the dch into a stream
        let ss = "@" + FG.VERSION + ";";
        if (dch == FG.curDoc.rootDch) {            // add the uuid only if exporting entire document
            ss += FG.curDoc.uuid;           // else just add the ; and leave uuid blank
        }

        return ss + ";\n" + str;
    }


    async detach(dch) {
        //RSTODO walk everything starting from deepest, remove all handlers, then delete object from tree
        // all the way up the chain to the top
    }
    
    async _export(dch) {
        let cName;
        for (const key in DCH) {            // get it's cName by searching for it in the loaded DCH ComponentHandlers
            if (dch instanceof DCH[key].dchClass) {  
                cName = key;
                break;
            }
        }
        let str = "";
        if (dch.__sysDiv.style.left   != '') {  str += this._elToStr("L", parseInt(dch.__sysDiv.style.left));   }
        if (dch.__sysDiv.style.right  != '') {  str += this._elToStr("R", parseInt(dch.__sysDiv.style.right));  }
        if (dch.__sysDiv.style.width  != '') {  str += this._elToStr("W", parseInt(dch.__sysDiv.style.width));  }
        if (dch.__sysDiv.style.top    != '') {  str += this._elToStr("T", parseInt(dch.__sysDiv.style.top));    }
        if (dch.__sysDiv.style.bottom != '') {  str += this._elToStr("B", parseInt(dch.__sysDiv.style.bottom)); }
        if (dch.__sysDiv.style.height != '') {  str += this._elToStr("H", parseInt(dch.__sysDiv.style.height)); }
        str = this._elToStr("<>", str);             // now wrap it all in a "<>" 

        let data = await dch.exportData();
        for (const key in data) {
            str += this._elToStr(key, data[key]);       // append all dch's private data to the str
        }
        str = this._elToStr(cName, str) + "\n";         // wrap it all with the cName and throw in a \n for readability
        let childCt = (dch.__children) ? dch.__children.length : 0;   // if null, =0, else =length
        for (let idx = 0; idx < childCt; idx++) {
            const child = dch.__children[idx];
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
        let vlen = val.length;
        if (testB64(val)) {
            val = new TextEncoder().encode(val);
            let bin = '';
            for (let byte of val) {
                bin += String.fromCharCode(byte);
            }
            val = btoa(bin);

            vlen = 0 - val.length;          // when uuencoded, store vlen as negative
        }
        return key + "=" + vlen + ";" + val;
    }
};
