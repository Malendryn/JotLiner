
WS.__classes.GetDoc.prototype.process = function(ws) {    // must use function() to have a 'this'   (not () => )
    debugger;   

    this.doc = `
1.0;    // indicates major.minor version of entire doc;

// example multiline comment, be careful not to use a semicolon 
   inside the comment as that will terminate the comment!
and we end the comment with a semicolon;

BOX;4;L20;T20;R20;B20;5;    // create a BOX component with 4 <div> vals (LTRB) that consumes the next 5 handlers;
    TXA;4;L20;T20;W100;H30;6;IAm000    // create a TXA component with 4 <div> vals (LTWH), then raw chunk "IAm000" ;
    BOX;4;L40;T60;W200;H200;2;             // create a BOX component at LTWH and consume the next 2 handlers;
        TXA;4;R10;B10;W100;H30;10;IAm001_000 // create a TXA component at RBWH...;
        TXA;4;L110;T50;W100;H36;10;IAm001_001 // create another TXA component...;
    BOX;4;W160;H100;R20;B20;0;      // a box containing no children;
    CTE;4;W160;H100;R20;B200;6;IAm002      // a 'contenteditable' div;
    TXA;4;L260;T240;W100;H30;6;IAm001    // final component of the toplevel box;
`;
    return true;
}
