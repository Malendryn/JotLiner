
class StreamWriter {
    list = [];
    brk = String.fromCharCode(0x1E);

    writeRaw(uint8array) {
        this.list.push(uint8array);
    }

    // writeEl(val, brk=this.brk) {
    //     const dict = this.encode(val);
    //     this.list.push(new TextEncoder().encode(dict.type));
    //     if ()
    //     this.writeRaw(val + brk, dType);
    // }

    encodeKeyVal(key, val) {
        const dict = this.encode(val);
        let tmp = dict.type + key + "=" + dict.uint8array.length + this.brk;
        tmp = [new TextEncoder().encode(tmp)];
        tmp.push(dict.uint8array);
        return this.compress(tmp);
    }
    writeKeyVal(key, val) {
        let kv = this.encodeKeyVal(key, val);
        this.writeRaw(kv);
    }

    // _encode(val, dType) {
    //     let ss;
    //     switch(dType) {
    //         case '?': { debugger;                           return null; }  // undefined have no body
    //         case '~': { debugger;                           return null; }  // null has no body
    //         case 'B': { debugger; ss = (val) ? "t" : "f";   break;       }  // true/false become 't' or 'f'
    //         case 'N': { debugger; ss = val + "";            break;       }  // numbers get textified
    //         case 'S': { debugger; ss = val;                 break;       }  // strings are as-is TextEncoded
    //         case 'A': { debugger; ss = JSON.stringify(val); break;       }  // arrays are stringified
    //         case 'O': { debugger; ss = JSON.stringify(val); break;       }  // objects are stringified
    //     }
    //     return new TextEncoder().encode(val);
    // }

    encode(val) {    // returns dict of {type: chr, uint8array:UInt8Array (or null if ~ or ?)}
        const dict = { uint8array: null };       // preset uint8array to null to save space below
        if (val instanceof Uint8Array) {
            dict.type = "u";                // for 'Uint8Array'
            dict.uint8array = val;
        } else {
            if (val === undefined) {
                dict.type = '?';  debugger; dict.uint8array = new TextEncoder().encode("");
            } else if (val === null) {
                dict.type = '~';   debugger; dict.uint8array = new TextEncoder().encode("");
            } else if (typeof val == "boolean") {
                dict.type = "B";   debugger; dict.uint8array = new TextEncoder().encode((val) ? "t" : "f");
            } else if (typeof val == "number") {
                dict.type = "N";   dict.uint8array = new TextEncoder().encode(val.toString());
            } else if (typeof val  == "string") {
                dict.type = "S";   dict.uint8array = new TextEncoder().encode(val);
            } else if (Array.isArray(val)) {
                dict.type = "A";   debugger; dict.uint8array = new TextEncoder().encode(JSON.stringify(val));
            } else {                                                                    // only thing really left here is an {} object
                dict.type = "O";   debugger; dict.uint8array = new TextEncoder().encode(JSON.stringify(val));
            }
        }
        return dict;
    }

    compress(uint8aList) {
        const len = uint8aList.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Uint8Array(len);
        let offset = 0;
        for (const entry of uint8aList) {
          result.set(entry, offset);
          offset += entry.length;
        }
        return result;
    }
};

export class DocExporter {
    brk = String.fromCharCode(0x1E);      // new for V1.2 and up, uses BREAK charcode 1E instead of ';'
    sw;

    accum = [];
    async export(dch) {
        this.sw = new StreamWriter();
        this.accum.push(new TextEncoder().encode("@" + FG.VERSION + ';'));
        this.accum.push(new TextEncoder().encode(FG.curDoc.uuid + this.sw.brk));
        const info = FF.getDocInfo(FG.curDoc.uuid);
        this.accum.push(new TextEncoder().encode(info.name + this.sw.brk));

        await this._export(dch);  // turn the dch into a stream
        return this.sw.compress(this.accum);
    }

