<h1 align="center">📋 TaskFlow</h1>

<p align="center">
  A fast, offline-first Kanban board. No framework, no build step, no sign-up.
</p>

<p align="center">
  <a href="https://shyamande54.github.io/taskflow/"><img src="https://img.shields.io/badge/Live_demo-0ea5e9?style=for-the-badge&logo=githubpages&logoColor=white" alt="Live demo" /></a>
  <img src="https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript" />
  <img src="https://img.shields.io/badge/dependencies-0-34d399?style=for-the-badge" alt="zero dependencies" />
  <img src="https://img.shields.io/github/license/shyamande54/taskflow?style=for-the-badge&color=1e3a8a" alt="License" />
</p>

---

## ✨ Features

| | |
|---|---|
| 🖱️ **Drag & drop** | Move cards between *To do*, *In progress* and *Done* |
| 🎯 **Priorities** | High / medium / low, colour-coded and auto-sorted |
| 📅 **Due dates** | Overdue tasks are flagged in red |
| 🔍 **Search & filter** | Instant search plus a priority filter |
| 📊 **Live stats** | Totals, overdue count and a completion progress bar |
| 💾 **Offline-first** | Everything is saved in `localStorage`; nothing leaves your browser |
| ⇅ **Import / export** | Back up or move your board as a JSON file |
| 🌓 **Themes** | Dark and light mode, follows your system by default |
| ⌨️ **Keyboard shortcuts** | <kbd>N</kbd> new task · <kbd>/</kbd> search · <kbd>Enter</kbd> edit focused card |

## 🚀 Getting started

No install needed. Clone the repo and open `index.html`, or serve the folder:

```bash
git clone https://github.com/shyamande54/taskflow.git
cd taskflow
python -m http.server 8000   # then open http://localhost:8000
```

## 🗂️ Project structure

```
taskflow/
├── index.html   # markup, task dialog and card template
├── style.css    # theming with CSS custom properties, responsive grid
└── app.js       # state, rendering, drag & drop, persistence
```

## 🧠 How it works

- **State** is a single array of task objects (`id, title, description, priority, column, due, created`).
- **Rendering** is a full re-render from state on every change. It's simple and fast enough for hundreds of cards.
- **Persistence** writes the array to `localStorage` after each mutation.
- **Drag & drop** uses the native HTML5 Drag and Drop API. Each column is a drop target.

## 🛣️ Roadmap

- [ ] Custom columns
- [ ] Labels / tags
- [ ] Touch drag support for mobile
- [ ] Optional cloud sync

## 📄 License

[MIT](LICENSE)
