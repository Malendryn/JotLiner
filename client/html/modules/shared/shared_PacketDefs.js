FG.__PacketClasses = {};    // these HAVE to go on FG cuz they get lost when we exit loadModule
FG.__nextNewPacketID = 1;

FF.makePacket = function(name)  {
    const pkt = new FG.__PacketClasses[name](); // DO NOT set __id in 'new' cuz .parsePacket doesnt need a new __id
    pkt.__id = FG.__nextNewPacketID++;          // set and increment it here, instead
    return pkt;
}

FF.parsePacket = function(stream) {         // decode "className|{dict}" into actual packet
    const idx = stream.indexOf('|');
    const name = stream.substring(0, idx);
    const tmp = stream.substring(idx + 1);
    const dict = JSON.parse(tmp);
    const pkt = new FG.__PacketClasses[name]();
    Object.assign(pkt, dict);
    return pkt;
}


class PacketBASE {
    __id;       // uniquely generated number used for packets expecting a response

    send() {                // send packet without expecting any response
        const stream = JSON.stringify(this);
        FG.sendWS(this.constructor.name + "|" + stream);
    }

    sendExpect(callback) {          // send packet and expect a response, fire callback when it comes
        debugger;
    }

    async sendWait() {              // send packet and await a response
        debugger;
    }
};


//                 v--this--v mustMatch v--this--v
FG.__PacketClasses.PacketTest  = class  PacketTest extends PacketBASE {   // <-- sample of how to define a packet for xmission
};
