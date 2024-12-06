let boardContext = {
  movingColumn: null,
  movingCard: null,
  placeholder: null,
  dx: 0,
  dy: 0,
  board: null,

  createPlaceholder(elem, classname) {
    this.placeholder = document.createElement("div");
    this.placeholder.classList.add(classname);
    elem.parentNode.insertBefore(this.placeholder, elem);
  },

  removePlaceholder() {
    if (this.placeholder) {
      this.placeholder.parentNode.removeChild(this.placeholder);
    }
  },

  mouseDownCol(e, col) {
    // ignore right click
    if (e.which === 3) return;
    this.movingColumn = col;
    this.dx = e.offsetX;
    this.dy = e.offsetY;
    col.element.classList.add("moving");
    move(col.element, e.clientX - this.dx, e.clientY - this.dy);
    this.createPlaceholder(this.movingColumn.element, "placeholder");
  },

  mouseUpCol(e, col) {
    const { columns } = this.board;
    columns.splice(columns.indexOf(col), 1);
    let idx = columns.findIndex(
      (col) => col.element === this.placeholder.nextElementSibling
    );
    if (idx === -1) {
      idx = columns.length - 1;
    }
    columns.splice(idx, 0, col);

    this.placeholder.parentNode.insertBefore(col.element, this.placeholder);
    this.removePlaceholder();
    col.element.classList.remove("moving");
    col.element.style.removeProperty("left");
    col.element.style.removeProperty("top");
    this.movingColumn = null;
  },

  mouseDownCard(e, card) {
    // ignore right click
    if (e.which === 3) {
      e.preventDefault();
      return;
    }
    this.movingCard = card;
    this.dx = e.offsetX;
    this.dy = e.offsetY;
    card.element.classList.add("moving");
    move(card.element, e.clientX - this.dx, e.clientY - this.dy);
    this.createPlaceholder(card.element, "placeholder");
  },

  mouseUpCard(e, card) {
    // 1. remove from origin
    let originCol = this.board.columns.find((col) => col.cards.includes(card));
    originCol.cards.splice(originCol.cards.indexOf(card), 1);

    // 2. insert instead of placeholder
    let col = this.board.columns.find(
      (col) => col.cardsElement === this.placeholder.parentNode
    );
    const nextToPlaceholder = col.cards.findIndex(
      (card) => card.element === this.placeholder.nextElementSibling
    );
    if (nextToPlaceholder === -1) {
      col.addCard(card);
    } else {
      col.cards.splice(nextToPlaceholder, 0, card);
      col.cardsElement.insertBefore(card.element, this.placeholder);
    }

    this.movingCard.element.classList.remove("moving");
    this.movingCard.element.style.removeProperty("left");
    this.movingCard.element.style.removeProperty("top");
    this.movingCard = null;
    this.removePlaceholder();
  },
};

function move(element, x, y) {
  element.style.left = x + "px";
  element.style.top = y + "px";
}

function getHoverKindX(elem, x, delta = 3 / 4) {
  // return left if x in 3/4 of the element or less
  const rect = elem.getBoundingClientRect();
  if (x < rect.left + rect.width * delta) {
    return "left";
  }
  return "right";
}

function getHoverKindY(elem, y, delta = 2 / 4) {
  const rect = elem.getBoundingClientRect();
  if (y < rect.top + rect.height * delta) {
    return "top";
  }
  return "bottom";
}

export class Kanban {
  addColumn(name) {
    const col = new Column(name);
    this.columns.push(col);
    this.root.appendChild(col.element);
    col.titleElement.addEventListener("mousedown", (e) =>
      boardContext.mouseDownCol(e, col)
    );
    col.titleElement.addEventListener("mouseup", (e) =>
      boardContext.mouseUpCol(e, col)
    );
  }

  loadData() {
    let data = localStorage.getItem("kanban");
    if (!data) return;
    data = JSON.parse(data);
    this.init(this.parent, data);
  }

  saveData() {
    let res = this.columns.map((col) => {
      return {
        title: col.name,
        cards: col.cards.map((card) => card.text),
      };
    });
    res = JSON.stringify(res);
    localStorage.setItem("kanban", res);
    return res;
  }

