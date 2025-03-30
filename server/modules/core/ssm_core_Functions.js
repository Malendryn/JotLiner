
// general purpose functions and otherstuff just to keep the main files cleaner

// SF stands for 'Server Functions'


export async function _init() {
    globalThis.SF = {       // we connect to globalThis now, so we don't have to { SF } then globalThis.SF = SF and have SF-level confusion
    };
    
    
    SF.terminate = () => {                       // program closing, do final terminations/cleanups before quitting
        if (SG.db) {
            SG.db.close();
        }
    }
    
    const crypto = await import("crypto");
    // import * as crypto from "crypto"

    SF.makeUUID = async () => {
        return crypto.randomUUID();
    }
    
    
    SF.makeHash = async (txt) => {
        return Array.from(
            new Uint8Array(
                await crypto.subtle.digest('SHA-1', new TextEncoder().encode(txt))
            ),
            (byte) => byte.toString(16).padStart(2, '0')
        ).join('');
    }
    
    
    SF.hasWhitespace = (ss) => {
        return /\s/.test(ss);
    }
    
    
    SF.getInvalidChars = (ss, valids) => {
        let invalids = "";
        for (let ch of ss) {
            if (valids.includes(ch)) {
                continue;
            }
            invalids += ch;
        }
        return invalids;
    }
}
