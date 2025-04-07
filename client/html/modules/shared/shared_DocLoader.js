// ALL this does is load a SINGLE DocComponent, and populates it based on its type
// it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)


export class DocLoader {   // create and return a DCH from a stream
    async load(sr, parent)  {
        if (parent == null) {               // if no parent, read first element as document version
            const ver = await sr.readNext();
            if (ver < FG.docVersion) {
                debugger; // RSTODO doc is older than current version, must upgrade!
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

            const X = parseInt(await sr.readNext());
            const Y = parseInt(await sr.readNext());
            const W = await sr.readNext();
            const H = await sr.readNext();
            // dch.W = parseInt(W);
            // dch.H = parseInt(H);

            dch.div.style.left   = X + "px";
            dch.div.style.top    = Y + "px";

            if (W.charAt(0) == '-') {
                dch.div.style.right = W + "px";
            } else {
                dch.div.style.width = W + "px";
            }
            if (H.charAt(0) == '-') {
                dch.div.style.bottom = H + "px";
            } else {
                dch.div.style.height = H + "px";
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
            let tmpSr = new FG.StreamReader(chunk);             // limit stream available to parse() to just this chunk
            await dch.parse(tmpSr);
        } else {
            await dch.parse(sr);      // if not expecting a chunk, has access to read directly from stream
        }
    }
};