  constructor(element, data = []) {
    this.init(element, data);
  }

  init(element, data) {
    element.innerHTML = "";
    boardContext.board = this;
    this.parent = element;
    this.root = document.createElement("div");
    this.root.classList.add("kanban");
    this.parent.appendChild(this.root);
    this.columns = [];

    data.forEach(col => {
      this.addColumn(col.title);
      col.cards.forEach(card => {
        this.columns[this.columns.length - 1].addCard(new Card(card));
      });
    })

    // column mousemove
    document.addEventListener("mousemove", (e) => {
      const { movingColumn, placeholder, dx, dy } = boardContext;
      if (!movingColumn) return;
      move(movingColumn.element, e.clientX - dx, e.clientY - dy);
      const isInPlaceholder =
        placeholder.getBoundingClientRect().left < e.clientX &&
        e.clientX < placeholder.getBoundingClientRect().right;
      if (
        isInPlaceholder &&
        getHoverKindX(placeholder, e.clientX, 3 / 4) === "right"
      ) {
        const next = placeholder.nextElementSibling;
        if (next) {
          placeholder.before(next);
        }
        return;
      }
      const arrangement = this.columns.map(
        (col) => col !== movingColumn && getHoverKindX(col.element, e.clientX)
      );
      // find first left
      const leftIndex = arrangement.indexOf("left");
      if (leftIndex === -1) {
        this.root.appendChild(placeholder);
      } else {
        this.columns[leftIndex].element.before(placeholder);
      }
    });

    // card mousemove
    document.addEventListener("mousemove", (e) => {
      const { movingCard, placeholder, dx, dy } = boardContext;
      if (!movingCard) return;
      move(movingCard.element, e.clientX - dx, e.clientY - dy);
      let nextCol = this.columns
        .map(
          (col) =>
            col !== movingCard && getHoverKindX(col.element, e.clientX, 4 / 5)
        )
        .findIndex((kind) => kind === "left");
      if (nextCol === -1) {
        nextCol = this.columns.length - 1;
      }
      this.columns[nextCol].cardsElement.appendChild(placeholder);

      let nextCard = this.columns[nextCol].cards
        .map(
          (card) =>
            card !== movingCard && getHoverKindY(card.element, e.clientY)
        )
        .findIndex((kind) => kind === "top");
      if (nextCard === -1) {
        this.columns[nextCol].cardsElement.appendChild(placeholder);
      } else {
        this.columns[nextCol].cards[nextCard].element.before(placeholder);
      }
    });
  }
}

class Column {
  constructor(name) {
    this.cards = [];
    this.name = name;

    this.element = document.createElement("div");
    this.element.classList.add("column");

    this.titleElement = document.createElement("div");
    this.titleElement.classList.add("title");
    this.titleElement.textContent = name;
    this.element.appendChild(this.titleElement);

    this.cardsElement = document.createElement("div");
    this.cardsElement.classList.add("cards");
    this.element.appendChild(this.cardsElement);

    const controls = document.createElement("div");
    controls.classList.add("controls");
    const createCardButton = document.createElement("button");
    createCardButton.textContent = "Create";
    const createCardTextArea = document.createElement("textarea");
    controls.appendChild(createCardTextArea);
    controls.appendChild(createCardButton);

    createCardButton.addEventListener("click", () => {
      let text = createCardTextArea.value;
      this.addCard(new Card(text));
      createCardTextArea.value = "";
    });
    this.element.appendChild(controls);
  }

  addCard(card) {
    this.cards.push(card);
    this.cardsElement.appendChild(card.element);
  }
}

class Card {
  constructor(text) {
    this.text = text;
    this.element = document.createElement("div");
    this.element.classList.add("card");
    this.element.textContent = text;

    this.element.addEventListener("mousedown", (e) =>
      boardContext.mouseDownCard(e, this)
    );
    this.element.addEventListener("mouseup", (e) =>
      boardContext.mouseUpCard(e, this)
    );
    this.element.addEventListener("click", (e) => {
      console.log("click", e);
    });
  }
}
