
// explode contents of docstream into a dict
export async function explode(dict) {  // see bem_core_DocExploder.js for definition of dict
    const doc = new TextDecoder().decode(dict.doc);   // doc always is Uint8array,  so for v1.0 we must convert back to textual
    delete dict.doc;                            // reduce mem usage

    let dimp = new DocImporter();
    const dic2 = await dimp.import(doc);
    delete dic2.name;                 // v1.0 never has a name
    return dic2;
}


class DocImporter {
    dict;
    sr;

    async import(str)  {
        this.dict = {};
        try {
            this.sr = new StringReader(str);

            this.sr.readToSem();                   // skipover "@1.0;" as already parsed and proven
            this.dict.uuid = this.sr.readToSem();  // read uuid

            this.dict.dchList = [];
            await this._importNext();       // build dchList recursively
        } catch (err) {
            this.dict.error = err.message;
        }
        return this.dict;
    }


    async _importNext() {
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
        tmp = tmp.split('=');           // split ["WRD", "LEN"]
        if (tmp.length != 2) {          // EOFile (or some kinda other illegal junk!)
            return null;
        }
        const dchName = tmp[0].trim();  // trim offwhitespace around WRD
        let len = parseInt(tmp[1]);     // integerize "LEN" and test if negative then data=base64 encoded
        let isBase64 = (len < 0);
        len = Math.abs(len);            // finally, positivize len

        if (this.idx > this.str.length) {    // test for end of data  (fires when len == 0)        
            throw new Error("Data stream too short");
        }

        const end = Math.min(this.idx + len, this.str.length);
        let data = this.str.substring(this.idx, end);
        this.idx = end;                      // works but leaves memory in use while StringReader exists...

        if (isBase64) {
            data = atob(data);
            const bytes = new Uint8Array(data.length);
            for (let idx = 0; idx < data.length; idx++) {
                bytes[idx] = data.charCodeAt(idx);
            }
            data = new TextDecoder().decode(bytes);
        }
        return [ dchName, data ];
    }

    constructor(str) {
        this.str = str;
        this.idx = 0;
    }
};
