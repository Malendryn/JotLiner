

export class StreamReader {
    str;    // the string passed in during creation
    idx;    // index into string at present reading point

//  **NOTE** none of these are async, not necessary
//  val = length()       -- returns number of bytes left in the stream 
//  val = readNext()     -- reads next ';'-terminated element, auto-skips over comments
//  val = readChunk()    -- reads an el to get len bytes, then reads raw chunk and returns it
//        shrink()       -- chop the already-read bytes off the internal str and reset idx to 0


    length() {  // returns whatever is left in the stream to read
        debugger; return this.str.length - this.idx;
    }


    shrink() {
        debugger; if (this.idx >= this.str.length) {     // test for end of data
            return;
        }
        this.str = this.str.substring(this.idx);
        this.idx = 0;
    }


    readChunk() {
        let len = parseInt(this.readNext());  // get len of chunk
        if (this.idx >= this.str.length) {    // test for end of data
            return "";
        }
        const end = Math.min(this.idx + len, this.str.length);
        const data = this.str.substring(this.idx, end);
        this.idx = end;
        return data;
    }


    readNext() {
        let tmp = "";
        let chr = '';
        while (true) {
            while (this.idx < this.str.length && (chr = this.str[this.idx]) != ';') {   // while not eoStream and not a ';'
                tmp += chr;
                ++this.idx;
            }
            tmp = tmp.trim();               // get rid of surrounding whitespace
            if (chr == ';') {               // if lastChr wasa ';'
                ++this.idx;                 // skipover the chr
            }
            if (tmp.startsWith("//")) {     // this is a comment, toss it and read again!
                tmp = "";
                continue;
            }
            return tmp;
        }
    }


    constructor(str) {
        this.str = str;
        this.idx = 0;
    }
};
