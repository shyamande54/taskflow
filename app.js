// TaskFlow: a tiny offline-first Kanban board.
const STORAGE_KEY = "taskflow:v1";
const THEME_KEY = "taskflow:theme";
const COLUMNS = [
  { id: "todo", name: "To do" },
  { id: "doing", name: "In progress" },
  { id: "done", name: "Done" },
];
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

const $ = (sel, root = document) => root.querySelector(sel);
const board = $("#board");
const dialog = $("#dialog");
const form = $("#form");
const tpl = $("#card-tpl");

let editingId = null;
let tasks = load();

function seed() {
  const day = (n) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
  return [
    { title: "Welcome to TaskFlow 👋", description: "Drag cards between columns. Click a card to edit it.", priority: "medium", column: "todo", due: "" },
    { title: "Design landing page", description: "Hero, features, pricing.", priority: "high", column: "todo", due: day(2) },
    { title: "Write API docs", description: "", priority: "low", column: "todo", due: day(7) },
    { title: "Set up CI pipeline", description: "Lint + tests on every push.", priority: "high", column: "doing", due: day(1) },
    { title: "Create project repo", description: "", priority: "medium", column: "done", due: "" },
  ].map((t, i) => ({ ...t, id: uid(), created: Date.now() - i * 1000 }));
}

function uid() {
  return crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted storage: fall through to seed */ }
  return seed();
}

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function isLate(t) {
  if (!t.due || t.column === "done") return false;
  return t.due < new Date().toISOString().slice(0, 10);
}

function formatDue(iso) {
  return new Date(iso + "T00:00:00").toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function visible(t) {
  const q = $("#search").value.trim().toLowerCase();
  const p = $("#filter").value;
  if (p !== "all" && t.priority !== p) return false;
  if (q && !(`${t.title} ${t.description}`.toLowerCase().includes(q))) return false;
  return true;
}

function renderStats() {
  const total = tasks.length;
  const done = tasks.filter((t) => t.column === "done").length;
  const late = tasks.filter(isLate).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  $("#stats").innerHTML = `
    <div class="stat"><b>${total}</b><span>Total tasks</span></div>
    <div class="stat"><b>${tasks.filter((t) => t.column === "doing").length}</b><span>In progress</span></div>
    <div class="stat"><b>${late}</b><span>Overdue</span></div>
    <div class="stat progress"><b>${pct}%</b><span>Complete</span><div class="bar"><i style="width:${pct}%"></i></div></div>`;
}

function renderCard(t) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = t.id;
  node.dataset.priority = t.priority;
  $(".badge", node).textContent = t.priority;
  $("h3", node).textContent = t.title;
  $("p", node).textContent = t.description;
  const due = $(".due", node);
  if (t.due) {
    due.textContent = (isLate(t) ? "Overdue · " : "Due ") + formatDue(t.due);
    due.classList.toggle("late", isLate(t));
  }
  node.addEventListener("click", () => openDialog(t.id));
  node.addEventListener("keydown", (e) => { if (e.key === "Enter") openDialog(t.id); });
  node.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", t.id);
    node.classList.add("dragging");
  });
  node.addEventListener("dragend", () => node.classList.remove("dragging"));
  return node;
}

function render() {
  board.replaceChildren();
  for (const col of COLUMNS) {
    const items = tasks
      .filter((t) => t.column === col.id && visible(t))
      .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || a.created - b.created);

    const el = document.createElement("section");
    el.className = "column";
    el.dataset.col = col.id;
    el.innerHTML = `<div class="column-head"><h2>${col.name}</h2><span class="count">${items.length}</span></div>`;
    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "empty";
      empty.textContent = "Drop tasks here";
      el.append(empty);
    }
    items.forEach((t) => el.append(renderCard(t)));

    el.addEventListener("dragover", (e) => { e.preventDefault(); el.classList.add("over"); });
    el.addEventListener("dragleave", () => el.classList.remove("over"));
    el.addEventListener("drop", (e) => {
      e.preventDefault();
      el.classList.remove("over");
      const t = tasks.find((x) => x.id === e.dataTransfer.getData("text/plain"));
      if (t && t.column !== col.id) {
        t.column = col.id;
        save();
        render();
      }
    });
    board.append(el);
  }
  renderStats();
}

function openDialog(id = null) {
  editingId = id;
  form.reset();
  const t = id && tasks.find((x) => x.id === id);
  $("#dialog-title").textContent = t ? "Edit task" : "New task";
  $("#delete").hidden = !t;
  if (t) {
    for (const k of ["title", "description", "priority", "due", "column"]) form.elements[k].value = t[k] ?? "";
  }
  dialog.showModal();
  form.elements.title.focus();
}

dialog.addEventListener("close", () => {
  if (dialog.returnValue !== "save") return;
  const data = Object.fromEntries(new FormData(form));
  data.title = data.title.trim();
  if (!data.title) return;
  if (editingId) {
    Object.assign(tasks.find((x) => x.id === editingId), data);
  } else {
    tasks.push({ ...data, id: uid(), created: Date.now() });
  }
  save();
  render();
});

$("#delete").addEventListener("click", () => {
  if (!editingId || !confirm("Delete this task?")) return;
  tasks = tasks.filter((x) => x.id !== editingId);
  save();
  dialog.close("deleted");
  render();
});

$("#new").addEventListener("click", () => openDialog());
$("#search").addEventListener("input", render);
$("#filter").addEventListener("change", render);

$("#export").addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(tasks, null, 2)], { type: "application/json" });
  const a = Object.assign(document.createElement("a"), {
    href: URL.createObjectURL(blob),
    download: `taskflow-${new Date().toISOString().slice(0, 10)}.json`,
  });
  a.click();
  URL.revokeObjectURL(a.href);
});

$("#import").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error("Expected an array of tasks");
    tasks = data
      .filter((t) => t && typeof t.title === "string")
      .map((t) => ({
        id: t.id || uid(),
        title: t.title,
        description: t.description || "",
        priority: PRIORITY_ORDER[t.priority] !== undefined ? t.priority : "medium",
        column: COLUMNS.some((c) => c.id === t.column) ? t.column : "todo",
        due: t.due || "",
        created: t.created || Date.now(),
      }));
    save();
    render();
  } catch (err) {
    alert("Could not import file: " + err.message);
  }
  e.target.value = "";
});

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}
applyTheme(localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"));
$("#theme").addEventListener("click", () =>
  applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));

document.addEventListener("keydown", (e) => {
  if (dialog.open || ["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) return;
  if (e.key === "n" || e.key === "N") { e.preventDefault(); openDialog(); }
  if (e.key === "/") { e.preventDefault(); $("#search").focus(); }
});

render();
