/*

A simple but powerful Dialog class

let handle = new DFDialog( {preRun, postRun, onButton})
        create a new dialog object with optional async/await callbacks
        Note that all of these functions are called with await so they are expected to complete their function before returning

    preRun(contentElement)
            called immediately after the content parameter supplied by open() was attached to the document.body, 
            and the data parameter was populated into the content div.
            Here is where such things as eventListeners and timers can be added to enhance the dialog's operation

        contentElement  
            a handle to the element created from content with the data already supplied into it.

        RETURNS:   
            nothing

    onButton(btnName, data)
            called whenever a button (passed in by the buttons parameter of the open() call) is clicked

        btnName 
            the name of the button as it was assigned in the buttons parameter

        data    
            either the updated data modified in the form if the button was set to true,  or null if false

        RETURNS:  
            true if the dialog is to be closed now, or false if it is to stay open

    postRun(btnName, data)
            called after onButton returned with true, with the same parameters as onButton as well.
            Here is where anything added during preRun() should be undone, such as eventListeners and timers

        btnName
            see onButton() above

        data     
            see onButton() above

        RETURNS:  
            nothing

Functions within the class:
open(content, data, onClose, buttons = null)
        Open a dialog based on the parameters

    content
            A complete html container element, typically a <form>...</form> or <div>...</div> etc.  that will be shown in the popup dialog. 
            Inside this html should be input fields, button fields, etc, with each element that will have any form of editable data
            having a name="SomeName" attribute that will be populated automatically before opening from the supplied 'params' parameter.

    data
            An object with multiple {"key": "value"} pairs, where for each "key", its "value" will get populated into the html 
            element with a 'name="key"' attribute.

    onClose(buttonName, data)
            a callback function called when the dialog is finished closing and postRun (if present) has completed (async/await).
            Note: this function does not need to be synchronous as the dialog will have been closed and removed by this time

        buttonName
            the name of the button as it was supplied by the buttons parameter of open()

        data
            if the button pressed was defined as true, contains the same keys as the data parameter passed in at open(), but with the values altered while the dialog was open
            or null, if the button pressed was defined as false

        RETURNS:  
            nothing

    buttons 
            a {"key":"value"} object (or null) that will cause buttons to be displayed left-to-right in the same order given.
            if null, then a default of { "Cancel": false,  "OK": true } is supplied

        key
            The text to show on the button

        value
            true  if the onButton or onClose calls are to have data popupated with the dialog's current data
            false if the onButton or onClose calls are to have data = null

close()
        close the dialog from within any one of the callbacks

        Calling this will call postRun('', data) followed by onClose('', data) with the btnName set to '' and the data
        pulled from the form.

*/

class DFDialog {
// functions callable after new  (stubbed here for clarity, defined in detail below)
    async open(html, data, onClose, buttons = null) {}
    async close() {}

// default functions if not supplied during new
    preRun() {}
    postRun() {}
    onButton(label, dict) { debugger; return true; }

// default functions and values if none supplied during open()
    onClose(label, dict) {} // default onClose if none was supplied during open
    buttons = { "Cancel": false, "OK": true };  // default buttons if none were supplied