    async _export(dch) {
        const cName = FF.getDchName(dch);
        let kv = [];
        if (dch.__sysDiv.style.left   != '') {  kv.push(this.sw.encodeKeyVal("L", parseInt(dch.__sysDiv.style.left)));   }
        if (dch.__sysDiv.style.right  != '') {  kv.push(this.sw.encodeKeyVal("R", parseInt(dch.__sysDiv.style.right)));  }
        if (dch.__sysDiv.style.width  != '') {  kv.push(this.sw.encodeKeyVal("W", parseInt(dch.__sysDiv.style.width)));  }
        if (dch.__sysDiv.style.top    != '') {  kv.push(this.sw.encodeKeyVal("T", parseInt(dch.__sysDiv.style.top)));    }
        if (dch.__sysDiv.style.bottom != '') {  kv.push(this.sw.encodeKeyVal("B", parseInt(dch.__sysDiv.style.bottom))); }
        if (dch.__sysDiv.style.height != '') {  kv.push(this.sw.encodeKeyVal("H", parseInt(dch.__sysDiv.style.height))); }
        kv = [this.sw.encodeKeyVal("<>", this.sw.compress(kv))];    // now wrap it all in a "<>" and put it in a new []
        let data = await dch.exportData();                              // get data from dch

        for (const key in data) {
            kv.push(this.sw.encodeKeyVal(key, data[key]));      // append all dch's exportable data to the str
        }
        kv = this.sw.compress(kv);                              // finally compress it all into a single Uint8Array

        const childCt = (dch.__children && dch.__children.length) || 0;
        this.accum.push(new TextEncoder().encode(childCt + this.sw.brk + cName + "=" + kv.length + this.sw.brk));
        this.accum.push(kv);

        for (let idx = 0; idx < childCt; idx++) {
            const child = dch.__children[idx];
            await this._export(child);
        }
    }


    // _elToStr(key, val) {
    //     let dtype;
    //     if (val instanceof Uint8Array) {
    //         dtype = "u";    // for 'Uint8Array'
    //         let bin = '';
    //         for (let byte of val) {
    //             bin += String.fromCharCode(byte);
    //         }
    //         val = btoa(bin);
    //     } else {
    //         if (val === undefined) {
    //             debugger; val = '';
    //             dtype = '?';
    //         } else if (val === null) {
    //             debugger; val = '';
    //             dtype = "~";
    //         } else if (typeof val == "boolean") {
    //             debugger; val = (val) ? "t" : "f"
    //             dtype = "B";
    //         } else if (typeof val == "number") {
    //             val = val.toString();
    //             dtype = "N";
    //         } else if (typeof val  == "string") {
    //             dtype = "S";
    //         } else if (Array.isArray(val)) {
    //             debugger; val = JSON.stringify(val);
    //             dtype = "A";
    //         } else {
    //             debugger; val = JSON.stringify(val);    // only thing really left here is an {} object
    //             dtype = "O";
    //         }
    //         if (!dtype) {
    //             const tmp = Object.prototype.toString.call(val).slice(8, -1);
    //             console.log(FF.__FILE___(), "invalid datatype for export: '" + tmp + "'");
    //             return '';
    //         }
    //         function testB64(str) {
    //             for (let idx = 0; idx < str.length; idx++) {
    //                 const ch = str.charCodeAt(idx);
    //                 if (ch < 30 || ch > 126) {
    //                     return true;
    //                 }
    //             }
    //             return false;
    //         }
    //         if (testB64(val)) {
    //             dtype = dtype.toLowerCase();            // change ABNS to abns to flag as encoded
    //             val = new TextEncoder().encode(val);
    //             let bin = '';
    //             for (let byte of val) {
    //                 bin += String.fromCharCode(byte);
    //             }
    //             val = btoa(bin);
    //         }
    //     }
    //     const vlen = val.length + 1;    // the +1 is for the new dtype char
    //     return key + "=" + vlen.toString() + this.brk + dtype + val;
    // }
};
