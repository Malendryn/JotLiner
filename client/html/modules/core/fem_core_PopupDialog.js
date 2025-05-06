
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

    form.innerHTML    = formContent + "<br><br><br>";   // add room for the cancel/save buttons

    document.body.appendChild(form);            // menu is built, we can attach it now!
    let rect = form.getBoundingClientRect();    // once attached, fetch its shape
    form.style.left = parseInt((document.body.clientWidth  - rect.width) / 2) + "px";
    form.style.top  = parseInt((document.body.clientHeight - rect.height) / 2) + "px";

    for (let key in dict) {
        let el = document.querySelector(`[name="${key}"]`);
        // let el = form.getElementsByTagName(key);
        el.value = dict[key];
    }

    let el1 = document.createElement("button");
    el1.type  = "button";
    el1.style.position = "absolute";
    el1.style.left   = "16px";
    el1.style.bottom = "12px";
    el1.innerHTML="Cancel";
    form.appendChild(el1);
    FG.kmStates.modal = true;

    let el2 = document.createElement("button");
    el2.type  = "submit";
    el2.style.position = "absolute";
    el2.style.right   = "16px";
    el2.style.bottom = "12px";
    el2.innerHTML="Save";
    form.appendChild(el2);

    async function onClickCancel() {
        if (await callback(null) == false) {
            return;
        }
        el1.removeEventListener("click", onClickCancel);
        if (postRun) {
            postRun(form);
        }
        document.body.removeChild(form);
        FG.kmStates.modal = false;
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
        el2.removeEventListener("click", onClickSave);
        if (postRun) {
            postRun(form);
        }
        document.body.removeChild(form);
        FG.kmStates.modal = false;
    }
    el1.addEventListener("click", onClickCancel);
    el2.addEventListener("click", onClickSave);
    if (preRun) {
        preRun(form);
    }
}

