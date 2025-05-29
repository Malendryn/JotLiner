/*
    obj -> stream  (Uint8Array)


*/
class DFEncoder {
    // bytes = encode(obj) {}       // return a Uint8Array of the object in question
    // obj   = decode(bytes) {}     // return a decoded Uint8Array bytestream

    encode(val) {
        const list = [];
        let tmp = undefined;
 // 0-15 are types with no datalen        
        if (val === undefined) {
            list.push(this._makeHeader(1, 0));                      // 1 = undefined
        } else if (val === null) {
            list.push(this._makeHeader(2, 0));                      // 2 = null
        } else if (typeof val == "boolean") {
            list.push(this._makeHeader((val) ? 3 : 4, 0));          // 3 = true, 4 = false

// 16 - 31 are single element types like number, string, Uint8Array            
        } else if (typeof val == "number") {
            tmp = new TextEncoder().encode(val.toString());
            list.push(this._makeHeader(23, tmp.length));             // 16-23 are numeric types, right now only 23, jsType Number()
        } else if (typeof val  == "string") {
            tmp = new TextEncoder().encode(val);
            list.push(this._makeHeader(24, tmp.length));             // 24 = string
        } else if (val instanceof Uint8Array) {
                list.push(this._makeHeader(25, val.length));         // 25 = Uint8Array
                list.push(val);

// 32-47 are arrayTypes like [] and {}
        } else if (Array.isArray(val)) {    // we push serial w/o grouping first so decode<test=true> even checks INSIDE lits/obj for validity
            // const tmp2 = new TextEncoder().encode(val.length.toString()); // get numEls
            list.push(this._makeHeader(32, val.length));                     // 32 = Array[]    // here .length = numEls not bytelength
            // list.push(encode(val.length));                                   // now push numEls
            for (const item of val) {
                list.push(this.encode(item));                               // now push els
            }
        } else {                            // only thing really left here is an {} object
            const keys = Object.keys(val);                                  // get keys
            list.push(this._makeHeader(33, keys.length));                      // 33 = Object{}  // here .length = numPairs not bytelength
            // const pairCt = new TextEncoder().encode(keys.length.toString());   // get numPairs
            // list.push(this._makeHeader(33, pairCt.length));                     // 33 = Object{}
            // list.push(pairCt);                                                 // push numPairs
            for (const key of keys) {                                          // push key-then-val groups
                list.push(this.encode(key));        // encode key-then-val as a pair
                list.push(this.encode(val[key]));
            }
        }
        if (tmp) {
            list.push(tmp);
        }
        return this._concat(list);
    }

    _makeHeader(type, size) {
        if (size > 0xFFFFFFFF) {
            throw new Error("byteCount exceeds max of 4294967295");
        }
        let u8a, hBytes;    // header bytes for size
        if (size == 0) {
            hBytes = 0;
        } else if (size < 255) {
            hBytes = 1;
        } else if (size < 65535) {
            hBytes = 2;
        } else {
            hBytes = 3;
        }
        u8a = new Uint8Array(hBytes + 1);
        u8a[0] = type | (hBytes << 6);
        if (hBytes == 3) {  // header bytes decoded 0123 -> 0124 for actual bytes
            hBytes = 4;
        }
        let idx = 1;
        while(hBytes--) {
            u8a[idx++] = size & 0xFF;
            size = size > 8;
        }
        return u8a;
    }

    _concat(uint8aList) {
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


class DFDecoder {
    constructor(u8a) {
        this.u8a = u8a;
        this.idx = 0;
    }

    decode() {
        let [dType,len] = this._parseHeader();
        let val;
        if (dType < 16) {       // 0-15 = types with no datalen
            switch(dType) {  
                case 1:  { return undefined; }       // type 1 = undefined
                case 2:  { return null;      }       // type 2 = null
                case 3:  { return true;      }       // type 3 = true
                case 4:  { return false;     }       // type 4 = valse
            }
        }
        if (dType < 32) {       // 16 - 31 are singular types like number, string, Uint8Array
            let start = this.idx;
            this.idx += len;
            val = this.u8a.subarray(start, this.idx); // obtain a 'view' into the original array
            switch(dType) {
                case 23:  { return Number(new TextDecoder().decode(val)); }  // 16-23 are numeric types, right now only 23, jsType Number()
                case 24:  { return new TextDecoder().decode(val);         }  // type 24 = string
                case 25:  { return val;                                   }  // type 25 = Uint8Array
            }
        }

        if (dType < 48) {       // 32-47 are arrayTypes like [] and {}
            if (dType == 32) {                                                // type 32 = Array[]
                let list = [];
                while (len--) {
                    list.push(this.decode());
                }
                return list;
            } else if (dType == 33) {                                         // type 33 = Object{}
                let dict = {};
                while (len--) {
                    const key = this.decode();
                    dict[key] = this.decode();
                }
                return dict;
            }
        }
        throw new Error("unknown datatype '0x" + dType.charCodeAt(0).toString(16).padStart(2, '0') + "'");
    }


    _parseHeader() {
        const tmp = this.u8a[this.idx++];
        let sLen = tmp >> 6;       // parseout sizeLen
        const dType = tmp & 0x3F;  // parseout dataType
        if (sLen == 3) {
            sLen = 4;
        }
    
        let bytes = 0;
        while(sLen-- > 0) {
            bytes = (bytes << 8) | this.u8a[this.idx++];
        }

        if (bytes > this.u8a.length - this.idx) {
            throw new Error ("Invalid data, buffer overrun");
        }
        return [dType, bytes];
    }
};
export { DFEncoder, DFDecoder };

// (function() {
//     function _hexDump(u8a) {
//         console.log(Array.from(u8a).map(byte => byte.toString(16).padStart(2, '0')).join(' '));
//     }
//     let enc = new DFEncoder();
//     let data = {list:[undefined, null, true, false],int:42,str:"abc",u8a:new Uint8Array(5)}
//     console.log(data);
//     data = enc.encode(data);
//     _hexDump(data);
//     let list2 = new DFDecoder(data).decode();
//     console.log(list2);
//     debugger; 
// })();
