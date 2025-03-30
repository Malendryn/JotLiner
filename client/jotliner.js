// let el = document.getElementById("body");
// el.innerHTML = "foo";

// import { fileURLToPath } from 'url';
// import { dirname } from 'path';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

debugger

async function loadModule(modulePath) {
    try {
      const module = await import(modulePath); // Replace with your module path
      return module;
    } catch (error) {
      console.error('Failed to load module:', error);
    }
}


// RSTODO go look at the older jotliner code, we had detailed funcalls to handle loading and tracking and unloading modules that we NEED to move over to here!
window.addEventListener('load', async function() {
    console.log(this.document.baseURI);
    // const vv = await loadModule("./modules/core/csm_core_WebSocket.js");
    const qq = await loadModule("./modules/csm_txted.js");
    qq.myFunction();
    console.log(qq.myVariable);
});


console.log("foo");
