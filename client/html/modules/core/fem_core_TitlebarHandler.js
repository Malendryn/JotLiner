import { DFMenuBar } from "/modules/classes/DFContextMenu.js";
import { DFDialog } from "/modules/classes/DFDialog.js";

let _mmHandle;

const mainMenu = {
    File: [
        { label: "Open new instance",      action: "newInstance", tip: "Open another copy of this program in a new window" },
        { label: "Create new database",    action: "newDB",       tip: "Create a new database" },
        { label: "Open existing database", action: "openDB",      tip: "Open an existing database" },
        { label: "Open recent database",   action: "",            tip: "Open one of the recently opened databases in the submenu", children: [
            { label: "Import database",        action: "importDB",    tip: "Import an exported database under a new name" },
            { label: "Open recent database",   action: "",            tip: "Open one of the recently opened databases in the submenu", children: [
                { label: "Export database",        action: "exportDB",    tip: "Export current database to a file" },
            ] },
        ] },
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

export async function initialize() {    // called from index.js
    _mmHandle = new DFMenuBar();                                // install the menubar
    let el = document.getElementById("mainMenuBar");
    _mmHandle.open(el, mainMenu, onMainMenuCallback);

    let sel = document.getElementById("dbSelector");
    sel.addEventListener("change", onDBSelectorChanged)

    FF.updateDBSelector();      // get available dbs from server, populate dbDropdown in titlebar, fireup FF.selectDB() workhorse!
}


FF.updateDBSelector = async function() {
    FG.curDBName = localStorage.getItem("curDBName") || "";
    let sel = document.getElementById("dbSelector");
    sel.innerHTML = "";

    let opt, pkt = WS.makePacket("GetDBList");
    pkt = await WS.sendWait(pkt);

    for (let idx = localStorage.length - 1; idx >= 0; idx--) {  // delete any stale localStorage refs for deleted db's
        const key = localStorage.key(idx);
        if (key.startsWith("curDBDoc:")) {
            const wrd = key.split(":")[1];      // split out and capture the dbName from the key
            if (!pkt.list.includes(wrd))  {     // this database is no longer available
                localStorage.removeItem(key);
            }
        }
    }

    if (pkt.list.includes(FG.curDBName) == false) {     // clear 'current db' if not exists
        FG.curDBName = "";
        localStorage.removeItem("curDBName");        // remove name from localstorage
    }

// now build the dropdown
    if (!FG.curDBName) {                      // stick in an option that no db is selected
        opt = document.createElement("option");
        opt.text = "No DB Selected";
        opt.disabled = true;
        opt.selected = true;
        sel.appendChild(opt);
    }
    for (const name of pkt.list) {            // list all available db's and select the one matching FG.curDBName
        opt = document.createElement("option");
        opt.text = name;
        if (name == FG.curDBName) {
            opt.selected = true;
        }
        sel.appendChild(opt);
    }
    sel.dispatchEvent(new Event("change"));   // fire a 'change' event to call onDBSelectorChanged()
}


FF.selectDB = async function() {
    FG.curDBName = localStorage.getItem("curDBName") || "";
    if (FG.curDBName) {
        let pkt = WS.makePacket("SelectDB");            // tell server, waitfor failMsg or null=good
        pkt.text = FG.curDBName;
        pkt = await WS.sendWait(pkt);
        if (pkt.text) {
            localStorage.removeItem("curDBName");       // something went wrong,  'forget' current DB and popup the msg
            FG.curDBName = "";
            alert(pkt.text);
        }
    }

    await FF.loadDocTree();                             // load-and-show docTree for that db

    const uuid = localStorage.getItem("curDBDoc:" + FG.curDBName) || "";
    await FF.selectAndLoadDoc(uuid);
}


function onDBSelectorChanged(evt) {
    localStorage.setItem("curDBName", evt.target.value);
    FF.selectDB();
}

FF.showLS = function() {
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        console.log(`${key}: ${value}`);
    }
}
function onMainMenuCallback(action) {
    switch (action) {
        case "newInstance": {   onNewInstance(); break;  }
        case "newDB":       {   onNewDB();       break;  }
        case "openDB":      {   onOpenDB();      break;  }
        case "importDB":    {   onImportDB();    break;  }
        case "exportDB":    {   onExportDB();    break;  }
    }
}
let dlg;

function onNewInstance() {

}


function onNewDB() {
    async function onButton(btnLabel, dict) {
        let pkt = WS.makePacket("CreateDB");
        pkt.text = dict.dbName;
        pkt = await WS.sendWait(pkt)    // insert new doc, wait for confirmation
        if (pkt.text) {
            alert("Database name error: " + pkt.text);
            return false;
        }
        return true;
    }
    const form = `<form>
    <b>Create New Database</b><br><br>
    <label>Enter new DB Name</label>
    <input type="text" name="dbName" maxlength="32"><br><br>
</form>`;

    FG.kmStates.modal = true;
    dlg = new DFDialog({ onButton: onButton });
    dlg.open(form);
}


function onOpenDB() {
}


function onImportDB() {
}


function onExportDB() {
}


