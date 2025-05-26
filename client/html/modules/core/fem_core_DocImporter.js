// ALL this does is load a SINGLE DocComponent, and populates it based on its type
// it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)

// reads data from a string(stream) and parses it out into a component in a few different ways.
// typical use 
// X = new DocImpExp();     // create the importer-exporter
// X.attach(str, div);      // attach the component (and all its children) to <div> (and div's handler)
// X.detach(div);           // detach component(and all its children) from <div> and return exportable str

import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

let __docVer;
class StringReader {
    str;
    idx;

    readToSem() {   // read until a ';' or EOF and return it,  (if ';' move idx past it)
        let tmp = "";
        let chr = '';
        while (this.idx < this.str.length && (chr = this.str[this.idx]) != ';') {   // while not eoStream and not a ';'
            tmp += chr;
            ++this.idx;
        }
        if (chr == ';') {               // if lastChr was NOT a ';' we are at EOStream (or data is corrupted)
            ++this.idx;                 // skipover the ';'
        }
        return tmp.trim();              // get rid of surrounding whitespace and return it
    }

    readEl() {                      // read "WRD=LEN;DATA", decode base64 if LEN=negative, return [dchName, data]
        let tmp = this.readToSem();     // read ("WRD=LEN" and lose the ';')
        if (tmp == "") {
            return null;
        }        
        tmp = tmp.split('=');           // split ["WRD", "LEN"]
        if (tmp.length != 2) {          // EOFile (or some kinda other illegal junk!)
            return null;
        }
        const wrd = tmp[0].trim();      // trim off whitespace around WRD
        let len = parseInt(tmp[1]);     // integerize 'len'

        if (this.idx > this.str.length) {    // test for end of data
            console.warn(FF.__FILE__(), "readEl() Data stream too short");
            return null;
        }

        let val;
        if (Number(__docVer) < 1.1) {                                       // V1.0 way: 
            let isBase64 = (len < 0);       // if len < 0 its b64
            len = Math.abs(len);            // finally, positivize len
            const end = Math.min(this.idx + len, this.str.length);
            val = this.str.substring(this.idx, end);
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
            const end = Math.min(this.idx + len, this.str.length);
            let dtype = this.str[this.idx];               // peel off first letter as datatype
            val = this.str.substring(this.idx + 1, end);    // extract the rest
            this.idx = end;
            if (/^[a-z]$/.test(dtype)) {  // if is lowercase a-z
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
                if (dtype != 'u') {                         // if not expecting a true Uint8Array...
                    val = new TextDecoder().decode(val);    // textify it
                }
                dtype = dtype.toUpperCase();    // now everything's decoded, uppercase dtype for testing
            }
            switch(dtype) {
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

    constructor(str) {
        this.str = str;
        this.idx = 0;
    }
};


export class DocImporter {   // create and return a DCH from a stream
    docUuid;        // tmp holder for uuid of imported doc
    sr;
    rootDch;

    async attach(str, parent)  {        // attach as child of parent.__sysDiv  (or to "divDocView" if parent=null)
        this.sr = new StringReader(str);
        __docVer = FG.VERSION;       // STARTWITH matching the sysVersion (so copypaste always compares to proper version)
        this.rootDch = null;
        let tmp;

        // ALWAYS read docVer and docUuid even when copypasting (tho when copypasting we discard docUuid)
        //    cuz we might be copypasting from an older ver to a newer ver

        tmp = this.sr.readToSem();  // read "@n.n;""
        if (tmp.charAt(0) != '@') {
            throw new Error("Cannot load document, improperly formatted");
        }
        __docVer = tmp.substr(1);    // chopoff "@", save ver as "n.n"
        if (__docVer > FG.VERSION) {
            throw new Error("Document is newer than this software supports");
        }
        // if (parent == null)  {          // if toplevel document (and not just a copypaste subset)
        //     await FF.clearDoc();        // when no parent, this is toplevel doc, so clear and remove existing
        // }

        this.docUuid = this.sr.readToSem();  // read "...uuid..."

        await this._importNext(parent); // if a parent was passed, add this as child
        return this.rootDch;
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
        dd.children = parseInt(this.sr.readToSem()); // read #children
        let tmp = this.sr.readEl();                  // read "CNAME=#;...."
        if (!tmp) {
            return null;
        }
        [dd.cName,tmp] = tmp;           // split the component name from all its data
        let sr = new StringReader(tmp);
        while(true) {                   // break 'tmp' down and populate data{} with key/vals
            tmp = sr.readEl();
            if (!tmp) {
                break;
            }
            dd.data[tmp[0]] = tmp[1];      // populate data with key/vals
        }
        if ("<>" in dd.data) {             // if one of the keys was "<>" then extract that as style data
            sr = new StringReader(dd.data["<>"]);
            delete dd.data["<>"];
            while(true) {
                tmp = sr.readEl();
                if (!tmp) {
                    break;
                }
                dd.style[tmp[0]] = tmp[1];     // populate style{} with key/vals
            }
        }
        return dd;    // return what was parsed!
    }
 };
