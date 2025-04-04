

export class StreamReader {
    str;    // the string passed in during creation
    idx;    // index into string at present reading point


    length() {  // returns whatever is left in the stream to read
        return this.str.length - this.idx;
    }


    async readChunk(len, shrink = false) {
        if (this.idx >= this.str.length) {     // test for end of data
            return "";
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
        while (this.idx < this.str.length) {
            if (this.str[this.idx] == ';') {    // find ending ';' chr
                ++this.idx;                     // skipover the chr
                tmp = tmp.trim();               // get rid of surrounding whitespace
                if (tmp.startsWith("//")) {     // this is a comment, ignore it
                    tmp = "";
                    continue;
                }
                return tmp;
            }
            tmp += this.str[this.idx];
            ++this.idx;
        }
        return tmp;             // off endof this.str, don't increment idx
    }


    constructor(str) {
        this.str = str;
        this.idx = 0;
    }
};
