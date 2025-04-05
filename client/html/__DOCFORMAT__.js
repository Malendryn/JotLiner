
let doc = `
VER;0.1.0;              // create a VER component <type -1> which is lowlevel, handles next value (1.0.0) as a version # of the document;
BOX;20;20;-40;-40;3;    // create a BOX component <type -1> which is lowlevel, autoread XYWH, having the next 3 components belonging to it;
    TXT;20;20;100;30;6;IAm000    // create a TXT component <type 1>, autoread XYWH, then numBytes raw, then raw="IAm000" ;
    BOX;40;50;200;200;2;             // create a BOX component at XYWH having 2 subcomponents;
        TXT;-10;10;100;30;10;IAm001_000 // create a TXT component...;
        TXT;110;50;100;36;10;IAm001_001 // create another TXT component...;
    TXT;240;240;100;30;6;IAm001    // stepout of box (consumed 2 els) and add another TXT component to the outer box;
`;
export { doc };
`
    any element read with readNext():
        EG: "BOX;"   "  100;"   "300  ;" -- can have whitespace before and/or after it
        EG: "  //  note  ;" (starts with // and ends with ;) is a multiline-capable comment and is discarded (largely for my own debugging!)

    ALL DocComponents begin as follows:
        NAME;X;Y;W;H;

    after that much, what follows depends on the type of component being loaded
        type=-1 are LOWLEVEL class objects that get X;Y;W;H; read by the system but must then parse the rest of the data themselves CAREFULLY
                (type=-1 means they follow very strict parsing rules and have direct access to the entire following stream!)
                (these classes must have a parse() function that expects a StreamReader() )
        type=1  objects get X;Y;W;H;Bytect;Bytes read by the system, and Bytes is then sent to the objects parse() function, having no further access to the source stream
                    (these classes must have a parse() function that expects a string/blob)


breakdown:
VER;1.0.0;      // doc version, all docs must start with this!
BOX;        // begin of a DocumentComponent
    20;20;510;20;   // the X;Y;W;H of the component (in pixels relative to its parent) -- ALL components must have this
    3;              // <BOXcomponent specific>: the next 3 DocumentComponents are children of this box
TXT;        // begin of a DocumentComponent  (first child of BOX)
    100;100;100;100;    // the X;Y;W;H of the component (in pixels relative to its parent) -- ALL components must have this
    6;IAm000        // <type= >0 positive specific> the length of binary data, and the binary data 'IAm000'
 ...etc...
`;
