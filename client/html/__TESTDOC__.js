
let doc1 = `
1.0;    // indicates major.minor version of entire doc;

// example multiline comment, be careful not to use a semicolon 
   inside the comment as that will terminate the comment!
and we end the comment with a semicolon;

BOX;4;L20;T20;R20;B20;5;    // create a BOX component with 4 <div> vals (LTRB) that consumes the next 4 handlers entirely;
    TXA;4;L20;T20;W100;H30;6;IAm000    // create a TXA component with 4 <div> vals (LTWH), then raw chunk "IAm000" ;
    BOX;4;L40;T60;W200;H200;2;             // create a BOX component at LTWH and consume the next 2 handlers;
        TXA;4;R10;B10;W100;H30;10;IAm001_000 // create a TXA component at RBWH...;
        TXA;4;L110;T50;W100;H36;10;IAm001_001 // create another TXA component...;
    BOX;4;W160;H100;R20;B20;0;      // a box containing no children;
    CTE;4;W160;H100;R20;B200;6;IAm002      // a 'contenteditable' div;
    TXA;4;L260;W240;W100;H30;6;IAm001    // stepout of box (consumed 2 els) and add another TXA component to the outer box;
`;

export { doc1 as doc };

`
file format 1.0 rules:
* data is always one of two forms.  either an 'element' or a 'chunk'
---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---
elements:
* all elements of a doc are of the format "xyz;" where ';' is a terminator
* elements element can begin or end with whitespace (before the ';' terminator) that is trimmed off when the element is parsed
    whitespace means spaces, tabs or linefeeds (CR and/or LF)
    EG: "BOX  ;  100;  1 2 3  ;" -- demonstrates 3 elements which, after trimming would become "BOX;100;1 2 3;"
        "BOX  ;"                 --> "BOX"
              "  100;"           --> "100"
                    "  1 2 3  ;" --> "1 2 3" (whitespace before and after "1 2 3" is trimmed off, but not the whitespace in the middle)
* any element that (after trimming) starts with // is a comment and is ignored! (used primarily for debugging purposes)
    EG: "  //  note //  ;"   after trimming --> "//  note //", which is a comment. (starts with //, the 2nd // is part of the same comment)
* since comments are simply treated as elements, they themselves cannot contain a ;  (currently \; and ;; are not recognized as skippers)
---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---
chunks
* chunks are always preceeded by an element which contains the number of bytes in the chunk
* chunks ARE NOT followed by a ';' as you can see in the example doc above
    EG: "6;IAM000" indicates there are 6 bytes in the chunk,  therefore the data of the chunk contains "IAM000"
* chunks are read by the handler that's requiring them, so there can be zero or multiple chunks at the discretion of the handler.
    EG: a box wi
---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---  ---
overall file format
* very first item must be "n.n;" which is major.minor version of document
* very next item must be a "BOX;" which loads the dch_BOX.js handler
* if the type of handler needs a div (which nearly 100% should!) then...
*     must be followed with any combination of 4 dimensions defining its size and position within its parent.
* everything after that is handled purely by the handler.

* ALL DocComponents in this file begin and load as follows:
    NAME;
        NAME = the name of the DocComponentHandler to load, EG BOX(div with children), TXA(<div> with a <textarea> in it), etc.
            the system looks in "modules/DocComponentHandlers" for a file named "dch_NAME.js" and loads it
            then calls DCH_BASE.create() to create and init it
        then IF the created component (lets call it dch)...
         ...has dch.hasDiv = true... (a value hardcoded into the handler class in the .js file)
             ...then read an element which indicates how many following elements mod the <div> of this element
        everything after that is read by the handler itself
`;
