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
        const dch = await FG.DCH_BASE.create(dchName, parent);  // create handler, assign parent, create <div> if hasDiv=true

        await this._load(dch, sr);             // digest the stream passed to it
        return dch;
    }


    async _load(dch, sr) {
        if (dch.hasDiv) {
            // dch.div = document.createElement("div");
            // let parentDiv;
            // if (dch.parent == null) {
            //     parentDiv = document.getElementById("docWrapper");
            // } else {
            //     parentDiv = dch.parent.div
            // }

            dch.div.style.position = "absolute";

            for (let idx = 0; idx < 4; idx++) {    // get and parse the L/T R/B W H  values
                const tmp = await sr.readNext();
                const typ = tmp.charAt(0);         // get the L/T R/B W or H char
                const val = tmp.substr(1) + "px";  // get the value and append "px"

                switch(typ) {
                    case 'L':   dch.div.style.left   = val;   break;
                    case 'T':   dch.div.style.top    = val;   break;
                    case 'R':   dch.div.style.right  = val;   break;
                    case 'B':   dch.div.style.bottom = val;   break;
                    case 'W':   dch.div.style.width  = val;   break;
                    case 'H':   dch.div.style.height = val;   break;
                }
            }

//RSTEMP get-us-going mods to experiment on the el
            dch.div.style.border = "1px solid black";
            dch.div.style.backgroundColor = "lightsalmon";
            dch.div.style.overflow = "hidden";
            dch.div.style.whiteSpace = "nowrap";
//RSTEMP.end

            // parentDiv.appendChild(dch.div);
        }

        let chunkLen = 0;
        if (dch.hasChunk) {
            chunkLen = parseInt(await sr.readNext());           // get the # of bytes that belong to this handler's content
            const chunk = await sr.readChunk(chunkLen, true);   // read next chunkLen bytes, then shrink sr
            let tmpSr = new FG.StreamReader(chunk);             // limit stream available to loadDoc() to just this chunk
            await dch.loadDoc(tmpSr);
        } else {
            await dch.loadDoc(sr);      // if not expecting a chunk, has access to read directly from stream
        }
    }
};
