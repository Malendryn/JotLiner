// ALL this does is load a SINGLE DocComponent, and populates it based on its type
// it DOES NOT assign parentage! That is in the purvue of the components themselves (particularly the type=negative ones)


export class DocComponentLoader {   // create and return a DCH from a stream
    async load(sr, parent)  {
        const dchName = await sr.readNext();      // read next ctrl word  (that is, everything up to next ';')
        if (dchName == "") {
            return null;
        }
        if (!DCH.hasOwnProperty(dchName)) {          // load the module(plugin) if not already loaded
            const dch = await FF.loadModule("./modules/DocComponentHandlers/dch_" + dchName + ".js")
            DCH[dchName] = dch.DCH;
        }
        const dch = new DCH[dchName]();          // get new instance of actual handler
        await dch.load(sr, parent);              // let the component digest the stream passed to it
        return dch;
    }
};
