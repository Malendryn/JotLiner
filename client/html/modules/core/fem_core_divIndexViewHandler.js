


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

let list = document.getElementById("divIndexViewUL");   // change from "divIndexView" above, to new inner <ul> element
const listItems       = list.querySelectorAll('li');      // get all the <li> elements in the <ul>

let draggedItem       = null;                             // ptr to <li> currently being dragged
let curSelectedItem   = null;                             // prt to currently selected item (AKA item currently displayed in divDocView)
let placeholder       = document.createElement('div');    // create the thin-black-line that shows where a dragDrop will go on dragEnd
placeholder.className = 'placeholder';

listItems.forEach(item => {
    item.addEventListener('dragstart',   onDragStart);
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
    curSelectedItem.style.backgroundColor = "blue";
}

function onLeftClick(evt) {
    console.log(evt.target.innerHTML);
    setSelected(evt);
}

function onRightClick(evt) {
    console.log(evt.target.innerHTML);
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
