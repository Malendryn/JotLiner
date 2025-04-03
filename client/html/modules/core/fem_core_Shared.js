
// Functions, classes etc that are shared by both backend and frontend go here

SH.StringReader = class StringReader {
    readCtl() {                             // read and discard until controlbyte or eostring
        while (this.idx < this.str.length) {
            const chr = this.str[this.idx];
            this.idx += 1;
            if (chr == '+' || chr == '-' || chr == '=') {
               return chr;
            }
        }
        return "";
    }


    read(len, trim = false) {
        if (this.idx >= this.str.length) {     // test for end of data
            return "";
        }
        const end = Math.min(this.idx + len, this.str.length);
        const data = this.str.substring(this.idx, end);
        if (trim) {
            this.str = this.str.substring(end);
            this.idx = 0;
        } else {
            this.idx = end;
        }
        return data;
    }


    readUntil(chr) {
        let tmp = "";
        while (this.idx < this.str.length) {
            if (this.str[this.idx] == chr) {
                ++this.idx;      // skipover the chr
                return tmp;
            }
            tmp += this.str[this.idx];
            ++this.idx;
        }
        return tmp;             // off endof str, don't increment idx
    }


    constructor(str) {
        this.str = str;
        this.idx = 0;
    }
};
