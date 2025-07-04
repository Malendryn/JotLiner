import { DFMenuBar } from "/public/classes/DFContextMenu.js";
import { DFDialog } from "/public/classes/DFDialog.js";


export async function initialize() {    // called from index.js
    let mBar = new DFMenuBar();                                // install the menubar
    let el = document.getElementById("mainMenuBar");
    await mBar.open(el, mainMenu, onMainMenuCallback);

    let sel = document.getElementById("dbSelector");
    sel.addEventListener("change", onDBSelectorChanged)

    FF.updateDBSelector(true);      // get available dbs from server, populate dbDropdown in titlebar, fireup FF.selectDB() workhorse!
}


const mainMenu = {
    File: [
        { label: "Create new database",    action: "newDB",       tip: "Create a new database" },
        { label: "Import database",        action: "importDB",    tip: "Import an exported database under a new name" },
        { label: "Export database",        action: "exportDB",    tip: "Export current database to a file" },
    ],
    // Edit: [
    // ],
    Help: [
        { label: "About",        action: "about",    tip: "Show information about the software" },
        { label: "License",      action: "license",  tip: "Show information about the AGPL3 license" },
    ]
};


FF.updateDBSelector = async function(switchTo) {
    let sel = document.getElementById("dbSelector");
    sel.innerHTML = "";

    
    let opt, pkt = WS.makePacket("GetDBList");
    pkt = await WS.sendWait(pkt);

    LS.purgeMissing(pkt.list);      // get rid of any storages for db's no longer on the server
    FG.curDbName = LS.curDb;

// now build the dropdown
    if (!FG.curDbName) {                      // stick in an option that no db is selected
        opt = document.createElement("option");
        opt.text = "No DB Selected";
        opt.disabled = true;
        opt.selected = true;
        sel.appendChild(opt);
    }
    for (const name of pkt.list) {            // list all available db's and select the one matching FG.curDbName
        opt = document.createElement("option");
        opt.text = name;
        if (name == FG.curDbName) {
            opt.selected = true;
        }
        sel.appendChild(opt);
    }

    const evt = new CustomEvent("change", { detail: {switch: switchTo}});
    sel.dispatchEvent(evt);   // fire a 'change' event --> onDBSelectorChanged() --> FF.selectDB()
}


FF.selectDB = async function() {
    FG.curDbName = LS.curDb; // this is the name of db switching TO, not FROM

    if (FG.curDbName) {
        let pkt = WS.makePacket("SelectDB");            // tell server, waitfor failMsg or null=good
        pkt.name = FG.curDbName;
        pkt = await WS.sendWait(pkt);
        if (pkt.error) {
            LS.curDb = "";                   // something went wrong,  'forget' current DB and popup the msg
            FG.curDbName = LS.curDb;
            FF.updateDBSelector(true);       // to clean out the missing db(s)
            alert(pkt.error);
        }
    }

    await FF.clearDoc();    // clear current doc from memory (fixes issue with FF.selectAndLoadDoc erasing localStorage."curDBDoc:<dbName>")

    FF.setSizerPos(LS.sliderPos);

    await FF.loadDocTree();                             // load-and-show docTree for that db

    const uuid = (LS.curDoc && LS.curDoc) || "";
    await FF.selectAndLoadDoc(uuid);
}


function onDBSelectorChanged(evt) {
    let dbName = evt.target.value;
    if (dbName == "No DB Selected") {
        dbName = "";
    }
    if (!evt.detail || evt.detail.switch == true) {
        LS.curDb = dbName;
        FF.selectDB();
    }
}

function onMainMenuCallback(action) {
    switch (action) {
        case "newInstance": { onNewInstance(); break; }
        case "newDB":       { onNewDB();       break; }
        case "openDB":      { onOpenDB();      break; }
        case "importDB":    { onImportDB();    break; }
        case "exportDB":    { onExportDB();    break; }
        case "about":       { onAbout();       break; }
        case "license":     { onLicense();     break; }
    }
}
let dlg;

function onNewInstance() {

}


function onNewDB() {
    async function _onButton(btnLabel, dict) {
        if (dict.isSubmit) {
            let pkt = WS.makePacket("AddDB", {name:dict.dbName});
            pkt = WS.send(pkt);
        }
        return true;        // close dlg on any button
    }
    const form = `<form>
    <b>Create New Database</b><br><br>
    <label>Enter new DB Name</label>
    <input type="text" name="dbName" maxlength="32"><br><br>
</form>`;

    dlg = new DFDialog({ onButton: _onButton });
    dlg.open({form:form});
}


function onOpenDB() {
}


function onImportDB() {
}


function onExportDB() {
}


function onAbout() {
    const form = `<form>
<h2>Project: JotLiner</h2>version ${FG.VERSION}
    <p></p><br>
<p>To report bugs or ask questions please visit <a href="https://github.com/Malendryn/JotLiner">Project: Jotliner</a></p>
</form>`;

    let dlgHandle = new DFDialog();
    dlgHandle.open({form:form, buttons:{"OK":true}});
}


async function onLicense() {
    const filePath = FG.baseURL + "/LICENSE";
    const response = await fetch(filePath);
    if (!response.ok) {
        const form = '<form><p>Could not load LICENSE file.  Please click here to '
            + '<a href="https://www.gnu.org/licenses/agpl-3.0.html"'
            + 'target="_blank" rel="noopener noreferrer">View AGPLv3 License</a></p>'
            + '</form>';
        let dlgHandle = new DFDialog();
        dlgHandle.open({form:form, buttons:{"OK":true}});
        return;
    }
    const txt = await response.text();

    const win = window.open("", "_blank");
    win.document.write("<pre>" + txt + "</pre>")
    win.document.title="LICENSE";
}

