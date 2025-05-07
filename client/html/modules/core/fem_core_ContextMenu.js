/* 
entries format is:  
    let entries = [
        [ "action", "entryText", "tooltip Text" ],
        [ "action", "entryText", "tooltip Text" ],
    ];
callback format is:
    T/F = function callback(action) {}  (return true to allow <save> else F keeps dialog open)
*/
FF.openContextMenu = function (entries, callback) {
    let mnu = document.getElementById("sysContextMenu");
    if (mnu) {     // if a menu already exists, go home!
        return;
    }

    mnu = document.createElement("div");   // create the contextMenu div
    mnu.id = "sysContextMenu";             // we use id so we don't open more menus if ones already open
    mnu.className = "sysContextMenu";      // we use className to reuse .css when opening child contextMenus
    mnu.style.left = FG.kmStates.clientX + 'px';        // Position the custom menu at the mouse coordinates
    mnu.style.top  = FG.kmStates.clientY + 'px';
    // mnu.style.zIndex = "999999999";
    mnu.style.display = 'block';           // Show the custom menu

    let ul = document.createElement("ul"); // create the outermost <ul>
    ul.style.margin = "0px";
    ul.style.whiteSpace = "nowrap";
    mnu.appendChild(ul);

    function addEntry(entry) {
        let li = document.createElement("li");          // recreate '<li data-action="export">Export</li>'
        li.setAttribute("data-action", entry[0]);
        if (entry[1] == "") {
            li.innerHTML = "<hr>";
        } else {
            li.innerHTML = entry[1];                    // we do this so we can add '<hr>' without it stringifying it
        }
        // entry[2]  <--- tooltip, RSTODO
        ul.appendChild(li);
    }

    for (let idx = 0; idx < entries.length; idx++)  {
        addEntry(entries[idx]);
    }

    document.body.appendChild(mnu);             // menu is built, we can attach it now!
    FG.kmStates.modal = true;

    const bodyRect = document.body.getBoundingClientRect();
    const mnurect = mnu.getBoundingClientRect();   // get sizeof menu AFTER attaching to div

    if (mnurect.height + mnurect.top > bodyRect.height) {
        let top = (bodyRect.height - mnurect.height);
        if (top < 0) {
            top = 0;
        }
        mnu.style.top = top + "px";
    }
    if (mnurect.width + mnurect.left > bodyRect.width) {
        let left = (bodyRect.width - mnurect.width);
        if (left < 0) {
            left = 0;
        }
        mnu.style.left = left + "px";
    }

    document.addEventListener('click', closeContextMenu);      // Add listener to close the menu if clicked outside

    function closeContextMenu(event) {
        if (mnu) {
            document.removeEventListener('click', closeContextMenu);
            document.body.removeChild(mnu);
            mnu = null;
            FG.kmStates.modal = false;
        }
    }
    
    mnu.addEventListener('click', async function(evt) {    // Handle clicks on the custom menu items
        const clickedItem = evt.target.closest('li');
        if (clickedItem) {
            const action = clickedItem.getAttribute('data-action');
            if (action) {
                closeContextMenu(evt);            // finally, close(erase) menu
                setTimeout(() => {      // defer execution until webpage updates (allow contextMenu to finish)
                // console.log(`Clicked on: ${action}`);
                callback(action);
                }, 0);
            }
        }
    });
}

