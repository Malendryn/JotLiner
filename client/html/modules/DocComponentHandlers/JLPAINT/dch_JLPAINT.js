
const html = `
<div class="controls">
    <label>
        Color:
        <input type="color" id="colorPicker" value="#000000">
    </label>
    <label>
        Brush size:
        <input type="range" id="brushSize" min="1" max="20" value="2">
    </label>
    <button id="clearCanvas">Clear</button>
    <button id="saveCanvas">Save as PNG</button>
  </div>`;

  import { DCH_BASE } from "/modules/classes/class_DCH_BASE.js";

  class DCH_JLPAINT extends DCH_BASE {
    static pluginName  = "Simple Painter Plugin";
    static menuTooltip = "A basic painting node for learning how to make your own plugins";

    hasToolbar = true;  // without this the class would have no toolbar!

    canvas;         // handle to <canvas> DOMelement
    ctx;            // handle to canvas 2dContext
    colorPicker;    // handle to <input id="colorPicker">
    brushSize;      // handle to <input id="brushSize">
    painting;       // T/F state of whether mouse is down for painting or not
    oldcvW;oldcvH;  // 'old canvas Width/Height

    async construct() {
        this.loadStyle("dch_JLPAINT.css");        // Load in our companion .css file

        this.toolbar.innerHTML = html;
        this.canvas = document.createElement("canvas");    // Create our painting canvas and add it to .host

        this.host.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.clearCanvas();

        this.oldcvW = this.host.clientWidth;    // onResize needs these set first
        this.oldcvH = this.host.clientHeight;
        this.onResize();            // kickoff initial canvas sizing
        this.colorPicker = document.getElementById('colorPicker');
        this.brushSize = document.getElementById('brushSize');
        this.painting = false;

        this.tracker.add(this.canvas, 'mousedown', this.startPainting);  // this.tracker automatically removes these when the plugin is destroyed
        this.tracker.add(this.canvas, 'mouseup',   this.stopPainting);
        this.tracker.add(this.canvas, 'mouseout',  this.stopPainting);
        this.tracker.add(this.canvas, 'mousemove', this.draw);
        let el = document.getElementById("clearCanvas");
        this.tracker.add(el, 'click', this.clearCanvas);
        el = document.getElementById("saveCanvas");
        this.tracker.add(el, 'click', this.saveCanvas);
    }
    
    async importData(data) {    // populate this component with data
        const blob = new Blob([data["PNG"]], { type: 'image/png' });
        const bitmap = await createImageBitmap(blob);
        this.canvas.width = bitmap.width;
        this.canvas.height = bitmap.height;
        this.ctx.drawImage(bitmap, 0, 0);
    }

    async exportData() {       // return data to be preserved/exported as a {}
        return new Promise((resolve) => {
            this.canvas.toBlob(async (blob) => {
                const arrayBuffer = await blob.arrayBuffer();
                const byteArray = new Uint8Array(arrayBuffer);
                resolve({"PNG" : byteArray});
            }, 'image/png');
        });
    }

    startPainting = (evt) => {
        this.painting = true;
        this.draw(evt);
    }

    stopPainting = () => {
        if (this.painting) {
            this.painting = false;
            this.ctx.beginPath(); // resets path to avoid unwanted lines
            FF.autoSave();
        }
    }

    draw = (evt) => {
        if (!this.painting) {
            return;
        }

        const rect = this.canvas.getBoundingClientRect();
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;

        this.ctx.lineWidth = this.brushSize.value;
        this.ctx.lineCap = 'round';
        this.ctx.strokeStyle = this.colorPicker.value;

        this.ctx.lineTo(x, y);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
    }

    clearCanvas = () => {
        this.ctx.fillStyle = "white";
        this.ctx.fillRect(0,0, this.canvas.width, this.canvas.height);
    }

    saveCanvas = () => {
        const link = document.createElement('a');
        link.download = 'drawing.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
      
    onResize = (canvas, newWidth, newHeight) => {
        const tempCanvas = document.createElement('canvas');  // Step 1: Save current content
        tempCanvas.width = this.oldcvW;
        tempCanvas.height = this.oldcvH;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.drawImage(this.canvas, 0, 0);

        this.canvas.width = this.host.clientWidth;            // Step 2: Resize (this clears it) 
        this.canvas.height = this.host.clientHeight;

        this.ctx.drawImage(tempCanvas, 0, 0);                 // Step 3: Restore content
        this.oldcvW = this.canvas.width;
        this.oldcvH = this.canvas.height;
    }
};
export { DCH_JLPAINT as DCH };      // always export 'as DCH' so DCH_BASE can load-on-the-fly and attach to globalThis.DCH