    constructor(opts = {}) {
        if (opts.preRun)   { this.preRun   = opts.preRun; }
        if (opts.postRun)  { this.postRun  = opts.postRun; }
        if (opts.onButton) { this.onButton = opts.onButton; }
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// internal values and functions, beyond this point is for the class itself

    root;      // handle to the root <div> of the dialog
    overflow;  // state of body.overflow before dialog opened

    async open(html, data, onClose, buttons = null) {
        _loadCss();
        this._onClose = onClose;
        if (buttons) { this._buttons = buttons; }

        this.overflow = document.body.style.overflow;      // Disable page scroll
        document.body.style.overflow = 'hidden';

        this.root = document.createElement("div");
        this.root.className = "modal-backdrop";
        this.root.tabIndex = -1;                           // for focus trapping
        document.body.appendChild(this.root);

        let elDlg = document.createElement("div");
        elDlg.className = "modal-dialog";

        let txt = `<table>
            <tr><td><hr  id = "DFDlgDragDiv"   class="modal-dragbar"></td></tr>
            <tr><td><div id="DFDlgUserContent" class="modal-content">${html}</div></td></tr>
            <tr><td><div id="DFDlgBtnDiv"      class="modal-buttons"></div></td></tr>
        </table>`;
        elDlg.innerHTML = txt;
        
        this.root.append(elDlg);

        let elBtnDiv = document.getElementById("DFDlgBtnDiv");
        // for (const btnLabel of Object.keys(buttons)) {  // vscode debugging crashes with 'sigill' when singlestepping over this line...
        const keys = Object.keys(buttons);
        // for (const btnLabel of keys) {                  // vscode debugging crashes with 'sigill' here too!
        for (let idx = 0; idx < keys.length; idx++) {      // create buttons  (this does not crash!)
            const btnLabel = keys[idx];
            const btn = document.createElement('button');
            btn.textContent = btnLabel;
            btn.onclick = () => {
                let dict;
                debugger; if (buttons[btnLabel]) {
                    dict = this.fetchData();
                } else {
                    dict = null;
                }
                const result = this.onButton?.(btnLabel, dict);
                if (result !== false) {
            /*???*/this.close();
                }
            };
            elBtnDiv.appendChild(btn);
        }
        this.applyData(data);

        let tmp = document.getElementById("DFDlgUserContent");
        this.preRun(tmp)

        let startX = 0, startY = 0;
        let elDrag = document.getElementById("DFDlgDragDiv");
        elDrag.addEventListener('mousedown', (evt) => {             // add handler for dragbar
            const rect = elDlg.getBoundingClientRect();
            startX = evt.clientX - rect.left;
            startY = evt.clientY - rect.top;

            const onMouseMove = (evt) => {
                elDlg.style.left = `${evt.clientX - startX}px`;
                elDlg.style.top = `${evt.clientY - startY}px`;
                elDlg.style.transform = `none`; // disable center-align
            };
            const onMouseUp = () => {
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

// RSNOTE this code works, but do we really need it? 
        // this.root.addEventListener('keydown', this.trapFocus);   // add handling of focus trapping
        // setTimeout(() => {
        //     this.focusable()[0]?.focus()
        // }, 0);

    }


    async close() {
        debugger; const data = this.fetchData();
        if (this.postRun) {
            await this.postRun('', data);
        }
        if (this.onClose) {
            await this.onClose('', data);
        }

// restore all prior-to-open() values
        this.root.remove();          // remove dialog and all eventListeners we added
        this.root = undefined;       // clear it from ourselves
        this.buttons = { "Cancel": false, "OK": true }; // restore the default buttons too
        document.body.style.overflow = this.overflow;   // restore orig overflow value
    }
    
    applyData(data) {
        for (const [key, value] of Object.entries(data)) {
            const el = this.root.querySelector(`[name="${key}"]`);
            if (!el) {
                continue;
            }
        
            const tag = el.tagName; // INPUT,...
            const type = el.type;   // number, text, checkbox, radio, 
        
            if (tag == "INPUT") {
                if (type == "checkbox") {       // RSTODO untested
                    el.checked = !!value;
                } else if (type == "radio") {   // RSTODO untested
                    const radios = root.querySelectorAll(`input[type="radio"][name="${key}"]`);
                    for (const r of radios) {
                        r.checked = r.value == value;
                    }
                } else {
                    el.value = value;
                }
            } else if (tag == "SELECT" || tag == "TEXTAREA") {      // RSTODO untested
                el.value = value;
            } else if ("value" in el) {                             // RSTODO untested
                el.value = value;              // For custom elements or others with a .value prop
            } else if ("textContent" in el) {                       // RSTODO untested
                el.textContent = value;        // Fallback: just put value into text content
            }
        }
    }

    fetchData() {
        const data = {};
        const elements = this.root.querySelectorAll("[name]");
    
        for (const el of elements) {
            const name = el.name;
            const tag = el.tagName;
            const type = el.type;
    
            if (tag === "INPUT") {
                if (type === "checkbox") {
                    data[name] = el.checked;
                } else if (type === "radio") {
                    // Only include if it's checked
                    if (el.checked) {
                        data[name] = el.value;
                    }
                    // Otherwise, skip — we only want one value per radio group
                    continue;
                } else {
                    data[name] = el.value;
                }
            } else if (tag === "SELECT" || tag === "TEXTAREA") {
                data[name] = el.value;
            } else if ("value" in el) {
                data[name] = el.value;
            } else if ("textContent" in el) {
                data[name] = el.textContent;
            }
        }
    
        return data;
    }
    
    focusable = () => {   // select all focusable-by-tabbing elements
        return this.root.querySelectorAll('button, [tabindex]:not([tabindex="-1"]), input, select, textarea, a[href]');
    }


    trapFocus = (evt) => {          // Focus trap -- make sure tabbing won't jump outside of dialog
        const f = this.focusable();
        if (!f.length) {
            return;
        }
        const first = f[0], last = f[f.length - 1];
        if (evt.key === 'Tab') {
            if (evt.shiftKey && document.activeElement === first) {
                evt.preventDefault();
                last.focus();
            } else if (!evt.shiftKey && document.activeElement === last) {
                evt.preventDefault();
                first.focus();
            }
        }
    };
};
export { DFDialog };

  
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


