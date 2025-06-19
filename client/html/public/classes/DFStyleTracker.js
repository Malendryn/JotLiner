/*!
 * DFStyleTracker.js
 * Copyright (c) Malendryn Tiger (Ron Stanions @ DragonsFire Creations)
 *
 * This software is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the License at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/
/*
how can we write a generic tracker for something, in this case we're talking about a style loader/unloader
*/

/*
usage:
    let x = new DFStyleTracker();
    let el = document.createElement("div");
    let style =  "<style>body { background-color: red; }</style>";

    console.log(await x.add(el, style));  // adds style; logs 1  -- first time called with this el and this style
    console.log(await x.add(el, style));  // skips add;  logs 1  -- adding same style to same el does not add twice

    el = document.createElement("div");

    console.log(await x.add(el, style));  // adds style; logs 2  -- el changed so returns new entry id

    console.log(await x.remove(1));  // logs 1;  -- reduces count, returns 1 count remaining
    console.log(await x.remove(1));  // logs 0;  -- reduces count to 0, removes style, returns 0 remaining
    console.log(await x.remove(1));  // logs -1; -- entry already removed/never existed
    console.log(await x.remove(2));  // logs 0;  -- reduces count to 0 (diff el was passed so diff tracker), returns 0 remaining

*/

import { DFSingleFire } from "./DFSingleFire.js"

class DFStyleTracker {
    constructor() {
        this.sf = new DFSingleFire();
    }
    async add(target, style) {
        return await this.sf.add({target,style}, this._add, this._remove);
    }

    async remove(id) {
        return await this.sf.remove(id);
    }

    async removeAll() {
        await this.sf.removeAll();
    }

    async _add(payload) {
        let style = payload.style;
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
        el.dataset["__df_st_id"] = payload.__DFId.toString();     // content is irrelevant,  that it exists is all that matters
        payload.target.appendChild(el);          // stick it in!
    }

    async _remove(payload) {
        const match = payload.target.querySelector(`[data-__df_st_id="${payload.__DFId}"]`);     // find first match under target
        match.remove();
    }
}

/* test
let x = new DFStyleTracker();
let el = document.createElement("div");
let style =  "<style>body { background-color: red; }</style>";

console.log(await x.add(el, style));  // adds style; logs 1  -- first time called with this el and this style
console.log(await x.add(el, style));  // skips add;  logs 1  -- adding same style to same el does not add twice

el = document.createElement("div");

console.log(await x.add(el, style));  // adds style; logs 2  -- el changed so returns new entry id

console.log(await x.remove(1));  // logs 1;  -- reduces count, returns 1 count remaining
console.log(await x.remove(1));  // logs 0;  -- reduces count to 0, removes style, returns 0 remaining
console.log(await x.remove(1));  // logs -1; -- entry already removed/never existed
console.log(await x.remove(2));  // logs 0;  -- reduces count to 0 (diff el was passed so diff tracker), returns 0 remaining
/**/