// ALL this does is load a SINGLE DocComponent, and populates it based on its type
// it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)

// reads data from a string(stream) and parses it out into a component in a few different ways.
// typical use 
// X = new DocImpExp();     // create the importer-exporter
// X.attach(str, div);      // attach the component (and all its children) to <div> (and div's handler)
// X.detach(div);           // detach component(and all its children) from <div> and return exportable str

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

    readEl() {        // read "WRD=LEN;DATA", decode base64 if LEN=negative, return [varName, data]
        let tmp = this.readToSem();
        tmp = tmp.split('=');       // split varName from varLen
        const varName = tmp[0].trim();
        let len = parseInt(tmp[1]);
        let isBase64 = (len < 0);     // rstodo MOVE THIS to the 'attachComponent' below
        len = Math.abs(len);

        if (this.idx >= this.str.length) {    // test for end of data
            return "";
        }
        const end = Math.min(this.idx + len, this.str.length);
        let data = this.str.substring(this.idx, end);
        // this.idx = end;                      // this works but potentially wastes a lot of memory by leaving many copies around
        this.str = this.str.substring(end);     // so instead we'll shrink the string each time we pull an el
        this.idx = 0;

        if (isBase64) {              // rstodo MOVE THIS to the 'attachComponent' below
            data = atob(data);
        }
        return [ varName, data ];
    }

    constructor(str) {
        this.str = str;
        this.idx = 0;
    }
};


export class DocImporter {   // create and return a DCH from a stream
    docVer;
    sr;
//    let el = document.getElementById("docWrapper")

    async attach(str, parent)  {       // attach as child of parent._div  (or to "docWrapper" if parent=null)
        this.sr = new StringReader(str);
        this.docVer = FG.VERSION;     // STARTWITH matching the sysVersion
        if (str.charAt(0) == '@') {
            this.docVer = this.sr.readToSem().substr(1);    // read Ver, then substr(1) to skipover the '@'
            if (this.docVer > FG.VERSION) {
                debugger;                           // RSTODO throw error, can't read document, need newer software
            }
        }
        if (parent == null) {
            await FF.clearDoc();        // if no parent, this is toplevel doc, so clear and remove existing
        }
        await this._importNext(parent); // if a parent was passed, add this as child
    }


    async _importNext(parent) {
        const dchData = this._readComponent();    // read all vars of next component and break them down into <style> and <data>
        if (!dchData) {                           // end of stream
            return null;
        }
        const dch = await FG.DCH_BASE.create(dchData.cName, parent, dchData.style);  // create handler, assign parent, create <div>, set style
        if (parent == null) {       // if no parent was passed, this is toplevel doc!
            FG.docRoot = dch;
        } else {
            parent.children.push(dch);       // else add it as a child of the parent
        }
        await dch.importData(dchData.data);                         // implant the data into the <div>
        for (let idx = 0; idx < dchData.children; idx++) {          // load children of component (if any)
            await this._importNext(dch);
        }
    }


    _readComponent() {  // read next component, return { cName:"", children:0, style:{}, data:{}}
        let dd = {
            children:   0,  // number of following children that belong to this component
            cName:      "", // the component name
            style:      {}, // if '<>=' was in stream, fill this with the style data that followed
            data:       {}, // everything else
        };
        dd.children = parseInt(this.sr.readToSem());      // read #children
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
