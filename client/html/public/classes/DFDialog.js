/*!
 * DFDialog.js
 * Copyright (c) Malendryn Tiger (Ron Stanions @ DragonsFire Creations)
 *
 * This software is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the License at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.

class DFDialog
    Create a simple but powerful Dialog object with optional async/await callbacks


Basic usage:
-------------------------------------------------------------------------------------------
    const dlg = new DFDialog({      // all of these are optional
        preRun:   onPreRunFunc,
        onButton: onButtonPressedFunc,
        postRun:  onPostRunFunc,
        onClose:  onCloseFunc
    });
    const form    = "<form><label>Username?</label><input type="text" name="userName"></form>";
    const dict    = {userName: "John Smith"};
    const buttons = {"Cancel":false, "OK":true};
    const handle  = dlg.open(form, dict, buttons);
-------------------------------------------------------------------------------------------
DFDialog construction parameters:
    ** Note that all of these parameters are optional, but if passed in must be async and fully
       completed before resolving **

    async preRun(formElement)
            Called immediately after open() has attached "<form>"' to document.body, and dict has been populated into the 
            corresponding elements. This is an ideal place to perform setup tasks such as adding event listeners, setting 
            timers, or initializing UI elements before the dialog becomes visible and is made interactive.

        formElement
            A handle to the <form> supplied during open(), now as a DOM element, with the contents of dict already applied.

        RETURNS:
            Nothing

    async onButton(btnLabel, dict)
            Called whenever a dialog button is clicked  (emulates a return of true if function not supplied)

        btnLabel 
            The label displayed as text on the button

        dict
            a {"key":"value"} dict of all elements in the form with a 'name=' attribute
                NOTE: A special convenience key "isSubmit" is added to this dict, set to true if this button is flagged as
                the submit button. (passed in to open() with value = true).  You could use this to have more than one
                button flagged as submit, even though only the first in the button list will fire when enter is pressed.

        RETURNS:  
            true if the dialog is to be closed now, or false if it is to stay open

    async postRun(formElement)
            called after an onButton call returned true
            Here is where anything added during preRun() should be removed, such as eventListeners and timers

        formElement
            same as preRun() above

        RETURNS:  
            nothing

    onClose(btnLabel, dict)  (Note that this call does not need to be async)
            called after postRun, as a useful but optional 'final stage' call to handle dialog's changes after 
            dialog is completely closed and removed

        btnLabel
            same as onButton above

        dict
            same as onButton above

        RETURNS:
            nothing


-------------------------------------------------------------------------------------------
Functions within the class:
    open({ 
            form: "<form/>" or "url",             // required: form to display
            styles: [ "<style/> or "url", ... ],  // optional: array of styles
            fields: { key: "value" },             // optional: form field presets
            buttons: { buttonLabel: true/false }  // optional: buttons to display
        }

        Opens a dialog based on the parameters passed

        parameters:
            form:  (required) type=string
                Contains either a complete, self-contained "<form>...</form>" HTML block, 
                or a string representation of a URL/path to a file to load as the form.

            styles: (optional) type=array of strings
                An array of strings, each either a self-contained "<style>...</style" HTML block,
                or a string representation of a URL/path to a CSS file.

            fields: (optional) type=object {key-value pairs}
                An object containing values to pre-populate the form fields where the form 
                elements have a matching 'name' attribute equal to one of this object's keys.

            buttons: (optional) type=object key-boolean pairs
                An object where each key is the label to display on a button at the bottom, and the value
                indicates whether the button acts as the submit button (true for submit, false otherwise).
                These buttons will be shown left to right underneath and seperate from the form in the 
                order contained in this object.

        RETURNS:
            null if dialog could not be created, or a handle to the opened dialog

    close()
            Callable from within any callback or outside the dialog entirely through the handle returned via open(), to begin the dialog closing 
            process and start the callback sequence of .postRun(formElement) and .onClose(btnLabel, data), however when
            .onClose is called, btnLabel is an empty string to signify it was not closed by a button press, and data is always populated
            with the dialog's values.
*/

