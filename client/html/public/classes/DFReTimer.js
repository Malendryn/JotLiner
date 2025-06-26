/*!
 * DFReTimer.js
 * Copyright (c) Malendryn Tiger (Ron Stanions @ DragonsFire Creations)
 *
 * This software is licensed under the GNU Affero General Public License v3.0.
 * You may obtain a copy of the License at https://www.gnu.org/licenses/agpl-3.0.html
 *
 * This program is distributed WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
*/


/*
A reentrant timer that resets every time its called with a new delay
*/
export class DFReTimer  {
    constructor(callback, payload=undefined) {
        this._callback = callback;
        this._payload  = payload;
    }

    setTime = (time) => {                 // set by clock time  (in millis from epoch)
        this._process(time);
    }

    setDelay = (delay) => {               // set by delay (in millis)
        this._process(Date.now() + delay);
    }

    async flushAll() {
        this.setDelay(0);                 // fire anything in the queue immediately
        await this._deadlock(); 
    }

    cancel = async() => {
        if (this._lastTimeoutId > 0) {    // kill any current running timer
            clearTimeout(this._lastTimeoutId);
            this._lastTimeoutId = 0;
        }
        await this._deadlock();           // if anything is in proc, wait for it
    }


    _deadlock = async () => {               // waitfor timer to expire (and callback to be made if any timer was active)
        return new Promise((resolve,reject) => {
            const id = setInterval(() => {  // loop-and-wait for _inCallback to clear
                if (!this._inCallback) {
                    clearInterval(id);
                    resolve();
                    return;
                }
            }, 0);
        });
    };

    _process(time) {
        setTimeout(async () => {
            await this.cancel();             // cancel any pending timeouts but deadlock if in a callback
            let span = time - Date.now();     // trace("span=" + span, "key=",this.keys[0]);
                if (span < 0) {
                    span = 0;
                }
                this._lastTimeoutId = setTimeout( async () => {
                    await this._procIt(this._payload);
                    // this._inCallback = true;
                    // await this._callback(this._payload);
                    // this._inCallback = false;
                }, span);
            }
            // if (!this._inCallback) {     // prevents recursion
            //     await this.cancel();
            //     const span = time - Date.now();              //FF.trace("span=" + span, "key=",this.keys[0]);
            //     if (span <= 0) {           // ready to fire!
            //         await procIt(this._payload);
            //         // this._inCallback = true;
            //         // await this._callback(this._payload);
            //         // this._inCallback = false;
            // } else {                // else start a timeout of 'span' millis
            //         this._lastTimeoutId = setTimeout( async () => {
            //             await procIt(this._payload);
            //             // this._inCallback = true;
            //             // await this._callback(this._payload);
            //             // this._inCallback = false;
            //         }, span);
            //     }
            // }
        , 0);
    }

    _procIt = async(payload) => {  // wrapped in try/catch block to guarantee this._inCallback gets set properly always
        let err;
        this._inCallback = true;
        try {
            await this._callback(this._payload);
        }
        catch (error) {
            err = error;
        }
        this._inCallback = false;
        if (err) {
            trace(err.message);
            throw err;
        }
    };

    _lastTimeoutId = 0;
    _inCallback = false;
}

