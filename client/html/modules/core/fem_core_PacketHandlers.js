/* When a packet comes in from the server that is not a response to a packet sent from here, it will look for a prototype.process() function on 
the packet, and if found will call it.  

We do not put these functions into the client/html//modules/shared/shared_PacketDefs.js file because this file is used by both the server and client,
and the server will have its own .process() function that is different from the clients .process()

Here below if we receive a packet of class Changed, it will call .process() below, with 'this' being the constructed packet received from the server
*/

WS.classes.Changed.prototype.process = async function() {    // insert new doc into db,  return with a GetDocTree packet
    if (this.dict.what == "doc") {
        if (FG.curDoc && FG.curDoc.uuid == this.dict.uuid) {         // our currently-viewed doc changed, go fetch a new one!
            await FF.selectAndLoadDoc(this.dict.uuid, true);         // download and display doc
        }
    } else if (this.dict.what == "docTree") {    // fetch an entirely new docTree & remove doc too if wasdeleted from docTree
        await FF.loadDocTree();                                     // download new doctree from server
        await FF.selectAndLoadDoc(FG.curDoc && FG.curDoc.uuid);     // download and display new tree, re-select curDoc too
    } else if (this.dict.what == "dbList") {
        FF.updateDBSelector();      // get available dbs from server, populate dbDropdown in titlebar, fireup FF.selectDB() workhorse!

    }
};
