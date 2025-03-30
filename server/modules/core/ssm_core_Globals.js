
// SSM stands for 'Server Side Module
// SG stands for 'Server Globals'

// we directly connect it to globalThis here, 
// so we don't have to { G } then globalThis.G = G and have G-level confusion

export async function _init() {
    globalThis.SG = {
        dbRoot:      "",    // (/mnt/<loc>/<project>/db)
        wss:         null,  // WebSocketServer
    };
}