class DFDialog {
//  constructor(opts = {})   see bottom of class

// functions callable after new  (stubbed here for clarity, defined in detail below)
    async open(html, data, buttons = null) {}
    async close() {}

// default functions if not supplied during new
    async preRun()  {}
    async postRun() {}
    async onButton(label, dict) { return true; }
          onClose() {}

///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// internal values and functions, beyond this point is for the class itself

    _root;      // handle to the root <div> of the dialog
    _overflow;  // state of body.overflow before dialog opened  (restored in .close())
    _buttons;   // set during open()
    _form;      // handle to the <form> passed in once converted to DOMelements
    _styleId;   // a unique id for this particular popup so we can delete all styles added by it at once
    static _defaultButtons = { "Cancel": false, "OK": true };

    async open(dict) {
        const form = dict.form || null;
        const styles = dict.styles || [];
        const fields = dict.fields || {};
        this._buttons = dict.buttons || this.constructor._defaultButtons;
        this._styleId = crypto.randomUUID().replaceAll("-", "");

        let fname = import.meta.url;    // get full path to this file without this file's name
        fname = fname.slice(0, fname.lastIndexOf("."));     // lose the ending .js or .mjs or any
        fname += ".css";                                    // and add a .css in its place
        styles.unshift(fname);                              // then prepend it on the styles list

        this._form = document.createElement("div");     // first load and validate the form
        try {
            this._form.innerHTML = form;
            this._form = this._form.firstElementChild;
            if (!this._form || this._form.tagName != "FORM") {
                throw new Error("'form' parameter missing outermost <form> element");
            }
        }
        catch (err) {
            throw new Error("Error in 'form' parameter of DFDialog.open: " + err.message);
        }

        for (let idx = 0; idx < styles.length; idx++) {
            const style = styles[idx];
            const id = await _loadStyle(this._styleId, idx + 2, style);     // idx is +2 cuz 1) so errs show 1-based and 2) to skip styles.unshift("DFDialog.css") above
        }

        this._form.addEventListener("submit", this._onSubmit);      // to handle the enter key

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
            <tr><td><hr  id="DFDlgDragDiv"     class="modal-dragbar"></td></tr>
            <tr><td><div id="DFDlgUserContent" class="modal-content"></div></td></tr>
            <tr><td><div id="DFDlgBtnDiv"      class="modal-buttons"></div></td></tr>
        </table>`;
        elDlg.innerHTML = txt;
        
        this._root.append(elDlg);

        let tmp = document.getElementById("DFDlgUserContent");
        tmp.appendChild(this._form);                                // embed user's form into the dialog table


        let elBtnDiv = document.getElementById("DFDlgBtnDiv");
        // for (const btnLabel of Object.keys(buttons)) {  // vscode debugging crashes with 'sigill' when singlestepping over this line...
        const keys = Object.keys(this._buttons);
        // for (const btnLabel of keys) {                  // vscode debugging crashes with 'sigill' here too!
        for (let idx = 0; idx < keys.length; idx++) {      // create buttons  (this does not crash!)
            const btnLabel = keys[idx];
            const btn = document.createElement('button');
            btn.textContent = btnLabel;
            btn.id = "btnId_" + btnLabel;
            btn.onclick = async function () {
                let dict = this._fetchData();
                dict.isSubmit = this._buttons[btnLabel] !== false;      // insert convenience key:val
                const result = await this.onButton(btnLabel, dict);
                if (result == true) {
                    this.close();
                }
            }.bind(this);
            elBtnDiv.appendChild(btn);
        }
        this._applyData(fields);

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

        this._root.addEventListener('keydown', this._trapFocus);   // add handling of focus trapping
        setTimeout(() => {
            this._focusable()[0]?.focus()
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
        let data = this._fetchData();
        await this.postRun(this._form); // work from the _form element, not the _root

// restore internal values to their prior-to-open() state
        this._root.remove();                            // remove dialog and all eventListeners we added
        this._root = undefined;                         // clear it from ourselves
        document.body.style.overflow = this._overflow;  // restore orig overflow value

        const attr = "data-" + this._styleId;
        const elements = document.querySelectorAll(`[${attr}]`);
        for (const el of elements) {
            el.remove();
        }

        this.onClose("", data);
        this._isClosing = false; 
    }
    
    _applyData(data) {
        if (data) {
            for (const [key, value] of Object.entries(data)) {
                const el = this._form.querySelector(`[name="${key}"]`);
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

    _fetchData() {
        const fd = new FormData(this._form);                // use the builtin <form> ability to fetch & validate data
        const data = Object.fromEntries(fd.entries());
        return data;

        // const data = {};
        // const elements = this._form.querySelectorAll("[name]");
    
        // for (const el of elements) {
        //     const name = el.name;
        //     const tag = el.tagName;
        //     const type = el.type;
    
        //     if (tag === "INPUT") {
        //         if (type === "checkbox") {          // RSTODO untested
        //             data[name] = el.checked;
        //         } else if (type === "radio") {      // RSTODO untested
        //             // Only include if it's checked
        //             if (el.checked) {
        //                 data[name] = el.value;
        //             }
        //             // Otherwise, skip — we only want one value per radio group
        //             continue;
        //         } else {
        //             data[name] = el.value;
        //         }
        //     } else if (tag === "SELECT" || tag === "TEXTAREA") {    // RSTODO untested
        //         data[name] = el.value;
        //     } else if ("value" in el) {                             // RSTODO untested
        //         data[name] = el.value;
        //     } else if ("textContent" in el) {                       // RSTODO untested
        //         data[name] = el.textContent;
        //     }
        // }
    
        // return data;
    }
    
    _focusable = () => {   // select all focusable-by-tabbing elements
        return this._root.querySelectorAll('button, [tabindex]:not([tabindex="-1"]), input, select, textarea, a[href]');
    }


    _trapFocus = (evt) => {          // Focus trap -- make sure tabbing won't jump outside of dialog
        const f = this._focusable();
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

    _onSubmit = (evt) => {
        evt.preventDefault();
        for (const btnLabel in this._buttons) {
            const val = this._buttons[btnLabel];
            if (val == true) {
                const el = document.getElementById("btnId_" + btnLabel);
                el.click();
            }
        }
    };

    constructor(opts = {}) {
        if (opts.preRun)   { this.preRun   = opts.preRun;   }
        if (opts.postRun)  { this.postRun  = opts.postRun;  }
        if (opts.onButton) { this.onButton = opts.onButton; }
        if (opts.onClose)  { this.onClose  = opts.onClose;  }
    }
}
export { DFDialog };

 
async function _loadStyle(styleId, idx, style) {    // idx is only for errormsgs
    const isBlock = /^\s*<style[\s>][\s\S]*<\/style>\s*$/i.test(style.trim()); //true if valid  "<style></style>"  else false=assume filepath
      if (!isBlock) {
        const response = await fetch(style);
        if (!response.ok) {
            console.warn(`Failed to download styles[${idx}] (${style}) as a css file`);
            return;                             // fail silently (std practice in webpages)
        }
        style = "<style>" + await response.text() + "</style>";
    }

    let el = document.createElement("div");     // first load and validate the form
    el.innerHTML = style;
    el = el.firstElementChild;
    if (!el || el.tagName != "STYLE") {
        console.warn(`Parameter {styles:[${idx}]} missing outermost <style></style> element`);
        return;
    }
    el.dataset[styleId] = "";                    // content is irrelevant,  that it exists is all that matters
    document.head.appendChild(el);               // stick it in!
}
