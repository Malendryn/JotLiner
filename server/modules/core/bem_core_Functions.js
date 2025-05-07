
// globally available functions to keep the main files cleaner  (BF stands for 'Backend Functions')

// BF.functions
// return---?snc? funcname-----------------Description-------------------------------------------------------
// ==== FROM index.js =================================================================================================
// module   async loadmodule(modulePath)   load and return module, if has an init(), call that before returning

// ==== FROM bem_core_Functions.js ====================================================================================
// --------       shutdown()               called before server exits entirely.  closes database and does other cleanup
// -------- async makeUUID()               make and return a UUID
// -------- async makeHash(txt)            convert txt into a one-way SHA-1 hash value and return it

// ==== FROM bem_core_WSockHandler.js ====================================================================================
// --------       onChanged(table,uuid)    whenever any action changes a table, this function must get called

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
}
