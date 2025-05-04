
FG.openPopup = function (left, top, width, height, formContent, dict, callback) {
    let form = document.getElementById("popupForm");
    if (form) {
        return;     // someone already has a popup open
    } else {
        form = document.createElement("form");
        form.id = "popupForm";
        form.style.position = "absolute";
        form.style.border = "1px solid black";
        form.style.zIndex = "999999999";
        form.style.display = 'block';           // Show the custom menu
        form.style.padding = "8px";
        form.style.backgroundColor = "lightgrey";
    }
    form.style.left   = left   + "px";
    form.style.top    = top    + "px";
    form.style.width  = width  + "px";
    form.style.height = (height + 40) + "px";
    form.innerHTML    = formContent;

    document.body.appendChild(form);             // menu is built, we can attach it now!
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
    function onClickCancel() {
        if (callback(null) == false) {
            return;
        }
        el1.removeEventListener("click", onClickCancel);
        document.body.removeChild(form);
    }
    el1.addEventListener("click", onClickCancel);

    let el2 = document.createElement("button");
    el2.type  = "submit";
    el2.style.position = "absolute";
    el2.style.right   = "16px";
    el2.style.bottom = "12px";
    el2.innerHTML="Save";
    form.appendChild(el2);

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
        document.body.removeChild(form);
    }
    el2.addEventListener("click", onClickSave);

}

