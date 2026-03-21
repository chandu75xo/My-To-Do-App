# done. — Personal Todo App

## v1 — React + Vite + Tailwind (local only, no backend)

---

## What you need installed first

### 1. Node.js
Node.js lets you run JavaScript outside the browser — on your computer.
Vite and React's build tools run on Node.
Download from: https://nodejs.org (pick the LTS version)

Check it installed correctly:
```bash
node --version    # should print something like v20.x.x
npm --version     # should print something like 10.x.x
```

### 2. VS Code (recommended editor)
Download from: https://code.visualstudio.com
Install these extensions:
- "ES7+ React/Redux/React-Native snippets"
- "Tailwind CSS IntelliSense"
- "Prettier - Code formatter"

---

## Running the app locally

Open your terminal (or VS Code's built-in terminal) and run these commands one at a time:

```bash
# 1. Go into the project folder
cd todo-app

# 2. Install all dependencies
#    This reads package.json and downloads everything into a node_modules/ folder
#    Only needed once (or after pulling new code from GitHub)
npm install

# 3. Start the development server
npm run dev
```

Vite will print something like:
```
  VITE v5.x.x  ready in 300ms
  ➜  Local:   http://localhost:5173/
```

Open http://localhost:5173 in your browser — your app is running!

**Hot reload**: Every time you save a file, the browser updates instantly.
You don't need to refresh manually.

---

## Project structure explained

```
todo-app/
│
├── index.html              ← The ONE html file — React loads inside this
├── package.json            ← Lists all dependencies + npm scripts
├── vite.config.js          ← Tells Vite how to build the app
├── tailwind.config.js      ← Tailwind CSS configuration
├── postcss.config.js       ← Required by Tailwind (processes CSS)
│
└── src/
    ├── main.jsx            ← Entry point: mounts React into index.html
    ├── App.jsx             ← Root component: layout + global state
    ├── index.css           ← Global styles + Tailwind directives
    │
    ├── components/
    │   ├── Header.jsx      ← Top bar: app name, date, dark mode toggle
    │   ├── TagFilter.jsx   ← Horizontal tag chips (All, Work, Home...)
    │   ├── TaskList.jsx    ← Renders pending + completed task groups
    │   ├── TaskCard.jsx    ← Single task row with check + delete
    │   └── TaskForm.jsx    ← Modal form: add task + templates
    │
    └── hooks/
        └── useTasks.js     ← All task logic: add, toggle, delete, localStorage
```

---

## Deploying to Netlify (free)

1. Push this project to a GitHub repository
2. Go to https://netlify.com and sign up (free, no card)
3. Click "Add new site" → "Import an existing project" → connect GitHub
4. Set these build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Click Deploy — Netlify gives you a free URL like `done-app.netlify.app`

Every time you push to GitHub, Netlify automatically redeploys. 

---

## What's coming in v2

- Flask REST API (Python backend)
- SQLite database (local) → MySQL (production)
- User login with JWT tokens
- Tasks sync across all your devices
