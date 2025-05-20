/*
class DFDialog( {preRun, postRun, onButton, onClose})
    Create a simple but powerful Dialog object with optional async/await callbacks

Basic usage:
    const handle = new DFDialog({
        preRun:   <callback>,
        onButton: <callback>,
        postRun:  <callback>,
        onClose:  <callback>
    });
    handle.open(content, data, buttonDict);

DFDialog construction parameters:
    ** Note that all of these parameters are optional **

    async preRun(contentElement)
            Called immediately after open() has attached 'content' to 'document.body', and `data` has been populated into the 
            corresponding elements. This is an ideal place to perform setup tasks such as adding event listeners, setting 
            timers, or initializing UI elements before the dialog becomes visible and is made interactive.

        contentElement
            A handle to the <div> wrapping the 'content' supplied by the open() call with 'data' (also supplied by open()) already
            populated into the content

        RETURNS:
            Nothing

    async onButton(btnLabel, data)
            Called whenever a dialog button is clicked  (emulates a return of true if not supplied)

        btnLabel 
            The label displayed as text on the button

        data
            value is based on button type,  (see open(...btnDict) below)
            If type is true, data is a {"key":"value"} dict of all elements in the form with a 'name=' attribute
            if type is false, this will be null

        RETURNS:  
            true if the dialog is to be closed now, or false if it is to stay open

    async postRun(contentElement)
            called after onButton, when onButton returns true
            Here is where anything added during preRun() should be undone, such as eventListeners and timers

        contentElement
            same as preRun() above

        RETURNS:  
            nothing

    onClose(btnLabel, data)  (Note that this call is not async)
            called after postRun, as a useful but optional 'final stage' call to handle dialog's changes after 
            dialog is completely closed and removed

        btnLabel
            same as onButton above

        data
            same as onButton above

        RETURNS:
            nothing


Functions within the class:
    open(content, data, buttonDict = null)
            Open a dialog based on the parameters passed

        content
            A complete html container element, typically a <form>...</form> or <div>...</div> etc.  that will be shown in the popup dialog. 
            Inside this html should be input fields, button fields, etc, with each element that will have any form of editable data
            having a name="..." attribute that will be populated automatically via the data parameter, and by the preRun callback, before 
            displaying the dialog.

        data
            An object with multiple {"key": "value"} pairs, where for each "key", its "value" will get populated into the content's html
            element having a 'name="key"' attribute

        buttonDict 
            a {"key":true/false} object (or null) that will cause buttons to be displayed underneath the content, from left to right, in 
            the same order given
            If null, then a default of { "Cancel": false,  "OK": true } is supplied

            key
                The text to show as the label on the button

            value
                true  if calls to onButton and onClose have the data parameter populated with the dialog's current data
                false if calls to onButton and onClose have the data parameter set to null.  (This is generally useful to mark
                a button as a 'cancel' type button)

    close()
            Callable from within any callback or outside the dialog entirely through the class handle, to begin the dialog closing 
            process and start the callback sequence of .postRun(formElement) and .onClose(btnLabel, data), however when
            .onClose is called, btnLabel is an empty string to signify it was not closed by a button press, and data is always populated
            with the dialog's values.
*/

class DFDialog {
// functions callable after new  (stubbed here for clarity, defined in detail below)
    async open(html, data, buttons = null) {}
    async close() {}

// default functions if not supplied during new
    async preRun()  {}
    async postRun() {}
    async onButton(label, dict) { debugger; return true; }
          onClose() {}

    constructor(opts = {}) {
        if (opts.preRun)   { this.preRun   = opts.preRun;   }
        if (opts.postRun)  { this.postRun  = opts.postRun;  }
        if (opts.onButton) { this.onButton = opts.onButton; }
        if (opts.onClose)  { this.onClose  = opts.onClose;  }
    }

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// internal values and functions, beyond this point is for the class itself

