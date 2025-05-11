/*
-------- openPopup(form, dict, callback, preRun=null, async postRun=null)    Generic popup handler  (see fem_core_PopupDialog.js for instrux)
            form ---------------------- "<form><input name="myInput">...</form>" 
            dict=[dictKey: value] -----	sets formfields with <name="dictKey"> form fields to 
        T/F=callback(dict)              dict=null if [cancel] else fieldvals if [save], return true=done/false keeps dialog open
            preRun is a Non-ASYNC callback that recieves <form> element right after being created, populated and displayed
                so if user wants to add listeners or other things here is how to do it
                (it is STRONGLY advised that you add listeners using FF.addTrackedListener and not addEventListener, so that the popup can
                 safely remove any listeners added before closing)
            postRun is an ASYNC/AWAITed callback called right after removeAllSysCallbacks() but before detaching form.
*/

let startX, startY, origLeft, origTop, isDown = false;
function onPopMouseDown(evt) {
    if (evt.target.id == "hrDragBar") {
        startX = FG.kmStates.clientX;
        startY = FG.kmStates.clientY;
        const el = document.getElementById("popupForm");
        origLeft = FF.parseIntFromStyle(el.style.left);
        origTop  = FF.parseIntFromStyle(el.style.top);
        isDown = true;
    }
}
function onPopMouseMove(evt) {
    if (isDown) {
        let deltaX = FG.kmStates.clientX - startX;
        let deltaY = FG.kmStates.clientY - startY;
        const el = document.getElementById("popupForm");
        el.style.left = (origLeft + deltaX) + "px";
        el.style.top  = (origTop  + deltaY) + "px";
    }
}
function onPopMouseUp(evt) {
    isDown = false;
}
function preventSubmit(evt) {
    evt.preventDefault();
    evt.stopPropagation();
}
FF.openPopup = function (formContent, dict, callback, preRun=null, postRun=null) {
    let form = document.getElementById("popupForm");
    if (form) {
        return;     // someone already has a popup open
    }
    form = document.createElement("form");
    form.id = "popupForm";
    FF.addTrackedListener(form, "submit", preventSubmit);
    form.style.position = "absolute";
    form.style.border = "1px solid black";
//        form.style.zIndex = "999999999";
    form.style.display = 'block';           // Show the custom menu
    form.style.padding = "8px";
    form.style.minWidth = "200px";          // prevent form from being too thin so the cancel/save buttons get crunched
    form.style.backgroundColor = "lightgrey";
    let txt = `
<table>
    <tr>
        <td><!-- this is where the event actually arrives -->
            <hr id="hrDragBar" style="border:none;margin-top:0px;height:4px;background:none;border-top:1px dashed #808080;border-bottom:1px dashed #808080">
        </td>
    </tr>
    <tr>
        <td>
            ${formContent}
        </td>
    </tr>
    <tr>
        <td style="text-align:right;padding-top:8px;">
            <button id="_btnNo"  type="button" style="left:16px; bottom:12px;">Cancel</button><!-- type="button" prevents submit-on-enter -->
            <button id="_btnYes" type="button" style="right:16px; bottom:12px;">Save</button>
        </td>
    </tr>
</table>`;
    form.innerHTML = txt;

    document.body.appendChild(form);            // menu is built, we can attach it now!
    let rect = form.getBoundingClientRect();    // once attached, fetch its shape
    
    form.style.left = parseInt((document.body.clientWidth  - rect.width) / 2) + "px";
    form.style.top  = parseInt((document.body.clientHeight - rect.height) / 2) + "px";

    for (let key in dict) {
        let el = document.querySelector(`[name="${key}"]`);
        el.value = dict[key];
    }

    let el = document.getElementById("_btnNo");
    FF.addTrackedListener(el, "click", onClickNo);
    el = document.getElementById("_btnYes");
    FF.addTrackedListener(el, "click", onClickYes);
    FG.kmStates.modal = true;

    document.addEventListener("mousedown",   onPopMouseDown);
    document.addEventListener("mousemove",   onPopMouseMove);
    document.addEventListener("mouseup",     onPopMouseUp);

    async function cleanup() {    
        document.removeEventListener("mouseup",     onPopMouseUp);
        document.removeEventListener("mousemove",   onPopMouseMove);
        document.removeEventListener("mousedown",   onPopMouseDown);
    
        FF.removeAllTrackedListeners(form);

        if (postRun) {
            await postRun(form);
        }
        document.body.removeChild(form);
        FG.kmStates.modal = false;
    }
    async function onClickNo(evt) {
        evt.preventDefault();
        evt.stopPropagation();

        if (await callback(null) == false) {
            return;
        }
        cleanup();
    }
    async function onClickYes(evt) {
        evt.preventDefault();
        evt.stopPropagation();
        let formData = new FormData(form);
        let dict = {};
        for (let [name, value] of formData.entries()) {
            dict[name] = value;
        }
        if (await callback(dict) == false) {
            return;
        }
        cleanup();
    }

    if (preRun) {
        preRun(form);
    }
}

