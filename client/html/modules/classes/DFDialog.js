/*
class DFDialog
    Create a simple but powerful Dialog object with optional async/await callbacks

RSFUTURE RSADD RSTODO: open("form"...) or open({form:"form", style:"style"})  (allow both)

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


Functions within the class:
    open(form or {form,style}, dict, buttonDict = null)
            Open a dialog based on the parameters passed

        form
            form is either a string containing a complete "<form>...</form>" element, as text, or is a dict containing {form,style}
            which are form="<form>...</form>" and style="<style>...</style>".
            These will be parsed into DOM elements and displayed in the popup dialog. 
            Inside this text should be input fields, checkboxes, etc, with each element that will have any form of editable data a form
            can have. Each element that is to receive or submit data must have a name="..." attribute that will be populated automatically 
            via the data parameter, and by the preRun callback, before displaying the dialog.

        dict
            An object with multiple {"key": "value"} pairs, where for each "key", its "value" will get populated into the form's html
            element having a 'name="key"' attribute

        buttonDict 
            A {"key":true/false} object (or null) that will cause buttons to be displayed underneath the form, from left to right, in 
            the same order given.
            If null, then a default of { "Cancel": false,  "OK": true } is supplied

            key
                The text to show as the label on the button

            value
                A true or false value that decides if this button acts as the 'submit' button would in a standard <form>.
                Only one button in the dict should be set to true, but if more than one are, the first in the list will be chosen.
                Pressing enter will 'fire' the first button in the list with this value set to true.
                If all buttons have this value set to false, then pressing enter will have no effect at all.

        RETURNS:
            null if form could not be created, or a handle to the opened form

    close()
            Callable from within any callback or outside the dialog entirely through the handle returned via open(), to begin the dialog closing 
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
    async onButton(label, dict) { return true; }
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
    _buttons;   // set during open()
    _form;      // handle to the <form> passed in once converted to DOMelements
    static _defaultButtons = { "Cancel": false, "OK": true };

    async open(form, data, buttons = null) {
        let style = null;
        if (typeof form == "object") {  // assume if {} then it contains {form,style}, if "" it's just the "<form>" 
            style = form["style"] || null;
            form = form["form"];
        }
        this._form = document.createElement("div");     // first load and validate the form
        this._form.innerHTML = form;
        this._form = this._form.firstElementChild;
        if (!this._form || this._form.tagName != "FORM") {
            alert("'form' parameter missing outermost <form> element");
            return null;
        }
        this._form.addEventListener("submit", this._onSubmit);

        _loadCss();                 // load the DFDialog.css file
        if (!_loadStyle(style)) {   // load the passed-in <style> (if any)
            return null;
        }

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
        this._applyData(data);

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
        _loadStyle(null);

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


function _loadStyle(style) {     // style("<style>...</style>")=insert else null=remove
    let el = document.querySelectorAll('[data-dfdlgstyle]');
    for (const item of el) {     // SHOULD never be more than one, but since it returns a [] lets walk it!
        item.remove();
    }
    if (style) {
        el = document.createElement("div");              // first load and validate the form
        el.innerHTML = style;
        el = el.firstElementChild;
        if (!el || el.tagName != "STYLE") {
            alert("'style' parameter missing outermost <style> element");
            return false;
        }
        el.dataset.dfdlgstyle = "";        // don't care about value, only about existence
        document.head.appendChild(el);
    }
    return true;
}


