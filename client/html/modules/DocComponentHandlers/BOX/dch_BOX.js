
class DCH_BOX extends FG.DCH_BASE {
    __children = [];      // changing to [] to allow children

    static menuText    = "Box container";
    static menuTooltip = "A rectangle that other editor can be put inside of";

    zX = 0;            // how far ALL children are shifted to give the appearance of infinite canvas
    zY = 0;

    async construct() {
        // most styles are now in the DCH_BOX.css file
        this.__sysDiv.classList.add("DCH_BOX");
        this.host.style.left   = "0px";   // host always sizes to match __sysDiv
        this.host.style.top    = "0px";
        this.host.style.right  = "0px";
        this.host.style.bottom = "0px";
    }

    async destruct() {
        for (let idx = this.__children.length - 1; idx >= 0; idx--) {     // destroy them (in reverse order cuz 'parent.splice()'
            const child = this.__children[idx];
            await child.destroy();          // does the .splice() of my .__children internally so don't do it here!
            // this.__children.splice(idx, 1);
        }
    }

    async importData(data) {    // populate this component with data
        if (Object.keys(data).length > 0) {     
            this.zX      = parseInt(data.zX);       // how far all children are shifted over to give the infinite canvas illusion
            this.zY      = parseInt(data.zY);
        }
    }

    async exportData() {       // return data to be preserved/exported as a {}
        return {
            zX: this.zX.toString(),
            zY: this.zY.toString(),
        };
    }


    async update() {    // walk children to get bounding box size, then deal with zX zY etc...
        if (!this.__children.length) {  // no children?  no update!
            return false;
        }
// console.log(FF.__FILE__(), ".update() .update() .update() .update() .update() .update() .update() .update() ");
// return;
        // const parentBox = this.__sysDiv.getBoundingClientRect();     // only care about width/height to fit all children in
        // const scrollBox = {
        //     // x: 0,
        //     // y: 0,
        //     x:       9999999999,      // startat rediculously high num guaranteed to be reduced to reason
        //     y:       9999999999,
        //     // width:  -9999999999,
        //     // height: -9999999999,
        //     width:  parentBox.width,    // startat w/h=parentSiz as min boundingBox size
        //     height: parentBox.height,
        // };

        for (let idx = 0; idx < this.__children.length; idx++) {        // get the bounding box around all children
            const child = this.__children[idx];
            child.__sysDiv.style.transform = "translate(" + this.zX + "px," + this.zY + "px)";
            // const box = child.__sysDiv.getBoundingClientRect();
            // box.x = box.x - parentBox.x;
            // box.y = box.y - parentBox.y;
            // if (box.x < scrollBox.x) { scrollBox.x = box.x; }
            // if (box.y < scrollBox.y) { scrollBox.y = box.y; }
            // if (box.x + box.width > scrollBox.width) { scrollBox.width = box.x + box.width; }
            // if (box.y + box.height > scrollBox.height) { scrollBox.height = box.y + box.height; }
        }
// scrollBox is now bounding box of all children BEFORE adjusting, with w/h set minimum to same as parent
// if x or y are negative we have to shift them to zero and shift all other children over by that much too
// ...and then add that shift to .zX/Y too

// no wait, we DONT shift .zX/Y AT ALL cuz that's now our scrollbar, and we only shift all boxes when mode2! 
// ...this could get tricky with R/B anchoring as the 'concept' is kinda getting lost in the mire, but we NEED R?B anchoring
// for things to grow/shrink along with their parents! 

        // let shiftX = 0, shiftY = 0;
        // if (scrollBox.x < 0) {         // if boxPos still <0,  set shiftAmt & addTo .zX/Y
        //     shiftX = -scrollBox.x;         // get how much we shifted
        //     scrollBox.x += shiftX;         // shift the box to xy=0/0  // (shiftX/Y will never be negative at this point)
        //     scrollBox.width += shiftX;     // expand w/h too so scrollbar grows to match
        //     this.zX += shiftX;             // add to any shift already present
        // }
        // if (scrollBox.y < 0) {
        //     shiftY = -scrollBox.y;
        //     scrollBox.y += shiftY;
        //     scrollBox.height += shiftY;
        //     this.zY += shiftY;
        // }

        // if shiftX/Y are positive, we have to shift all children over by that much

        // else if no shift, check if .zX/Y shifted and if so and boxX/Y > .zX/Y shift to decrease the negativity

//// RSNOTE THE FOLLOWING CODE WORKS BUT! if scrollbar is moved this mucks with the visual when a dch is moved to LESSEN zX/Y
//// thereby causing the scrollRegion to shrink (and because bar is moved elements on the screen now move too)
//// **This is ONLY an issue if scrollbar is not at 0!***
//// since we did away with scrollbars this code SHOULD NOW BE OBSOLETE
        // if (shiftX == 0) {                         // ELSE if no shift detected... 
        //     if (scrollBox.x > 0 && this.zX > 0) {    // ...AND scrollBox.x AND .zX are > 0...
        //         shiftX = -Math.min(this.zX, scrollBox.x);// - this.zX); // shift LEFT (noMoreThan .zX) (shiftX now neg)
        //         this.zX += shiftX;                                   // reduce .zX to match
        //         scrollBox.width += shiftX;                           // reduce scrollWidth by this much too
        //     }
        // }
        // if (shiftY == 0) {                              // now do the same for Y
        //     if (scrollBox.y > 0 && this.zY > 0) {
        //         shiftY = -Math.min(this.zY, scrollBox.y);// - this.zY);
        //         this.zY += shiftY
        //         scrollBox.height += shiftY;
        //     }
        // }
// END obsolete

//         const origHW = parseInt(this.host.style.width);
//         const origHH = parseInt(this.host.style.height);
//         this.host.style.width = scrollBox.width + "px";    // set sizeof host so __scroll shows scrollbars
//         this.host.style.height = scrollBox.height + "px";

//         if (origHW != scrollBox.width) {
//             console.log("scrollBox width changed: OrigHW=", origHW, ",  new=", scrollBox.width)
//         }
//         if (shiftX || shiftY) { // if SOMEthing has shifted the scrollbox!
//             for (let idx = 0; idx < this.__children.length; idx++) {        // get the bounding box around all children
//                 const child = this.__children[idx];
//                 const el = child.__sysDiv;
//                 // FF.moveDivRelative(el, shiftX, shiftY);
// console.log(FF.__FILE__(), "replacement FF.moveDivRelative to figure out logic error of scrollHost");
//                 const rect = FF.getRawRect(child.__sysDiv);
//                 if (rect.lrMode.includes("L")) { el.style.left   = (rect.L + shiftX) + "px"; }
//                 if (rect.lrMode.includes("R")) { el.style.right  = (rect.R - shiftX) + "px"; }
//                 if (rect.tbMode.includes("T")) { el.style.top    = (rect.T + shiftY) + "px"; }
//                 if (rect.tbMode.includes("B")) { el.style.bottom = (rect.B - shiftY) + "px"; }
//             }
//             return true;
//         }
//         return false;
     }
};
export { DCH_BOX as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH
