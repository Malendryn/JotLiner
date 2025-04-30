


let tmp = document.getElementById("divIndexView");
tmp.innerHTML = `
<button>Add Entry</button>
<ul id="divIndexViewUL">
<!--                     indent spacer                  arrow-if-children                  text to display -->
    <li id="01" draggable="true"><div style="width: 0px;"></div><div style="width:16px;">&gt;</div>Section 1</li>
    <li id="02" draggable="true"><div style="width:16px;"></div><div style="width:16px;">    </div>Subsection 1.1</li>
    <li id="03" draggable="true"><div style="width:16px;"></div><div style="width:16px;">    </div>Subsection 1.2</li>
    <li id="04" draggable="true"><div style="width:16px;"></div><div style="width:16px;">&gt;</div>Subsection 1.3</li>
    <li id="05" draggable="true"><div style="width:32px;"></div><div style="width:16px;">    </div>Sub-subsection 1.3.1</li>
    <li id="06" draggable="true"><div style="width:32px;"></div><div style="width:16px;">    </div>Sub-subsection 1.3.2</li>
    <li id="07" draggable="true"><div style="width:32px;"></div><div style="width:16px;">&gt;</div>Sub-subsection 1.3.2</li>
    <li id="08" draggable="true"><div style="width:48px;"></div><div style="width:16px;">    </div>Subsection 1.3.2.1</li>
    <li id="09" draggable="true"><div class="entry"><div style="width:48px;"></div><div style="width:16px;">    </div>Subsection 1.3.2.2</div></li>
</ul>
`;

const dchIndexMenuEntries = [
//   callId,      name,                 tooltip
    ["insertNew", "Insert New Document", "Insert a new document above the current cursor"]
    ["indent",    "> Indent Document",   "Make document a child of the document above it"],
    ["dedent",    "< Dedent Document",   "Move document up to parent's level"],
    ["",          "",                    ""],       // this will appear as a seperator line
    ["export",    "Export Document",     "Export document to a local file"],
    ["",          "",                    ""],       // this will appear as a seperator line
    ["delete",    "Delete Document",     "Delete document under cursor"],
];
    

const style = window.getComputedStyle(tmp);
let bgColor = style.backgroundColor;
bgColor = FF.parseRgba(bgColor);
bgColor.r = Math.max(0, bgColor.r - 24);
bgColor.g = Math.max(0, bgColor.g - 24);
bgColor.b = Math.max(0, bgColor.b - 24);

bgColor = "rgb(" + bgColor.r + "," + bgColor.g + "," + bgColor.b + ")";

let list = document.getElementById("divIndexViewUL");   // change from "divIndexView" above, to new inner <ul> element
const listItems       = list.querySelectorAll('li');      // get all the <li> elements in the <ul>

let draggedItem       = null;                             // ptr to <li> currently being dragged
let curSelectedItem   = null;                             // prt to currently selected item (AKA item currently displayed in divDocView)
let placeholder       = document.createElement('div');    // create the thin-black-line that shows where a dragDrop will go on dragEnd
placeholder.className = 'placeholder';

listItems.forEach(item => {
    item.addEventListener('dragstart',   onDragStart);  // RSTODO improve on this, use the single document level listener instead
    item.addEventListener('dragover',    onDragOver);
    // item.addEventListener('drop',        onDrop);
    item.addEventListener('dragend',     onDragEnd);
    item.addEventListener('click',       onLeftClick);
    item.addEventListener('contextmenu', onRightClick);
});

function setSelected(evt) {
    evt.preventDefault();
    if (curSelectedItem) {
        curSelectedItem.style.backgroundColor = "";
    }
    curSelectedItem = evt.target;
    curSelectedItem.style.backgroundColor = bgColor; //"lightslategrey";
}

function onLeftClick(evt) {     // desel any sel,  sel current one under mouse, then load it in docView
    setSelected(evt);
}

function onRightClick(evt) {     // desel any sel,  sel current one under mouse, then open a context menu
    setSelected(evt);
}

function onDragStart(evt) {
    draggedItem = evt.target;
    evt.dataTransfer.effectAllowed = 'move';
    evt.target.classList.add('dragging');
    // console.log(`ODS TF1(${evt.target.id},${draggedItem.id})`);
}

function onDragOver(evt) {
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'move';

    let tf1 = (evt.target.nodeName === 'LI' && evt.target.id !== draggedItem.id);
    let tf2 = (evt.target.nodeName === 'LI' && evt.target !== draggedItem);
    // console.log(`ODO TF1(${evt.target.id},`,evt.target,`)=${tf1}, " TF2(${draggedItem.id},`,draggedItem,`)=${tf2}`);
    if (evt.target.nodeName === 'LI' && evt.target !== draggedItem) {
        const bounding = evt.target.getBoundingClientRect();
        const offset = evt.clientY - bounding.top;

        // createPlaceholder();

        if (offset > bounding.height / 2) {
            list.insertBefore(placeholder, evt.target.nextSibling);
        } else {
            list.insertBefore(placeholder, evt.target);
        }
    }
}

// function onDrop(evt) {
// }

function onDragEnd(evt) {
    evt.preventDefault();

    let target = placeholder.nextElementSibling;
    if (target) {                               // if dropTarget not past last <li>
        list.insertBefore(draggedItem, target);
    } else {
        list.appendChild(draggedItem);
    }

    evt.target.classList.remove('dragging');
    draggedItem = null;
    if (placeholder && placeholder.parentNode) {
        placeholder.parentNode.removeChild(placeholder);
    }
}
