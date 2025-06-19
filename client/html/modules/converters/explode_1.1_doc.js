
// explode contents of docstream into a dict (see bem_core_DocExporter.js for dict construction)

// 1.1 differs from 1.0 in that it preserves field datatypes but it still doesnt have 'name' in the header

export async function explode(dict) {  // see bem_core_DocExploder.js for definition of dict
    const doc = new TextDecoder().decode(dict.doc);   // doc always is Uint8array,  so for v1.1 we must convert back to textual
    delete dict.doc;                            // reduce mem usage

    let dimp = new DocImporter();
    const dic2 = await dimp.import(doc);
    delete dic2.name;                 // v1.1 never has a name
    return dic2;
}


class DocImporter {
    dict;
    sr;

    async import(str)  {
        this.dict = {}
        try {
            this.sr = new StringReader(str);

            this.sr.readToSem();                   // skipover "@1.1;" as already parsed and proven
            this.dict.uuid = this.sr.readToSem();  // read uuid

            this.dict.dchList = [];
            await this._importNext();       // build dchList recursively
        } catch (err) {
            this.dict.error = err.message;
        }
        return this.dict;
    }

    
    async _importNext(parent) {
        while (true) {
            const cpo = this._readComponent();    // read all vars of next component and break them down into <style> and <data>
            if (cpo == null) {
                break;
            }
            this.dict.dchList.push(cpo);  // push {children,name,style,data}
        }
    }


    _readComponent() {  // read next component, return { name:"", children:0, style:{}, data:{}}
        let dd = {
            children:   0,  // number of following children that belong to this component
            name:       "", // the component name
            style:      {}, // if '<>=' was in stream, fill this with the style data that followed
            data:       {}, // everything else
        };
        dd.children = parseInt(this.sr.readToSem()); // read #children
        let tmp = this.sr.readEl();                  // read "NAME=#;...."
        if (!tmp) {
            return null;
        }
        [dd.name,tmp] = tmp;           // split the component name from all its data
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
                val = undefined;
                break; }
            case '~': {
                val = null;
                break; }
            case 'B': {
                val = ('t') ? true : false;
                break; }
            case 'N': {
                val = Number(val);
                break; }
            case 'S': {     // val is alrady a string, nothing done here
                break; }
            case 'A': {
                val = JSON.parse(val);
                break; }
            case 'O': {
                val = JSON.parse(val);
                break; }
        }
        return [ wrd, val ];
    }

    constructor(str) {
        this.str = str;
        this.idx = 0;
    }
};


