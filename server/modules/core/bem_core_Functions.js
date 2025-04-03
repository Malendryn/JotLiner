
// globally available functions to keep the main files cleaner  (BF stands for 'Backend Functions')

// FF.functions
// return---?snc? funcname-----------------Description-------------------------------------------------------
// ==== FROM index.js =================================================================================================
// module   async loadmodule(modulePath)   load and return module, if has an init(), call that before returning
// ==== FROM csm_core_Functions.js ====================================================================================
// --------       shutdown()               called before server exits entirely.  closes database and does other cleanup
// -------- async makeUUID()               make and return a UUID
// -------- async makeHash(txt)            convert txt into a one-way SHA-1 hash value and return it
// ==== FROM ????????????????????? ====================================================================================
// --------       logout()                 detach and forget current user and go back to login screen
// -------- async loadView(.jsName)        load a .js child of FG.ViewBASE from within the "views" subdir
// -------- async loadText(path)           load a text(or html) file (relative to rootPath) and return it
// -------- async updateTitleBar()         update the topmost titleBar showing curbook
// -------- async getBookById(bookId)      fetch book rec (from FG.bookList) for this bookId


////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
BF.shutdown = () => {                       // program closing, do final terminations/cleanups before quitting
    debugger; if (BG.db) {
        // RSTODO if BG.db=open
        debugger; BG.db.close();
    }
}
process.on("exit",    () => { BF.shutdown(); });
process.on("SIGINT",  () => { process.exit(); });
process.on("SIGTERM", () => { process.exit(); });


export async function init() {
    const crypto = await import("crypto");

    BF.makeUUID = async () => {
        return crypto.randomUUID();
    }
    
    
    BF.makeHash = async (txt) => {
        return Array.from(
            new Uint8Array(
                await crypto.subtle.digest('SHA-1', new TextEncoder().encode(txt))
            ),
            (byte) => byte.toString(16).padStart(2, '0')
        ).join('');
    }
    
    
    // BF.hasWhitespace = (ss) => {
    //     return /\s/.test(ss);
    // }
    
    
    // BF.getInvalidChars = (ss, valids) => {
    //     let invalids = "";
    //     for (let ch of ss) {
    //         if (valids.includes(ch)) {
    //             continue;
    //         }
    //         invalids += ch;
    //     }
    //     return invalids;
    // }
}
