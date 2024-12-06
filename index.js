let movingColumn;
let placeholder;
let dx, dy;

function createPlaceholder() {
  placeholder = document.createElement("div");
  placeholder.classList.add("placeholder");
  movingColumn.parentNode.insertBefore(placeholder, movingColumn);
}

function removePlaceholder() {
  if (placeholder) {
    placeholder.parentNode.removeChild(placeholder);
  }
}

function getHoverKind(elem, x, delta = 3/4) {
  // return left if x in 3/4 of the element or less
  const rect = elem.getBoundingClientRect();
  if (x < rect.left + rect.width * delta) {
    return "left";
  }
  return "right";
}

export class Kanban {
  addColumn(name) {
    const col = new Column(name);
    this.columns.push(col);
    this.root.appendChild(col.element);
    col.element.addEventListener("mousedown", (e) => {
      dx = e.offsetX;
      dy = e.offsetY;
      
      movingColumn = col.element;
      col.element.classList.add("moving");
      col.element.style.left = e.clientX - dx + "px";
      col.element.style.top = e.clientY - dy + "px";
      createPlaceholder();
    });
    col.element.addEventListener("mouseup", (e) => {
      this.columns.splice(this.columns.indexOf(col), 1);
      let idx = this.columns.findIndex(col => col.element === placeholder.nextElementSibling);
      if (idx === -1) {
        idx = this.columns.length - 1;
      }
      this.columns.splice(idx, 0, col);
      console.log(this.columns.map(col => col.value));


      placeholder.parentNode.insertBefore(col.element, placeholder);
      removePlaceholder();
      col.element.classList.remove("moving");
      col.element.style.removeProperty("top");
      col.element.style.removeProperty("left");
      movingColumn = null;
    });
  }

  loadData() {
    // todo: parse from local storage
  }

  saveData() {
    // todo: save to local storage
  }

  constructor(element) {
    this.parent = element;
    this.root = document.createElement("div");
    this.root.classList.add("kanban");
    this.parent.appendChild(this.root);
    this.columns = [];

    document.addEventListener("mousemove", (e) => {
      if (!movingColumn) return;
      movingColumn.style.left = e.clientX - dx + "px";
      movingColumn.style.top = e.clientY - dy + "px";
      const isInPlaceholder = placeholder.getBoundingClientRect().left < e.clientX && e.clientX < placeholder.getBoundingClientRect().right;
      if (isInPlaceholder && getHoverKind(placeholder, e.clientX, 3/4) === "right") {
        const next = placeholder.nextElementSibling;
        if (next) {
          placeholder.before(next);
        }
        return;
      }
      const arrangement = this.columns.map(col => col.element !== movingColumn && getHoverKind(col.element, e.clientX));
      // find first left
      const leftIndex = arrangement.indexOf("left");
      if (leftIndex === -1) {
        this.root.appendChild(placeholder);
      } else {
        this.columns[leftIndex].element.before(placeholder);
      }      
    });
  }
}

class Column {
  constructor(name) {
    this.name = name;
    this.elem = document.createElement("div");
    this.elem.classList.add("column");
    this.elem.setAttribute("data-name", name);
  }

  get element() {
    return this.elem;
  }
}
