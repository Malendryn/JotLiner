
class ContextMenu {
    menu = null;
    open(entries, callback, locX = FG.kmStates.clientX, locY = FG.kmStates.clientY) {
        _loadCss();
        this.close();
        this.menu = _buildContextMenu(entries, false);
        this.menu.style.left = locX + "px";
        this.menu.style.top = locY + "px";
        this.menu.classList.add("active");
        document.body.appendChild(this.menu);
    
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
    }    
}
export { ContextMenu };


class MenuBar {
    bar = null;
    cm = null;
    open(parent, entries, callback) {
        _loadCss(this.constructor.name);
        this.close();
        this.bar = document.createElement("div");
        this.bar.id = "DF_menuBar"
        parent.appendChild(this.bar);
        for (const key in entries) {
            let el = document.createElement("div");
            el.classList.add("DF_menuBarEntry");
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
    }


    constructor() {
        this.cm = new ContextMenu();
    }
}
export { MenuBar }


let _isCssLoaded = false;
function _loadCss() {
    if (!_isCssLoaded) {
        let url = import.meta.url;                              // get our http path to self
        // url = url.substring(url.lastIndexOf("/") + 1)      // get filename part (after last '/')
        url = url.substring(0, url.lastIndexOf("."));        // strip off the extension (.js)
        url += ".css";
        // url = new URL("./" + url + ".css", import.meta.url).href;  // rebuild with .css
        if (!document.querySelector(`link[href="${url}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = url;
            document.head.appendChild(link);
        }
        _isCssLoaded = true;
    }
}


function _buildContextMenu(entries, isSubmenu = false) {
    const menu = document.createElement('div');
    menu.id = "menus-container";
    menu.position  = "fixed";
    menu.className = isSubmenu ? 'submenu' : 'context-menu';

    for (const entry of entries) {
        const optEl = document.createElement('div');
        optEl.className      = 'menu-option';
        if (entry.label) {
            optEl.textContent    = entry.label;
            optEl.title          = entry.title;
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
