# Done — Todo PWA

A full-stack Progressive Web App for managing tasks with reminders, statistics, and push notifications.

**Live:** [done-todoapp.netlify.app](https://done-todoapp.netlify.app)  
**Backend:** Hosted on Render (Python/Flask)  
**Database:** Neon (PostgreSQL, free tier)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Python 3, Flask, Flask-JWT-Extended |
| Database | PostgreSQL via Neon (free tier) |
| Auth | JWT (30-day tokens, auto-refresh) |
| Push | Web Push API (VAPID) |
| Email | Configurable SMTP |
| Scheduler | APScheduler (BackgroundScheduler) |
| Hosting | Netlify (frontend) + Render (backend) |

---

## Features

- **Task management** — create, edit, delete tasks with tags, priorities, due dates/times, notes, subtasks, and recurrence
- **Push notifications** — T-15min, T+0, T+15min, then every 4 hours while overdue
- **Email reminders** — for important tasks at due time and daily while overdue
- **Statistics** — completion rate, streaks, bar charts, and category breakdowns across 6 selectable time ranges
- **Dark mode** — full system-aware dark theme
- **PWA** — installable, works offline for viewing cached tasks
- **Analog clock picker** — for selecting due times

---

## Project Structure

```
todo-app/
├── backend/
│   ├── app.py                    # Flask app factory, DB migrations, startup
│   ├── app_instance.py           # Shared db/app instance (avoids circular imports)
│   ├── models.py                 # SQLAlchemy models
│   ├── routes/
│   │   ├── auth.py               # Login, signup, OTP, /me (with JWT auto-refresh)
│   │   ├── tasks.py              # CRUD, subtasks, clear-completed, /archived
│   │   ├── push.py               # Web Push subscription management
│   │   └── admin.py              # Admin monitoring (no task content exposed)
│   └── services/
│       ├── reminder.py           # APScheduler: push/email reminders + daily cleanup
│       ├── push_service.py       # Web Push notification sender
│       └── email_service.py      # SMTP email sender
└── src/
    ├── App.jsx                   # Root component, routing, auth state
    ├── hooks/
    │   ├── useTasks.js           # Task state, optimistic updates, allTasks for stats
    │   └── useAuth.js            # Auth state, token management
    ├── components/
    │   ├── StatsScreen.jsx       # Statistics with 6 time ranges + bar charts
    │   ├── ClockPicker.jsx       # Analog clock time selector (dark mode fixed)
    │   └── ...                   # Other UI components
    └── services/
        └── api.js                # Axios/fetch wrapper for all API calls
```

---

## Environment Variables

### Backend (Render)
```
DATABASE_URL          # Neon PostgreSQL connection string
JWT_SECRET_KEY        # Random secret for signing JWT tokens
ADMIN_SECRET          # Secret for accessing /api/admin/* endpoints
VAPID_PRIVATE_KEY     # Web Push VAPID private key
VAPID_PUBLIC_KEY      # Web Push VAPID public key
VAPID_EMAIL           # mailto: for VAPID contact
SMTP_HOST             # SMTP server hostname
SMTP_PORT             # SMTP port (usually 587)
SMTP_USER             # SMTP username
SMTP_PASSWORD         # SMTP password
FRONTEND_URL          # https://done-todoapp.netlify.app
```

### Frontend (Netlify)
```
VITE_API_URL          # https://your-backend.onrender.com
VITE_VAPID_PUBLIC_KEY # Web Push VAPID public key (same as backend)
```

---

## Session & Auth

Sessions use **JWT tokens with a 30-day expiry** stored in `localStorage`.

| Scenario | Behaviour |
|---|---|
| Active user (visits daily) | Never logged out — token auto-refreshes when <7 days remain |
| Inactive user (no visit for 30+ days) | Automatically logged out — token expired |
| Tab left open indefinitely | Session stays valid until token expires |
| Browser closed & reopened | Session persists (localStorage survives browser restarts) |

Auto-refresh happens silently on every `/api/auth/me` call. When a token has fewer than 7 days left the server issues a fresh 30-day token in the response body. The frontend stores it automatically.

---

## Task Lifecycle & DB Efficiency

To keep the Neon free tier (0.5GB) lean, tasks follow a three-stage lifecycle:

```
Active → (marked done) → Done (still visible on homepage)
Done → (30 days old OR user clicks "Clear completed") → Archived (hidden from homepage, counted in stats)
Archived → (90 days old) → Permanently deleted
```

**Key rule:** "Clear completed" archives tasks — it does NOT delete them. Statistics always include archived tasks, so completion counts are never lost.

The daily cleanup job runs at **02:00 UTC** and:
1. Archives done tasks where `completed_at` is older than 30 days
2. Permanently deletes archived tasks where `completed_at` is older than 90 days  
3. Deletes OTP verification codes older than 30 minutes

---

## Statistics Time Ranges

Statistics are computed **client-side** from `allTasks` (active + archived combined):

| Range | Period |
|---|---|
| This Week | Monday to today |
| This Month | 1st of current month to today |
| Last Month | Full previous calendar month |
| Last 3 Months | Rolling 90 days |
| This Year | January 1st to today |
| All Time | Everything ever completed |

The bar chart adapts: daily bars for periods ≤31 days, weekly bars for longer periods.

---

## Admin Dashboard

Protected by the `ADMIN_SECRET` environment variable (passed as `?secret=` query param).

**Task content is never exposed.** Admin endpoints return counts only.

| Endpoint | What it shows |
|---|---|
| `GET /api/admin/stats` | User counts, task counts, overdue tasks, push subscriptions, pending OTPs, 7-day and 30-day activity |
| `GET /api/admin/users` | User list with name, email, task count, push sub count, join date |
| `GET /api/admin/health` | DB connectivity status, scheduler running status |

---

## Notification Schedule

For each task with a due date/time:

```
T-15min  → push notification + email (important tasks only)
T+0      → push notification + email (important tasks only)
T+15min  → push notification + email (first overdue alert)
T+15 + 4h intervals → push notification every 4h while task remains incomplete
Daily    → one email per calendar day while overdue (important tasks only)
```

All timing is UTC-aware using the user's stored `utc_offset_minutes`.

---

## Running Locally

### Backend
```bash
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql://...
export JWT_SECRET_KEY=dev-secret
flask run --port 5000
```

### Frontend
```bash
npm install
echo "VITE_API_URL=http://localhost:5000" > .env.local
npm run dev
```

---

## Deployment

### Backend → Render
- Build command: `pip install -r requirements.txt`
- Start command: `gunicorn app:app`
- Set all environment variables in the Render dashboard

### Frontend → Netlify
- Build command: `npm run build`
- Publish directory: `dist`
- Set `VITE_API_URL` and `VITE_VAPID_PUBLIC_KEY` in Netlify environment variables
- Add `_redirects` file in `public/`: `/* /index.html 200`
