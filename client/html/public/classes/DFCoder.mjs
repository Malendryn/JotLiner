/*!
 * DFCoder.js
 * Copyright (c) Malendryn Tiger (Ron Stanions @ DragonsFire Creations)
 *
 * This software is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the License at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/
// this filename ends in .mjs cuz the node backend uses it too

class DFEncoder {
    list = [];

    encode(val, reserveLen = 0) {
        let tmp = undefined;
        if (reserveLen) {                   // allows to inject some freespace at the beginning
            this.list.push(new Uint8Array(reserveLen));
        }
// 0-15 are types with no datalen        
        if (val === undefined) {
            this.list.push(this._makeHeader(1, 0));                      // 1 = undefined
        } else if (val === null) {
            this.list.push(this._makeHeader(2, 0));                      // 2 = null
        } else if (typeof val == "boolean") {
            this.list.push(this._makeHeader((val) ? 3 : 4, 0));          // 3 = true, 4 = false

// 16 - 31 are single element types like number, string, Uint8Array            
        } else if (typeof val == "number") {
            tmp = new TextEncoder().encode(val.toString());
            this.list.push(this._makeHeader(23, tmp.length));             // 16-23 are numeric types, right now only 23, jsType Number()
        } else if (typeof val  == "string") {
            tmp = new TextEncoder().encode(val);
            this.list.push(this._makeHeader(24, tmp.length));             // 24 = string
        } else if (val instanceof Uint8Array) {
            this.list.push(this._makeHeader(25, val.length));         // 25 = Uint8Array
            this.list.push(val);

// 32-47 are arrayTypes like [] and {}
        } else if (Array.isArray(val)) {    // we push serial w/o grouping first so decode<test=true> even checks INSIDE lits/obj for validity
            // const tmp2 = new TextEncoder().encode(val.length.toString()); // get numEls
            this.list.push(this._makeHeader(32, val.length));  // 32 = Array[]    // here .length = numEls not bytelength
            // this.list.push(encode(val.length));             // now push numEls
            for (const item of val) {
                this.encode(item);                             // now push els
            }
        } else {                            // only thing really left here is an {} object
            const keys = Object.keys(val);                     // get keys
            this.list.push(this._makeHeader(33, keys.length)); // 33 = Object{}  // here .length = numPairs not bytelength
            for (const key of keys) {                          // push key-then-val groups
                this.encode(key);                              // encode key-then-val as a pair
                this.encode(val[key]);
            }
        }
        if (tmp) {
            this.list.push(tmp);
        }
        return this._concat(this.list);
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
        while(hBytes--) {           // write out bytes in little-endian order
            u8a[idx++] = size & 0xFF;
            size = size >> 8;
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

    decode() {  // decode ONE AND ONLY ONE value,  repeated calls to this will decode more if more is available
// if (this.idx == 257) {
// debugger;
// }
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
        const hex = "'0x" + dType.toString(16).padStart(2, '0') + "'";
        const offs = this.idx + "(0x" + this.idx.toString(16).padStart(4, '0') + ")";
        throw new Error("unknown datatype " + hex + " at offset " + offs);
    }

    _parseHeader() {
        const tmp = this.u8a[this.idx++];
        let sLen = tmp >> 6;       // parseout sizeLen
        const dType = tmp & 0x3F;  // parseout dataType
        if (sLen == 3) {
            sLen = 4;
        }

        // if (sLen > 1) {
        //     debugger;
        // }
        let bytes = 0, shift = 0;
        while(sLen-- > 0) {             // read in bytes in little-endian order
            bytes |= this.u8a[this.idx++] << shift;
            shift += 8;
        }
        bytes >>>= 0;   // un-sign any 4-or-fewer-byte value  (in case bytes somehow became >2billion)

        if (bytes > this.u8a.byteLength - this.idx) {
            throw new Error ("Invalid data, buffer overrun");
        }
        return [dType, bytes];
    }
}
export { DFEncoder, DFDecoder };
