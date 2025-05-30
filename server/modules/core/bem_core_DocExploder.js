
import * as fs from "fs/promises"; //'node:fs/promises'; <-- this works too

// takes Uint8Array dict.doc and explodes it to a dict{},  if it has @n.n; inside then upgrade it too if needed
// if version must be passed in if stream doesnt have '@n.n;' (coming straight from a dbrec)

BF.docExploder = async function(dict) {
// on the way in:
    // const dict = {
    //     version: "1.0", // REQUIRED if doc does NOT start with '@n.n;' otherwise overridden by what's taken from file
    //     doc:     u8a,   // doc to validate/upgrade, ALWAYS as a Uint8Array
    // };
// on the way out:
    // const dict = {  // does NOT HAVE version cuz its not a stream any more, its now dictData which must always be current
    //     name:    ????,  // undeclared UNLESS stream startswith '@n.n;' then is imported ONLY IF '@n.n;' is 2.0 OR NEWER
    //     uuid:    ????,  // undeclared UNLESS stream startswith '@n.n;' then is imported from stream ALL VERSIONS
    //     dchList: u8a,   // Uint8Array list[] of dchElements
    //     error:   ????,  // undeclared UNLESS err happened, contains msg of what went wrong
    //     upgraded:????   // undeclared UNLESS doc was upgraded to nextver during validation
    // };

// we HAVE to pull this here-and-now (IF stream has it!) in order to know what 'explode_n.n_doc.js' to load
// and if it doesn't have it, then the passed-in dict.version must be present.
    if (dict.doc[0] == 64) {    // 64 = '@'     // test for header,  if found extract what we know how to.
        let ver = "";
        for (let idx = 1; idx < 32; idx++) {           // try to extract the @n.n; version from the doc
            const chr = String.fromCharCode(dict.doc[idx]);
            if (chr == ';') {                          // if we havent hit a ';' by 32 bytes, we don't have a ver!
                ++idx;
                break;
            }
            if (!/^[0-9.]$/.test(chr)) {     // if not digits or '.', this is not a ver!
                ver = "";                    // clear out anything gathered thus far
                break;
            }
            ver += chr;
        }
        dict.version = ver; // change to what the doc says, always, so we can upgrade it below
    }

    if (!dict.version) {    // no @n.n; in file, no version passed in from dbRec
        dict.error = "Unable to parse, stream has no header and no version was supplied";
        return dict;
    }

    const fname = `explode_${dict.version}_doc.js`;
    if (BG.converters.includes(fname)) {
        const mod = await BF.loadModule(BG.serverPath + "/modules/core/converters/" + fname);
        dict = await mod.explode(dict);
    } else {
        delete dict.doc;        // save memory, useless when error
        dict.error = "Unable to parse, couldn't find an exploder for v" + dict.version;
    }
    return dict;
}
