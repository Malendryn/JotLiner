// ALL this does is load a SINGLE DocComponent, and populates it based on its type
// it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)


export class DocComponentLoader {   // base class of all document components
    async load(sr)  { return await _load.call(this, sr);    }    // internal, load header portion of DocComponent, call .parse(z)
};


async function _load(sr) {      // this loader loads the 'out of band' stuff not specifically inside a component
    const dchName = await sr.readNext();      // read next ctrl word  (that is, everything up to next ';')
    if (!DCH.hasOwnProperty(dchName)) {          // load the module(plugin) if not already loaded
        const dch = await FF.loadModule("./modules/DocComponentHandlers/dch_" + dchName + ".js")
        DCH[dchName] = dch.DCH;
    }
    const docHandler = new DCH[dchName]();          // get new instance of actual handler

    docHandler.X = parseInt(await sr.readNext());
    docHandler.Y = parseInt(await sr.readNext());
    docHandler.W = parseInt(await sr.readNext());
    docHandler.H = parseInt(await sr.readNext());
    if (docHandler.type > 0) {                          // type = <positive> only get access to content that belongs to them
        let byteCt = parseInt(await sr.readNext());     // so the next value is the #bytes that belong to them
        let str = await sr.readChunk(byteCt, true);     // which we then yank from the stream (and shrink sr too!)
        sr = new FG.StreamReader(str);                  // and finally replace/discard passed sr with this new one
    }
    await docHandler.load(sr);           // let the component digest the stream passed to it
    return docHandler;
}
