
import { DFEncoder, DFDecoder } from "/public/classes/DFCoder.mjs";


/*
    u8a = async read(dch)     // convert dch and all its children into a u8a 'stream' and return it
          async write(u8a)    // paste/write/attach the uia 'stream' into the system at the current cursor location
    u8a = async export()      // read entire document from memory and return ready-to write-to-file u8a
          async import()      // import a doc from a file and insert it as a new document

format is simple,  
1) use the DocExtractor to get our [[1,{"N":"BOX","S":{"L":0,"R":0,"T":0,"B":0},"C":0}]]
2) pare it down to just {"N":"BOX","S":{"L":0,"R":0,"T":0,"B":0},"C":0} and add a "D":<u8a> from dch.exportData()
3) rinse-repeat for self and all children

*/

// const xgetDcwDictx = function() {  // return a DFDict of [recId, dcw] ordered by dcwFlatTree of doc
//     if (!FG.curDoc) {
//         return [];
//     }
//     let dict = new DFDict();

//     let dcw = FG.curDoc.rootDcw;
//     dict.append(dcw.dchRecId, dcw);     // append dcw right away
//     function walk(dcw) {
//         if (dcw.children && dcw.children.length > 0) {
//             for (let child of dcw.children) {
//                 dict.append(child.dchRecId, child);
//                 list.push(child);
//                 walk(child);
//             }
//         }
//     }
//     walk(dcw);
//     return dict;
// }


export class DocStreamer {
    async read(dcwRoot, reserve=0) {                   // convert dcw and all its children into a u8a 'stream' and return it
        const extracter = new FG.DocExtracter();
        const encoder = new DFEncoder();                    // returns the dcwFlatTree of a dcw(and its children)
        const dcwList = FF.getDcwList();                    // get dcw+dch's in dcwFlatTree order
        let idx, u8aList = [];
        for (idx = 0; idx < dcwList.length; idx++) {    // find the beginning of the list to read/copy/export
            if (dcwList[idx] === dcwRoot) {
                break;
            }
        }
        const dcwTable = await extracter.extract(dcwList[idx]);   // get the DFDict(flatTree) of the dcw to read/copy/export

        let items = 1;      // 1 for 'self'
        while (items) {
            const [ _,dict] = dcwTable[idx];     // [ recId, dict ]
            const dcw = dcwList[idx];
            const dch = dcw.dch;
            items += dict.C;                // increase itemcount by # children
            dict.D = dch.exportData();
            u8aList.push(encoder.encode(dict, reserve));  // firstTimeOnly add reserveSpace...
            reserve = 0;                                // ... then zero reserveSpace
            --items;
            ++idx;
        }
        u8aList = encoder._concat(u8aList); // cheat and use the concatenator inside encoder to crunch the u8aList
        return u8aList;
    }


    async write(u8a) {                  // paste/write/attach the uia 'stream' into the system at the current cursor location
    }

    
    async export() {                    // read entire document from memory and return ready-to write-to-file u8a
// @2.0;
// 28ba4b5d-f089-4789-8ef3-cf1e8098bf36
// Original Doc Name
        const info = FF.getDocInfo(FG.curDoc.uuid);
        let header = "@2.0;\n";
        header += info.uuid + "\n";
        header += info.name + "\n";
        header = new TextEncoder().encode(header);  // convert it into a u8a

        const stream = await this.read(FG.curDoc.rootDcw, header.byteLength);

        for (let idx = 0; idx < header.byteLength; idx++) {    // ...embed '@n.n;...' as raw bytes into reserved() space
            stream[idx] = header[idx];
        }
        return stream;
    }


    async import() {                    // import a doc from a file and insert it as a new document
    }
};
