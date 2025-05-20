WS.__classes.Changed.prototype.process = async function() {    // insert new doc into db,  return with a GetDocTree packet
    if (this.dict.what == "doc") {
        if (FG.curDoc && FG.curDoc.uuid == this.dict.uuid) {         // our currently-viewed doc changed, go fetch a new one!
            await FF.selectAndLoadDoc(this.dict.uuid, true);         // download and display doc
        }
    } else if (this.dict.what = "docTree") {    // fetch an entirely new docTree & remove doc too if wasdeleted from docTree
        await FF.loadDocTree();                                     // download new doctree from server
        await FF.selectAndLoadDoc(FG.curDoc && FG.curDoc.uuid);     // download and display new tree, re-select curDoc too
    } else if (this.dict.what = "dbList") {
        debugger;
    }
};
