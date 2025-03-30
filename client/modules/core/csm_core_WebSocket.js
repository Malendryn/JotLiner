debugger;

const socket = new WebSocket('ws://localhost:8888'); // Connect to your server


socket.onopen = () => {
    debugger;
    console.log('Connected to server');
    sendMessage("RSTODO testFoo");
};


socket.onmessage = (event) => {
    debugger;
    console.log("PktRcvd=", event.data);
};


socket.onclose = () => {
    debugger;
    console.log('Disconnected from server');
};


function sendPacket(packet) {
    debugger;
    socket.send(packet);
}
