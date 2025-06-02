/*!
 * DFDialog.js
 * Copyright (c) Malendryn Tiger (Ron Stanions @ DragonsFire Creations)
 *
 * This software is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the License at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

class DFContextMenu
    Create a simple but powerful multitiered context menu with infinite expandable submenus

class DFMenuBar
    Create a menu bar that uses a DFContextMenu to display multitiered selectable dropdown beneath each entry

Basic usage:
-------------------------------------------------------------------------------------------
    const dlg = new DFContextMenu({
        styles:[
            "<style>...</style>",
            "./myStyleFile.css"
        ]
    });

    const mnu = new DFMenuBar( {
        menuStyles: [
            "<style>...</style>",
            "./myStyleFile.css"
        ],
        contextStyles: [
            "<style>...</style>",
            "./myStyleFile.css"
        ]
    });
*/

class DFContextMenu {
//  constructor(dict={styles:[]})  see bottom of class

    async open(entries, callback, locX, locY) {
        for (let idx = 0; idx < this._styles.length; idx++) {
            const style = this._styles[idx];
            await _loadStyle(this._styleId, idx + 2, style);  // idx is +2 cuz 1) so errs show 1-based and 2) to skip styles.unshift("DFDialog.css") above
        }

        this._menu = _buildContextMenu(entries, false);

        this._menu.style.left = locX + "px";
        this._menu.style.top = locY + "px";
        this._menu.classList.add("active");

        document.body.appendChild(this._menu);

        const pRect = document.body.getBoundingClientRect();
        const rect = this._menu.getBoundingClientRect();
        if (rect.left + rect.width > pRect.width) {
            this._menu.style.left = Math.max(pRect.width - rect.width, 0) + "px";
        }
        if (rect.top + rect.height > pRect.height) {
            this._menu.style.top = Math.max(pRect.height - rect.height, 0) + "px";
        }
    
        this._menu.addEventListener("click", (evt) => {
            if (evt.target.dataset.action) {  // if not a submenu-opener entry
                this.close();
                callback(evt.target.dataset.action);
            }
        });
        this._menu.addEventListener("mouseleave", (evt) => {
            this.close();
            callback('');
        });
    }

    close() {
        if (this._menu) {
            this._menu.remove();
            this._menu = null;
        }
        const attr = "data-" + this._styleId;
        const elements = document.querySelectorAll(`[${attr}]`);
        for (const el of elements) {
            el.remove();
        }
    }
    _menu;
    _styleId;   // a unique id for this particular popup so we can delete all styles added by it at once
    _styles;    // list of styles to load into <head> on open()
    constructor(dict={styles:[]}) {
        this._styles = Object.assign([], dict.styles || []);
        this._styleId = crypto.randomUUID().replaceAll("-", "");
        let fname = import.meta.url;    // get full path to this file without this file's name
        fname = fname.slice(0, fname.lastIndexOf("."));     // lose the ending .js or .mjs or any
        fname += ".css";                                    // and add a .css in its place
        this._styles.unshift(fname);                        // then prepend it on the styles list
    }
}
export { DFContextMenu };


class DFMenuBar {
 //   constructor(dict={menuStyles:[], contextStyles:[]})

    async open(parent, entries, callback) {
        for (let idx = 0; idx < this._styles.length; idx++) {
            const style = this._styles[idx];
            await _loadStyle(this._styleId, idx + 2, style);  // idx is +2 cuz 1) so errs show 1-based and 2) to skip styles.unshift("DFDialog.css") above
        }

        this._bar = document.createElement("div");
        this._bar.id = "DFMenuBar"
        parent.appendChild(this._bar);
        for (const key in entries) {
            let el = document.createElement("div");
            el.classList.add("header");
            el.dataset.action = key;
            el.innerHTML = key;
            this._bar.appendChild(el);
        }
        parent.addEventListener("click", (evt) => {
            const which = evt.target.dataset.action;     // "File", or "Edit", or "Help" etc..
        
            const rect = evt.target.getBoundingClientRect();
            // FF.contextMenu.open(entries[which], callback, rect.left, rect.bottom);
            this._cm.open(entries[which], callback, rect.left, rect.bottom);
        });
    }

    close() {
        if (this._bar) {
            this._bar.remove();
            this._bar = null;
        }
        debugger; const attr = "data-" + this._styleId;
        const elements = document.querySelectorAll(`[${attr}]`);
        for (const el in elements) {
            el.remove();
        }
    }

    _bar = null;     // the <div> that shows the menuEntries left to right inside the parent
    _cm = null;      // contextMenu that opens beneath a menuEntry
    _styleId;   // a unique id for this particular popup so we can delete all styles added by it at once
    _styles;    // list of styles to load into <head> on open()
    constructor(dict={menuStyles:[], contextStyles:[]}) {
        this._styles = Object.assign([], dict.menuStyles || []);
        this._styleId = crypto.randomUUID().replaceAll("-", "");
        this._cm = new DFContextMenu({styles:dict.contextStyles || []});
        let fname = import.meta.url;    // get full path to this file without this file's name
        fname = fname.slice(0, fname.lastIndexOf("."));     // lose the ending .js or .mjs or any
        fname += ".css";                                    // and add a .css in its place
        this._styles.unshift(fname);                        // then prepend it on the styles list
    }
}
export { DFMenuBar }


function _buildContextMenu(entries, isSubmenu = false) {
    const menu = document.createElement('div');
    menu.position  = "fixed";
    menu.className = isSubmenu ? 'submenu' : 'DFContextMenu';

    for (const entry of entries) {
        const optEl = document.createElement('div');
        optEl.className      = 'DFMenuOption';
        if (entry.label) {
            optEl.textContent    = entry.label;
            optEl.title          = entry.tip;
            optEl.dataset.action = entry.action;
            } else {
            optEl.innerHTML = "<hr>";
        }

        if (entry.children) {
            optEl.classList.add('has-children');
            const submenu = _buildContextMenu(entry.children, true);
            optEl.appendChild(submenu);

            optEl.addEventListener('mouseenter', () => {
                submenu.classList.add('active');
                const rect = optEl.getBoundingClientRect();
                submenu.style.top = "0px";
                submenu.style.left = optEl.offsetWidth + "px";
            });

            optEl.addEventListener('mouseleave', () => {
                submenu.classList.remove('active');
            });
        }

        menu.appendChild(optEl);
    };
    return menu;
}


async function _loadStyle(styleId, idx, style) {    // idx is only for errormsgs
    const isBlock = /^\s*<style[\s>][\s\S]*<\/style>\s*$/i.test(style.trim()); //true if valid  "<style></style>"  else false=assume filepath
      if (!isBlock) {
        const response = await fetch(style);
        if (!response.ok) {
            console.warn(`Failed to download styles[${idx}] (${style}) as a css file`);
            return null;                                  // fail silently (std practice in webpages)
        }
        style = "<style>" + await response.text() + "</style>";
    }

    let el = document.createElement("div");     // first load and validate the form
    el.innerHTML = style;
    el = el.firstElementChild;
    if (!el || el.tagName != "STYLE") {
        console.warn(`Parameter {styles:[${idx}]} missing outermost <style></style> element`);
        return null;
    }
    el.dataset[styleId] = "";                    // content is irrelevant,  that it exists is all that matters
    document.head.appendChild(el);               // stick it in!
}
