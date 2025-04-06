

export class StreamReader {
    str;    // the string passed in during creation
    idx;    // index into string at present reading point


    length() {  // returns whatever is left in the stream to read
        return this.str.length - this.idx;
    }


    async readChunk(len, shrink = false) {
        if (this.idx >= this.str.length) {     // test for end of data
            return "";                         // whatever MAY have been captured, toss it as garbage and return ""
        }
        const end = Math.min(this.idx + len, this.str.length);
        const data = this.str.substring(this.idx, end);
        if (shrink) {
            this.str = this.str.substring(end);
            this.idx = 0;
        } else {
            this.idx = end;
        }
        return data;
    }


    async readNext() {
        let tmp = "";
        let chr = '';
        while (true) {
            while (this.idx < this.str.length && (chr = this.str[this.idx]) != ';') {   // while not eoStream and not a ';'
                tmp += chr;
                ++this.idx;
            }
            tmp = tmp.trim();               // get rid of surrounding whitespace
            if (chr == ';') {    // if lastChr wasa ';'
                ++this.idx;                     // skipover the chr
                if (tmp.startsWith("//")) {     // this is a comment, toss it and read again!
                    tmp = "";
                    continue;
                }
            }
            return tmp;
        }
    }


    constructor(str) {
        this.str = str;
        this.idx = 0;
    }
};
