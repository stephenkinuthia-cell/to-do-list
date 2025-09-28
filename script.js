const todoInput = document.getElementById("todo-input");
const todoList = document.getElementById("todo-list");
const itemsLeft = document.getElementById("items-left");
const filterButtons = document.querySelectorAll(".filter-btn");
const clearCompletedBtn = document.getElementById("clear-completed");
const themeToggleBtn = document.getElementById("theme-toggle");
const lightThemeLink = document.getElementById("lighttheme");
const themeIcon = document.getElementById("theme-icon");
const template = document.getElementById("todo-template");

// Modal elements
const modal = document.getElementById("confirm-modal");
const confirmMessage = document.getElementById("confirm-message");
const confirmYes = document.getElementById("confirm-yes");
const confirmNo = document.getElementById("confirm-no");

let todos = [];
let activeFilter = "all";
let dragSrcId = null;
let confirmCallback = null; 


function openConfirm(message, callback) {
  confirmMessage.textContent = message;
  modal.classList.remove("hidden");
  confirmCallback = callback;
}

confirmYes.addEventListener("click", () => {
  if (confirmCallback) confirmCallback();
  modal.classList.add("hidden");
  confirmCallback = null;
});

confirmNo.addEventListener("click", () => {
  modal.classList.add("hidden");
  confirmCallback = null;
});


function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem("td_todos") || "[]");
    todos = Array.isArray(saved) ? saved : [];
  } catch {
    todos = [];
  }

  // theme
  const savedTheme = localStorage.getItem("td_theme") || "dark";
  if (savedTheme === "light") {
    lightThemeLink.disabled = false;
    document.body.classList.add("light");
    document.body.classList.remove("dark");
    if (themeIcon) {
      themeIcon.setAttribute("src", "images/icon-moon.svg");
      themeIcon.setAttribute("alt", "Switch to dark theme");
    }
  } else {
    lightThemeLink.disabled = true;
    document.body.classList.add("dark");
    document.body.classList.remove("light");
    if (themeIcon) {
      themeIcon.setAttribute("src", "images/icon-sun.svg");
      themeIcon.setAttribute("alt", "Switch to light theme");
    }
  }
}

function saveState() {
  localStorage.setItem("td_todos", JSON.stringify(todos));
}


function render() {
  // clear
  todoList.innerHTML = "";

  // determine list based on filter
  let list = todos;
  if (activeFilter === "active") list = todos.filter(t => !t.completed);
  if (activeFilter === "completed") list = todos.filter(t => t.completed);

  list.forEach((todo) => {
    const node = template.content.firstElementChild.cloneNode(true);
    node.dataset.id = todo.id;

    // checkbox
    const cb = node.querySelector(".todo-checkbox");
    if (todo.completed) cb.classList.add("checked");
    cb.addEventListener("click", () => {
      toggleComplete(todo.id);
    });

    // text
    const span = node.querySelector(".todo-text");
    span.textContent = todo.text;
    if (todo.completed) span.classList.add("completed");

    // delete
    const del = node.querySelector(".todo-delete");
    del.textContent = "✕";
    del.addEventListener("click", () => {
      openConfirm(
        `Do you really want to delete “${todo.text}” task? Once it's gone, it's gone forever!`,
        () => deleteTodo(todo.id)
      );
    });

    
    node.setAttribute("draggable", "true");
    node.addEventListener("dragstart", dragStart);
    node.addEventListener("dragover", dragOver);
    node.addEventListener("dragleave", dragLeave);
    node.addEventListener("drop", drop);
    node.addEventListener("dragend", dragEnd);

    todoList.appendChild(node);
  });

  updateItemsLeft();
  saveState();
}

function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.push({ id: Date.now().toString(), text: trimmed, completed: false });
  render();
}

function toggleComplete(id) {
  todos = todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
  render();
}

function deleteTodo(id) {
  todos = todos.filter(t => t.id !== id);
  render();
}


filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.dataset.filter;
    render();
  });
});


clearCompletedBtn.addEventListener("click", () => {
  openConfirm(
    "Are you sure you want to clear all completed tasks? This action cannot be undone.",
    () => {
      todos = todos.filter(t => !t.completed);
      render();
    }
  );
});


function updateItemsLeft() {
  const count = todos.filter(t => !t.completed).length;
  itemsLeft.textContent = `${count} item${count === 1 ? "" : "s"} left`;
}


todoInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    addTodo(todoInput.value);
    todoInput.value = "";
  }
});


function dragStart(e) {
  this.classList.add("dragging");
  dragSrcId = this.dataset.id;
  e.dataTransfer.effectAllowed = "move";
  try { e.dataTransfer.setData("text/plain", dragSrcId); } catch {}
}
function dragOver(e) {
  e.preventDefault();
  if (!this.classList.contains("drag-over")) this.classList.add("drag-over");
}
function dragLeave() {
  this.classList.remove("drag-over");
}
function drop(e) {
  e.preventDefault();
  this.classList.remove("drag-over");
  const draggedId = e.dataTransfer.getData("text/plain") || dragSrcId;
  const targetId = this.dataset.id;
  if (!draggedId || !targetId || draggedId === targetId) return;

  const draggedIndex = todos.findIndex(t => t.id === draggedId);
  const targetIndex = todos.findIndex(t => t.id === targetId);
  if (draggedIndex < 0 || targetIndex < 0) return;

  const [moved] = todos.splice(draggedIndex, 1);
  todos.splice(targetIndex, 0, moved);
  render();
}
function dragEnd() {
  document.querySelectorAll(".todo-item").forEach(i => i.classList.remove("dragging", "drag-over"));
  dragSrcId = null;
}


themeToggleBtn.addEventListener("click", () => {
  const lightDisabled = lightThemeLink.disabled;
  if (lightDisabled) {
    // switch to light mode
    lightThemeLink.disabled = false;
    document.body.classList.add("light");
    document.body.classList.remove("dark");
    localStorage.setItem("td_theme", "light");
    themeToggleBtn.setAttribute("aria-pressed", "true");

    if (themeIcon) {
      themeIcon.setAttribute("src", "images/icon-moon.svg");
      themeIcon.setAttribute("alt", "Switch to dark theme");
    }
  } else {
    // switch to dark mode
    lightThemeLink.disabled = true;
    document.body.classList.add("dark");
    document.body.classList.remove("light");
    localStorage.setItem("td_theme", "dark");
    themeToggleBtn.setAttribute("aria-pressed", "false");

    if (themeIcon) {
      themeIcon.setAttribute("src", "images/icon-sun.svg");
      themeIcon.setAttribute("alt", "Switch to light theme");
    }
  }
});

loadState();
render();
