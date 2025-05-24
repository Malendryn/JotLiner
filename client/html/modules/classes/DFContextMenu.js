
class DFContextMenu {
    menu = null;
    async open(entries, callback, locX, locY) {
        for (let idx = 0; idx < this._styles.length; idx++) {
            const style = this._styles[idx];
            await _loadStyle(this._styleId, idx + 2, style);  // idx is +2 cuz 1) so errs show 1-based and 2) to skip styles.unshift("DFDialog.css") above
        }

        this.menu = _buildContextMenu(entries, false);

        this.menu.style.left = locX + "px";
        this.menu.style.top = locY + "px";
        this.menu.classList.add("active");

        document.body.appendChild(this.menu);

        const pRect = document.body.getBoundingClientRect();
        const rect = this.menu.getBoundingClientRect();
        if (rect.left + rect.width > pRect.width) {
            this.menu.style.left = Math.max(pRect.width - rect.width, 0) + "px";
        }
        if (rect.top + rect.height > pRect.height) {
            this.menu.style.top = Math.max(pRect.height - rect.height, 0) + "px";
        }
    
        this.menu.addEventListener("click", (evt) => {
            if (evt.target.dataset.action) {  // if not a submenu-opener entry
                this.close();
                callback(evt.target.dataset.action);
            }
        });
        this.menu.addEventListener("mouseleave", (evt) => {
            this.close();
            callback('');
        });
    }

    close() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
        const attr = "data-" + this._styleId;
        const elements = document.querySelectorAll(`[${attr}]`);
        for (const el of elements) {
            el.remove();
        }
    }
    _styleId;   // a unique id for this particular popup so we can delete all styles added by it at once
    _styles;    // list of styles to load into <head> on open()
    constructor(styles = []) {
        this._styles = Object.assign([], styles);
        this._styleId = crypto.randomUUID().replaceAll("-", "");
        let fname = import.meta.url;    // get full path to this file without this file's name
        fname = fname.slice(0, fname.lastIndexOf("."));     // lose the ending .js or .mjs or any
        fname += ".css";                                    // and add a .css in its place
        this._styles.unshift(fname);                        // then prepend it on the styles list
    }
}
export { DFContextMenu };


class DFMenuBar {
    bar = null;     // the <div> that shows the menuEntries left to right inside the parent
    cm = null;      // contextMenu that opens beneath a menuEntry
    async open(parent, entries, callback) {
        for (let idx = 0; idx < this._styles.length; idx++) {
            const style = this._styles[idx];
            await _loadStyle(this._styleId, idx + 2, style);  // idx is +2 cuz 1) so errs show 1-based and 2) to skip styles.unshift("DFDialog.css") above
        }

        this.bar = document.createElement("div");
        this.bar.id = "DFMenuBar"
        parent.appendChild(this.bar);
        for (const key in entries) {
            let el = document.createElement("div");
            el.classList.add("header");
            el.dataset.action = key;
            el.innerHTML = key;
            this.bar.appendChild(el);
        }
        parent.addEventListener("click", (evt) => {
            const which = evt.target.dataset.action;     // "File", or "Edit", or "Help" etc..
        
            const rect = evt.target.getBoundingClientRect();
            // FF.contextMenu.open(entries[which], callback, rect.left, rect.bottom);
            this.cm.open(entries[which], callback, rect.left, rect.bottom);
        });
    }

    close() {
        if (this.bar) {
            this.bar.remove();
            this.bar = null;
        }
        debugger; const attr = "data-" + this._styleId;
        const elements = document.querySelectorAll(`[${attr}]`);
        for (const el in elements) {
            el.remove();
        }
    }

    _styleId;   // a unique id for this particular popup so we can delete all styles added by it at once
    _styles;    // list of styles to load into <head> on open()
    constructor(styles = []) {
        this._styles = Object.assign([], styles);
        this._styleId = crypto.randomUUID().replaceAll("-", "");
        this.cm = new DFContextMenu(styles);
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
