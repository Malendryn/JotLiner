
function onPopMouseDown(evt) {
    console.log("11111111111")
}
function onPopMouseMove(evt) {
    console.log("22222222")
}
function onPopMouseUp(evt) {
    console.log("3333333333")
}
FF.openPopup = function (formContent, dict, callback, preRun=null, postRun=null) {
    let form = document.getElementById("popupForm");
    if (form) {
        return;     // someone already has a popup open
    }
    form = document.createElement("form");
    form.id = "popupForm";
    form.style.position = "absolute";
    form.style.border = "1px solid black";
//        form.style.zIndex = "999999999";
    form.style.display = 'block';           // Show the custom menu
    form.style.padding = "8px";
    form.style.minWidth = "200px";          // prevent form from being too thin so the cancel/save buttons get crunched
    form.style.backgroundColor = "lightgrey";

    form.innerHTML = '<hr id="hrDragBar" style="border:none;margin-top:0px;height:4px;background:none;border-top:1px dashed #808080;border-bottom:1px dashed #808080">'
                   + formContent
                   + "<br><br>";   // adds room for the cancel/save buttons at the bottom

    document.body.appendChild(form);            // menu is built, we can attach it now!
    let rect = form.getBoundingClientRect();    // once attached, fetch its shape
    
    form.style.left = parseInt((document.body.clientWidth  - rect.width) / 2) + "px";
    form.style.top  = parseInt((document.body.clientHeight - rect.height) / 2) + "px";

    for (let key in dict) {
        let el = document.querySelector(`[name="${key}"]`);
        // let el = form.getElementsByTagName(key);
        el.value = dict[key];
    }

    const el1 = document.createElement("button");
    el1.type  = "button";
    el1.style.position = "absolute";
    el1.style.left   = "16px";
    el1.style.bottom = "12px";
    el1.innerHTML="Cancel";
    form.appendChild(el1);
    FG.kmStates.modal = true;

    const el2 = document.createElement("button");
    el2.type  = "submit";
    el2.style.position = "absolute";
    el2.style.right   = "16px";
    el2.style.bottom = "12px";
    el2.innerHTML="Save";
    form.appendChild(el2);

    el1.addEventListener("click", onClickCancel);
    el2.addEventListener("click", onClickSave);

    const hr = document.getElementById("hrDragBar");
    hr.addEventListener("mousedown",   onPopMouseDown, true);    // listen for mouseup/down/move ANYwhere on doc
    hr.addEventListener("mousemove",   onPopMouseMove, true);
    hr.addEventListener("mouseup",     onPopMouseUp,   true);

    async function cleanup() {
        hr.removeEventListener("mousedown",   onPopMouseDown);    // listen for mouseup/down/move ANYwhere on doc
        hr.removeEventListener("mousemove",   onPopMouseMove);
        hr.removeEventListener("mouseup",     onPopMouseUp);
        el1.removeEventListener("click", onClickCancel);
        el2.removeEventListener("click", onClickSave);

        if (postRun) {
            postRun(form);
        }
        document.body.removeChild(form);
        FG.kmStates.modal = false;
    }
    async function onClickCancel() {
        if (await callback(null) == false) {
            return;
        }
        cleanup();
    }
    async function onClickSave(evt) {
        evt.preventDefault();
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

