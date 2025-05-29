// ALL this does is load a SINGLE DocComponent, and populates it based on its type
// it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)

// reads data from a string(stream) and parses it out into a component in a few different ways.
// typical use 
// X = new DocImpExp();     // create the importer-exporter
// X.attach(str, div);      // attach the component (and all its children) to <div> (and div's handler)
// X.detach(div);           // detach component(and all its children) from <div> and return exportable str

import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

class Uint8Reader {
    u8a;
    idx;
    brk = ';'.charCodeAt(0);
    version = FG.VERSION;       // STARTWITH matching the sysVersion (so copypaste always compares to proper version)

    setVersion(version) {
        this.version = version;
        if (version > 1.1) {
            this.brk = String.fromCharCode(0x1E);
        }
    }

    readToBrk() {   // read until an unescaped ths.brk char or EOF and return it,  (and stripout brkchar too, and move idx past it)
        let ss = "";
        let chr = '';
        const start = this.idx;
        while (this.idx < this.u8a.length && (chr = this.u8a[this.idx]) != this.brk) {   // while not eoStream and not this.brk
            ss += chr;
            ++this.idx;
        }
        const view = this.u8a.subarray(start, this.idx); // obtain a 'view' into the original array
        if (chr == this.brk) {          // if lastChr was NOT a BRK we are at EOStream (or data is corrupted)
            ++this.idx;                 // skipover the BRK
        }

        if (this.version < 1.2) {       // if pre 1.2; get rid of surrounding whitespace and return it
            ss = ss.trim();
        }
        return view;
    }

    readEl() {                          // read "WRD=LEN;DATA", decode base64 if LEN=negative, return [dchName, data]
        let tmp = this.readToBrk();     // read ("WRD=LEN" and lose the BRK)
        if (tmp == "") {
            return null;
        }        
        tmp = tmp.split('=');           // split ["WRD", "LEN"]
        if (tmp.length != 2) {          // EOFile (or some kinda other illegal junk!)
            return null;
        }
        const wrd = tmp[0].trim();      // trim off whitespace around WRD
        let len = parseInt(tmp[1]);     // integerize 'len'

        if (this.idx > this.u8a.length) {    // test for end of data
            console.warn(FF.__FILE__(), "readEl() Data stream too short");
            return null;
        }

        let val;
        if (this.version < 1.1) {                                               // V1.0 way: 
            let isBase64 = (len < 0);       // if len < 0 its b64
            len = Math.abs(len);            // finally, positivize len
            const end = Math.min(this.idx + len, this.u8a.length);
            val = this.u8a.substring(this.idx, end);
            this.idx = end;
    
            if (isBase64) {
                val = atob(val);
                const bytes = new Uint8Array(val.length);
                for (let idx = 0; idx < val.length; idx++) {
                    bytes[idx] = val.charCodeAt(idx);
                }
                val = new TextDecoder().decode(bytes);
            }
        } else {                                                            // V1.1 way:  (len is now always positive)
            const end = Math.min(this.idx + len, this.u8a.length);
            let dType = this.u8a[this.idx];               // peel off first letter as datatype
            val = this.u8a.substring(this.idx + 1, end);    // extract the rest
            this.idx = end;
            if (/^[a-z]$/.test(dType)) {  // if is lowercase a-z
                function decode(base64) {
                    const binaryString = atob(base64);
                    const len = binaryString.length;
                    const bytes = new Uint8Array(len);
                    for (let i = 0; i < len; i++) {
                      bytes[i] = binaryString.charCodeAt(i);
                    }
                    return bytes;
                }
                val = decode(val);
                if (dType != 'u') {                         // if not expecting a true Uint8Array...
                    val = new TextDecoder().decode(val);    // textify it
                }
                dType = dType.toUpperCase();    // now everything's decoded, uppercase dType for testing
            }
            switch(dType) {
                case '?': {
                    debugger; val = undefined;
                    break; }
                case '~': {
                    debugger; val = null;
                    break; }
                case 'B': {
                    debugger; val = ('t') ? true : false;
                    break; }
                case 'N': {
                    val = Number(val);
                    break; }
                case 'S': {     // val is alrady a string, nothing done here
                    break; }
                case 'A': {
                    debugger; val = JSON.parse(val);
                    break; }
                case 'O': {
                    debugger; val = JSON.parse(val);
                    break; }
            }
        }
        return [ wrd, val ];
    }

    constructor(uint8array) {
        this.u8a = uint8array;
        this.idx = 0;
    }
};


export class DocImporter {   // create and return a DCH from a stream
    ur;
    rootDch;
    dict = {
        version: FG.VERSION,   // 1.2, etc  
        uuid: "",              // "12345678-1234-1234-1234-123456789abc" if a full doc, else empty string if just a component part
//        name: "",            // ONLY PRESENT IF V1.2 or later full name as shown in indexPane
//        error: ""            // ONLY PRESENT IF ERROR OCCURRED!
    }
    mode;       // 0 = attach, 1 = verify
    _verifyVersion() {
        let ss = this.ur.readToBrk()        // firsttimme reading, brk is ';', if v1.2 or later it changes to chr(0x1E()
        if (ss.charAt(0) != '@') {
            this.dict.error = "Cannot load document, improperly formatted";
        } else {
            this.dict.version = Number(ss.substring(1));        // convert '@n.n' to n.n (lose the @ first)
            if (this.dict.version > Number(FG.VERSION)) {
                this.dict.error = "Document is newer than this software supports";
            } else {
                this.ur.setVersion(this.dict.version);
            }
        }
        if (this.dict.error) {
            if (this.mode == 0) {
                throw new error(this.dict.error);
            }
            return false;
        }
        return true;
    }

