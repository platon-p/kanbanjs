let movingColumn;
let placeholder;
let dx, dy;

function createPlaceholder() {
  placeholder = document.createElement("div");
  placeholder.classList.add("placeholder");
  movingColumn.element.parentNode.insertBefore(placeholder, movingColumn.element);
}

function removePlaceholder() {
  if (placeholder) {
    placeholder.parentNode.removeChild(placeholder);
  }
}

function move(element, x, y) {
  element.style.left = x + "px";
  element.style.top = y + "px";
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
    col.titleElement.addEventListener("mousedown", (e) => {
      dx = e.offsetX, dy = e.offsetY;
      
      movingColumn = col;
      col.element.classList.add("moving");
      move(col.element, e.clientX - dx, e.clientY - dy);
      createPlaceholder();
    });
    col.titleElement.addEventListener("mouseup", (e) => {
      this.columns.splice(this.columns.indexOf(col), 1);
      let idx = this.columns.findIndex(col => col.element === placeholder.nextElementSibling);
      if (idx === -1) {
        idx = this.columns.length - 1;
      }
      this.columns.splice(idx, 0, col);
      console.log(this.columns.map(col => col.name));


      placeholder.parentNode.insertBefore(col.element, placeholder);
      removePlaceholder();
      col.element.classList.remove("moving");
      col.element.style.removeProperty("left");
      col.element.style.removeProperty("top");
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
      move(movingColumn.element, e.clientX - dx, e.clientY - dy);
      const isInPlaceholder = placeholder.getBoundingClientRect().left < e.clientX && e.clientX < placeholder.getBoundingClientRect().right;
      if (isInPlaceholder && getHoverKind(placeholder, e.clientX, 3/4) === "right") {
        const next = placeholder.nextElementSibling;
        if (next) {
          placeholder.before(next);
        }
        return;
      }
      const arrangement = this.columns.map(col => col !== movingColumn && getHoverKind(col.element, e.clientX));
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
    this.element = document.createElement("div");
    this.element.classList.add("column");
    this.titleElement = document.createElement("div");
    this.titleElement.classList.add("title");
    this.titleElement.textContent = name;
    this.element.appendChild(this.titleElement);

    this.cards = [];
    this.addCard("text1");
    this.addCard("text2");
  }

  addCard(text) {
    const card = new Card(text);
    this.cards.push(card);
    this.element.appendChild(card.element);
  }
}

class Card {
  constructor(text) {
    this.text = text;
    this.element = document.createElement("div");
    this.element.classList.add("card");
    this.element.textContent = text;
  }
}