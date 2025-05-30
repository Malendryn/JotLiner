
import * as fs from "fs/promises"; //'node:fs/promises'; <-- this works too

BF.docExploder = async function(dict) {
// on the way in:
    // const dict = {
    //     version: "1.0", // REQUIRED if doc does NOT start with '@n.n;' otherwise overridden by what's taken from file
    //     doc:     u8a,   // doc to validate/upgrade, ALWAYS as a Uint8Array
    // };
// on the way out:
    // const dict = {
    //     version: ????,  // only if header=true: else pulled from doc
    //     name:    ????,  // only if header=true: name that was inside doc (if 2.0+) else null (if 1.0 or 1.1)
    //     uuid:    ????,  // only if header=true: uuid pulled from doc
    //     doc:     u8a,   // Uint8Array doc,  (upgrade to newest version if needed)
    //     error:   ????,  // only if err happened, contains msg of what went wrong
    //     updated: t/f    // true if update succeeded
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
        dict.version = ver;
    }

    if (!dict.version) {
        dict.error = "Unable to parse, stream has no header and no version was supplied";
        return dict;
    }

    try {
        const fname = `explode_${dict.version}_doc.js`;
        if (BG.converters.includes(fname)) {
            const mod = await BF.loadModule(BG.serverPath + "/modules/core/converters/" + fname);
            dict = await mod.explode(dict);
        }
    } catch (err) { // module to upgrade wasn't found so this must be the latest version
        debugger; 
    }
    return dict;
}
