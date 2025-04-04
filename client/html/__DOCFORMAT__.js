
let doc = `
BOX;20;20;510;20;3;             // create a box with 3 elements;
    TXT;100;100;100;100;6;IAm000    // junk! ;
    BOX;20;20;510;20;2;             // create a box with 2 elements;
        TXT;100;100;100;200;10;IAm001_000 // moreJunk! ;
        TXT;100;100;555;666;10;IAm001_001 // and even more junk;
    TXT;100;100;100;100;6;IAm001
`;

`
    any element ended with a ; can have whitespace before and after it (str.trim() cleans it off the begin and end but NOT the middle!)
    any element that starts with // and ends with ; is a comment and is discarded (largely for my own debugging!)

    all DocComponents are effectively BOXes with X;Y;W;H and other stuff so that part is autoloaded by the baseclass UNLESS overridden in the child class!

`;

`
type=-1 are LOWLEVEL class objects that get X;Y;W;H; read by the system but must then parse the rest of the data themselves CAREFULLY
           (type=-1 means they follow very strict parsing rules and have direct access to the entire following stream!)
           (these classes must have a parse() function that expects a StreamReader() )
type=1  objects get X;Y;W;H;Bytect;Bytes read by the system, and Bytes is then sent to the objects parse() function, having no further access to the source stream
            (these classes must have a parse() function that expects a string/blob)

breakdown:
BOX;20;20;510;20;3;  // creates a box with 3 elements and reads everything from this point forward and adds them to itself as children, up until its element count is satisfied;
TXT;100;100;100;100;6;IAm000 junk! =TXT;200;200;100;100;6;IAm001  this is junk
// read as an object by BASE but then given to BOX as children



BOX = name
100;100;100;100 = XYWH in pixels
3   = # of elements inside box
    <(>the box reader logic will now read and process the next 3 elements and claim them as its own>
`;



`Note that this is NOT INTENDED to be a human readable format! (Some aspects of it may be,  some will not!)
    ... (but I will try to make it text-view-friendly as much as possible)

new rule, 'junk of any kind immediately prior to the'-''+'or'=' is allowed
    this allows comments at end of line (that must not have - + or = in them!)
    and linefeeds as well

################################# HOWTO interpret the doc above ##################################3
=       what follows is a component (which will be a child of FG.content)
TXT;        the component is a DCH_TXT component (type1) 
<type1 components always have XYWH so we read that now>
    100;100;100;100;     X;Y;W;H in pixels (effectively absolute within its displaybox)
    6;                   # of bytes that follow that are handled by the DOC component (NOT counting the 5 OR the semicolon that follows!)
    IAM000               bytes delivered to DOC handler  (note there is no ; after bytes)
<at this point skip EVERY char that is not a +,-, or =>
=TXT;200;200;100;100;6;IAm001       ---- another TXT component at same level as prior component (EG: also a child of FG.content)
this is junk                        ---- ignored
+                                   ---- everything that follows is a child of the most recently loaded component (in this case TXT 'IAm001')
=TXT;100;100;100;200;10;IAm001_000  ---- another TXT component,  a child of TXT 'IAm001'
 moreJunk!                          ---- ignored
=TXT;100;100;555;666;10;IAm001_001  ---- another TXT component, also a child of TXT 'IAm001'
 and even more junk
-                                   ---- step up a level
=TXT;100;100;100;100;6;IAm002       ---- another TXT component, back to being a child of FG.content
`

doc = doc.trim();    // TESTONLY remove the whitespace at start and end, it's only there for example purposes
export { doc };

`
=   what follows is a component at the same level as any prior ones
+   what follows is a child of the most recent component
-   step back out of this level of components up to the prior level

so what if on each '+' we create a basic content wrapper which only knows parent and children[]
    then on each - we step out and go up one wrapper
    with this we can forgoe the '-' altogether as it always adds to the current wrapper
    but no WE NEED THE = cuz every object must start with +,-, or = so we can use the readCtl() concept everytime everywhere

the docs are what contain parent and children NOT the loader!
so at highest level FG.content = []


this=loader
    parent=null
    current = []
    found an =
        load the doc into my current []
    found a -
        if parent not null this=parent (go up a level)
        if parent null this is an error
    found a +
        create new loader
        set loaders parent to this
        add loader to current[]
        make this = loader
-------------------------------------------------------------------
FG.content = contentHandler1
                parent=null
                children=[box000, box001, + contentHandler2 -, box002]

    contentHandler2
        parent = contentHandler1
        children = [box001_000, box001_001]
-------------------------------------------------------------------
a handler is passed a <div> el which it should NOT be allowed to step outside of, and all its children should in turn have their own <div>s too
when a handler is going to render children it has to create a <div> and pass that to the object so the object can populate its children inside it

so when we see a + we create a contenthandler and call load() on it
when we see an = we add it as a child
when we see a - we return
`