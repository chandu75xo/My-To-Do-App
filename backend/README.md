# done. — Backend (Flask API) — v2

---

## What this folder is
The Python/Flask backend. It handles:
- User registration and login (JWT tokens)
- Storing tasks in a database (SQLite locally, MySQL in production)
- Sending reminder emails for important tasks 15 minutes before they're due

---

## Step 1 — Create a virtual environment

A virtual environment is an isolated Python installation for this project.
It means the packages you install here don't affect your system Python
or any other Python project.

```bash
# Go into the backend folder
cd todo-app/backend

# Create a virtual environment called "venv"
python -m venv venv

# Activate it:
# On Windows:
venv\Scripts\activate

# On Mac/Linux:
source venv/bin/activate

# You'll see (venv) in your terminal prompt — that means it's active.
# Always activate it before running the Flask app.
```

---

## Step 2 — Install dependencies

```bash
# Make sure (venv) is active first, then:
pip install -r requirements.txt
```

This installs Flask, SQLAlchemy, JWT, CORS, Mail, and the scheduler.

---

## Step 3 — Set up your .env file

```bash
# Copy the example file
cp .env.example .env

# Open .env in VS Code and fill in your values:
code .env
```

The minimum you need to run locally:
```
SECRET_KEY=any-long-random-string
JWT_SECRET_KEY=another-long-random-string
DATABASE_URL=sqlite:///todo.db
FLASK_ENV=development
```

Leave MAIL_USERNAME and MAIL_PASSWORD blank for now — email reminders
just won't send, but everything else works fine.

---

## Step 4 — Run the Flask server

```bash
# Make sure (venv) is active
python app.py
```

You should see:
```
[DB] Tables ready.
[Scheduler] Reminder scheduler started — checking every 60s
 * Running on http://0.0.0.0:5000
```

Flask is now running at http://localhost:5000

---

## Step 5 — Test it's working

Open your browser and go to:
http://localhost:5000/api/health

You should see:
```json
{"status": "ok", "message": "done. API is running"}
```

---

## Step 6 — Run React + Flask together

Open TWO terminal windows:

Terminal 1 (backend):
```bash
cd todo-app/backend
source venv/bin/activate   # or venv\Scripts\activate on Windows
python app.py
```

Terminal 2 (frontend):
```bash
cd todo-app
npm run dev
```

Open http://localhost:5173 — the app now talks to Flask!

---

## Email reminders setup (optional for local dev)

1. Enable 2-Step Verification on your Google account
2. Go to: myaccount.google.com → Security → App passwords
3. Create one → copy the 16-character code
4. Add to .env:
   ```
   MAIL_USERNAME=your-gmail@gmail.com
   MAIL_PASSWORD=your16charcode
   ```
5. Restart Flask

Important tasks with a due time will now receive an email 15 minutes before.

---

## Deploying to Render.com (free)

1. Push the whole todo-app folder to GitHub
2. Go to render.com → New → Web Service → connect GitHub repo
3. Set:
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `python app.py`
4. Add environment variables (same as your .env) in Render's dashboard
5. Change DATABASE_URL to your MySQL connection string
6. Deploy!
