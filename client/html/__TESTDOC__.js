
let doc1 = `
1.0;    // indicates major.minor version of entire doc;

// example multiline comment, be careful not to use a semicolon 
   inside the comment as that will terminate the comment!
and we end the comment with a semicolon;

BOX;L20;T20;R20;B20;4;    // create a BOX component (hasDiv=Y -> create div, reads X,Y,W,H, (hasChunk=N -> read 4, (has 4 following components are children));
    TXA;L20;T20;W100;H30;6;IAm000    // create a TXA component <type 1>, autoread X,Y,W,H, then numBytes raw, then raw="IAm000" ;
    BOX;L40;T60;W200;H200;2;             // create a BOX component at XYWH having 2 subcomponents;
        TXA;R10;B10;W100;H30;10;IAm001_000 // create a TXA component...;
        TXA;L110;T50;W100;H36;10;IAm001_001 // create another TXA component...;
    CTE;W160;H100;R20;B20;6;IAm002      // a 'contenteditable' div;
    TXA;L260;W240;W100;H30;6;IAm001    // stepout of box (consumed 2 els) and add another TXA component to the outer box;
`;

export { doc1 as doc };

`
file format 1.0 rules:
* very first item must be "n.n;" which is major.minor version of document
* very next item is a "BOX;" which acts as a container for all other toplevel elements and is automatically generated
    with XYWH = 0;0;-0;-0 whenever a new document is created (the '-0' is recognized properly to mean right=0 bottom=0)

* any components that are to be versioned must put their own vernum within their datastreams!
    (the component must then be able to handle its own upgrading as well!)
* all elements of a doc are of the format " xyz ;" where ';' is a terminator EXCEPT FOR chunks!  (see below for chunks)
* any non-chunk element can have whitespace that is trimmed off when the element is parsed
    EG: "BOX  ;  100;  1 2 3  ;" -- demonstrates 3 elements that get trimmed as follows
        "BOX  ;"                 -- "BOX"    -- whitespace after "BOX" but before ';' is trimmed off
              "  100;"           -- "100"    -- whitespace before "100" is trimmed off
                    "  1 2 3  ;" -- "1 2 3"  -- whitespace before and after "1 2 3" is trimmed off, but not the whitespace in the middle
* any element that (after trimming) starts with // is a comment and is ignored! (used primarily for debugging purposes)
    EG: "  //  note  ;" (starts with // and ends with ; and after trimming is "//  note") is a multiline-capable comment and is discarded

* ALL DocComponents in this file begin and load as follows:
    NAME;
        NAME = the name of the DocComponentHandler to load, EG BOX(div with children), TXA(textarea), etc.
            the system looks in "modules/DocComponentHandlers" for a file named "dch_NAME.js" and loads it
            then calls DCH_BASE.create() to create and init it
        then IF the created component (lets call it dch)...
         ...has dch.hasDiv = true... (a value hardcoded into the handler class in the .js file)
             ...then 4 more elements X;Y;W;H; are read from the document stream:
                X Y W H are the left, top, width, height of onscreen element (in pixels)
                    W and H can be negative which changes -W from width to right and -H from height to bottom

        NEXT, IF dch.hasChunk = true... (hardcoded in the class)
                ...read "N;" from stream as number of bytes in chunk
                ...readChunk of (N) bytes
                pass this chunk as a new StreamReader into dch.loadDoc()
              ELSEIF dch.hasChunk = false...
                pass the main document StreamReader into dch.loadDoc() instead of an encapsulated chunk
                     (this handler now has direct access to remaining document stream, be careful!)
`;
