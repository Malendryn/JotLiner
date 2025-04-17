// ALL this does is load a SINGLE DocComponent, and populates it based on its type
// it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)


export class DocLoader {   // create and return a DCH from a stream
    async loadDoc(sr, parent)  {
        if (parent == null) {          // if null then read first element as document version
            await FF.clearDoc();       // clear existing doc but don't create new one
            FG.docRoot = null;
            const docVer = await sr.readNext();
            if (docVer < FG.VERSION) {
                debugger; // RSTODO doc is older than current sysVersion, must upgrade!  (throw warning msg, no going back!)
            } else if (docVer > FG.VERSION) {
                debugger; // RSTODO throw error, can't read document, need newer software
            }
        }    
    
        const dchName = await sr.readNext();    // read next ctrl word  (that is, everything up to next ';')
        if (dchName == "") {                    // end of stream
            return null;
        }
        const dch = await FG.DCH_BASE.create(dchName, parent, sr);  // create handler, assign parent, create <div> if hasDiv=true
        await dch.loadDoc(sr);
//        sr.shrink();                            // not super-necessary but makes debugging easier
        return dch;
    }
 };