    _root;      // handle to the root <div> of the dialog
    _overflow;  // state of body.overflow before dialog opened  (restored in .close())
    _buttons;    // set during open()
    static _defaultButtons = { "Cancel": false, "OK": true };
    async open(html, data, buttons = null) {
        _loadCss();
        if (buttons) { 
            this._buttons = buttons; 
        } else {
            this._buttons = this.constructor._defaultButtons;
        }

        this._overflow = document.body.style.overflow;      // Disable page scroll
        document.body.style.overflow = 'hidden';

        this._root = document.createElement("div");
        this._root.className = "modal-backdrop";
        this._root.tabIndex = -1;                           // for focus trapping
        document.body.appendChild(this._root);

        let elDlg = document.createElement("div");
        elDlg.className = "modal-dialog";
        elDlg.style.display = "none";                       // hide the dialog until constructed and populated

        let txt = `<table>
            <tr><td><hr  id = "DFDlgDragDiv"   class="modal-dragbar"></td></tr>
            <tr><td><div id="DFDlgUserContent" class="modal-content">${html}</div></td></tr>
            <tr><td><div id="DFDlgBtnDiv"      class="modal-buttons"></div></td></tr>
        </table>`;
        elDlg.innerHTML = txt;
        
        this._root.append(elDlg);

        let elBtnDiv = document.getElementById("DFDlgBtnDiv");
        // for (const btnLabel of Object.keys(buttons)) {  // vscode debugging crashes with 'sigill' when singlestepping over this line...
        const keys = Object.keys(this._buttons);
        // for (const btnLabel of keys) {                  // vscode debugging crashes with 'sigill' here too!
        for (let idx = 0; idx < keys.length; idx++) {      // create buttons  (this does not crash!)
            const btnLabel = keys[idx];
            const btn = document.createElement('button');
            btn.textContent = btnLabel;
            btn.onclick = async function () {
                let dict = null;
                if (this._buttons[btnLabel]) {                    // is button a 'true' or 'false' button
                    dict = this.fetchData();
                }
                const result = await this.onButton(btnLabel, dict);
                if (result == true) {
                    this.close();
                }
            }.bind(this);
            elBtnDiv.appendChild(btn);
        }
        this.applyData(data);

        let tmp = document.getElementById("DFDlgUserContent");
        await this.preRun(tmp)

        let startX = 0, startY = 0;
        let elDrag = document.getElementById("DFDlgDragDiv");
        elDrag.addEventListener('mousedown', (evt) => {             // add handler for dragbar
            const rect = elDlg.getBoundingClientRect();
            startX = evt.clientX - rect.left;
            startY = evt.clientY - rect.top;

            const onMouseMove = (evt) => {
                const bRect = this._root.getBoundingClientRect();
                if (evt.clientX < (bRect.left + 10)
                || evt.clientX > (bRect.right - 10) 
                || evt.clientY < (bRect.top + 10) 
                || evt.clientY > (bRect.bottom - 10))  {        // prevent 'losing' dialog by dragging it off viewport
                    return; 
                }
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

        this._root.addEventListener('keydown', this.trapFocus);   // add handling of focus trapping
        setTimeout(() => {
            this.focusable()[0]?.focus()
        }, 0);
        setTimeout(() => {
            elDlg.style.display = "";                 // let dialog finish construction, then show at last
        }, 0);
    }


    _isClosing = false;
    async close() {
        if (this._isClosing) {  // prevent loop if user calls this.close() from within .postRun() or .onClose() 
            return;
        }
        this._isClosing = true;
        let data = this.fetchData();
        await this.postRun(this._root);

// restore internal values to their prior-to-open() state
        this._root.remove();                            // remove dialog and all eventListeners we added
        this._root = undefined;                         // clear it from ourselves
        document.body.style.overflow = this._overflow;  // restore orig overflow value
        this.onClose("", data);
        this._isClosing = false; 
    }
    
    applyData(data) {
        if (data) {
            for (const [key, value] of Object.entries(data)) {
                const el = this._root.querySelector(`[name="${key}"]`);
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
    }

    fetchData() {
        const data = {};
        const elements = this._root.querySelectorAll("[name]");
    
        for (const el of elements) {
            const name = el.name;
            const tag = el.tagName;
            const type = el.type;
    
            if (tag === "INPUT") {
                if (type === "checkbox") {          // RSTODO untested
                    data[name] = el.checked;
                } else if (type === "radio") {      // RSTODO untested
                    // Only include if it's checked
                    if (el.checked) {
                        data[name] = el.value;
                    }
                    // Otherwise, skip — we only want one value per radio group
                    continue;
                } else {
                    data[name] = el.value;
                }
            } else if (tag === "SELECT" || tag === "TEXTAREA") {    // RSTODO untested
                data[name] = el.value;
            } else if ("value" in el) {                             // RSTODO untested
                data[name] = el.value;
            } else if ("textContent" in el) {                       // RSTODO untested
                data[name] = el.textContent;
            }
        }
    
        return data;
    }
    
    focusable = () => {   // select all focusable-by-tabbing elements
        return this._root.querySelectorAll('button, [tabindex]:not([tabindex="-1"]), input, select, textarea, a[href]');
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