    _verifyUuid() {
        this.dict.uuid = this.ur.readToBrk();  // read "...uuid..."
        if (this.dict.uuid.length != 0 && this.dict.uuid.length != 36) {
            this.dict.error = "expected document uuid, got invalid string";
        }
        if (this.dict.error) {
            if (this.mode == 0) {
                throw new error(this.dict.error);
            }
            return false;
        }
        return true;
    }

    _verifyDocName() {
        if (this.dict.version > 1.1) { 
            this.dict.name = this.ur.readToBrk();    // read "document name"
        }
        return true;
    }

    async attach(docStr, parent)  {        // attach as child of parent.__sysDiv  (or to "divDocView" if parent=null)
        debugger; this.mode = 0;
        this.dict = {};
        this.ur = new Uint8Reader(docStr);
        this.rootDch = null;
        let str;

        if (!this._verifyVersion()) {     // read "@n.n;", setup reader config for n.n given
            throw new Error(this.dict.error);
        }
        //?? if (parent == null)  {          // if toplevel document (and not just a copypaste subset)
        //??     await FF.clearDoc();        // when no parent, this is toplevel doc, so clear and remove existing
        //?? }
        if (!this._verifyUuid()) {         // read til brk, test for "" or "12345678-1234-1234-1234-123456789abc"
            throw new Error(this.dict.error);
        }
        if (!this._verifyDocName()) {
            throw new Error(this.dict.error);
        }

        await this._importNext(parent);   // if a parent was passed, add this as child
        return this.rootDch;
    }


    async validate(uint8Doc) {        // return dict, check for dict.error
        this.mode = 1;
        this.dict = {};
        this.ur = new Uint8Reader(uint8Doc);

        if (!this._verifyVersion()) {     // read "@n.n;", setup reader config for n.n given
            return this.dict;
        }
        if (!this._verifyUuid()) {        // read til brk, test for "" or "12345678-1234-1234-1234-123456789abc"
            return this.dict;
        }
        if (!this._verifyDocName()) {
            return this.dict;
        }

        tmp = this.ur.readToBrk();      // read uuid
        if (tmp.length != 36) {
            dict.error = "Invalid document uuid";
            return dict;
        }
// RSTODO for V1.2 we add/insert the dict.docName here
// RSTODO flesh this out hugely!
        debugger;
        return dict;
    }


    async _importNext(parent) {
        const dchData = this._readComponent();    // read all vars of next component and break them down into <style> and <data>
        if (!dchData) {                           // end of stream
            return null;
        }
        const dch = await DCH_BASE.create(dchData.cName, parent, dchData.style);  // create handler, assign parent, create <div>, set style
        if (!dch) {
            return;
        }
        if (this.rootDch == null) {         // record the topmost dch for returning
            this.rootDch = dch;
        }
        if (parent) {                       // if parent was passed, attach this to its children
            parent.__children.push(dch);
        }
        try {
            await dch.importData(dchData.data);                         // implant the data into the <div>
        } catch (err) {
            console.warn("Error importing data of dch '" + dchData.cName + "', " + err.message);
        }

        for (let idx = 0; idx < dchData.children; idx++) {          // load children of component (if any)
            await this._importNext(dch);
        }
        await dch.update();     //finally AFTER ALL children loaded, update plugin!
    }


    _readComponent() {  // read next component, return { cName:"", children:0, style:{}, data:{}}
        let dd = {
            children:   0,  // number of following children that belong to this component
            cName:      "", // the component name
            style:      {}, // if '<>=' was in stream, fill this with the style data that followed
            data:       {}, // everything else
        };
        dd.children = parseInt(this.ur.readToBrk()); // read #children
        let tmp = this.ur.readEl();                  // read "CNAME=#;...."
        if (!tmp) {
            return null;
        }
        [dd.cName,tmp] = tmp;           // split the component name from all its data
        let ur = new Uint8Reader(tmp);
        while(true) {                   // break 'tmp' down and populate data{} with key/vals
            tmp = ur.readEl();
            if (!tmp) {
                break;
            }
            dd.data[tmp[0]] = tmp[1];      // populate data with key/vals
        }
        if ("<>" in dd.data) {             // if one of the keys was "<>" then extract that as style data
            ur = new Uint8Reader(dd.data["<>"]);
            delete dd.data["<>"];
            while(true) {
                tmp = ur.readEl();
                if (!tmp) {
                    break;
                }
                dd.style[tmp[0]] = tmp[1];     // populate style{} with key/vals
            }
        }
        return dd;    // return what was parsed!
    }
 };
