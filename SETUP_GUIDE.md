# done. Mobile App — Complete Setup Guide

## What you get

- React Native app (Expo) for Android (and iOS-ready)
- FCM push notifications that fire even when app is fully closed
- Same Flask backend — no breaking changes, additive only
- Secret 3-tap on "done." wordmark → opens in-app admin dashboard
- All task features: create, edit, delete, subtasks, recurrence, stats
- Free to build and publish

---

## Part 1 — Fix Render cold start (do this first, takes 2 minutes)

**Use UptimeRobot — free, keeps Render permanently warm:**

1. Go to **uptimerobot.com** → Sign up free
2. Click **Add New Monitor**
3. Monitor Type: **HTTP(S)**
4. Friendly Name: `done. API keepalive`
5. URL: `https://done-todo-api.onrender.com/api/health`
6. Monitoring Interval: **5 minutes**
7. Click **Create Monitor**

Done. UptimeRobot pings your API every 5 minutes. Render never spins down.
The 1-minute cold start delay is permanently gone at zero cost.

---

## Part 2 — Backend changes (10 minutes)

### 2a. Add the FcmToken model

Add this class to your `backend/models.py`:

```python
class FcmToken(db.Model):
    __tablename__ = 'fcm_tokens'
    id         = db.Column(db.Integer, primary_key=True)
    user_id    = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token      = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.utcnow())
```

### 2b. Copy these backend files

| Source file | Copy to |
|-------------|---------|
| `backend_patch/routes/push_fcm.py` | `backend/routes/push_fcm.py` (new) |
| `backend_patch/services/expo_push.py` | `backend/services/expo_push.py` (new) |
| `backend_patch/services/reminder_full.py` | `backend/services/reminder.py` (replace) |

### 2c. Register the FCM routes in app.py

Add these 2 lines to `backend/app.py`:

```python
# In imports (top)
from routes.push_fcm import push_fcm_bp

# In create_app(), with the other blueprints
app.register_blueprint(push_fcm_bp, url_prefix='/api/push')
```

### 2d. Add migration for fcm_tokens table

The `db.create_all()` in `app.py` will auto-create the `fcm_tokens` table on next deploy.
No manual SQL needed.

### 2e. Deploy backend

```bash
git add .
git commit -m "v6: FCM token support for React Native app"
git push
```

---

## Part 3 — Create Expo account and project (15 minutes)

### 3a. Install tools

```bash
# Node.js 18+ required
npm install -g expo-cli eas-cli
```

### 3b. Create Expo account

Go to **expo.dev** → Sign up free → remember your username

### 3c. Create a Firebase project (for FCM)

1. Go to **console.firebase.google.com**
2. Click **Add project** → name it `done-todo`
3. Click **Continue** (skip Google Analytics)
4. In the project dashboard: click **Android** icon
5. Android package name: `com.chandu75xo.donetodo`
6. Click **Register app**
7. Download `google-services.json`
8. Place it in: `app/google-services.json`

### 3d. Initialise the Expo project

```bash
cd app/
npx expo install    # installs all dependencies

# Log in to Expo
eas login

# Link to your Expo account
eas init --id YOUR_PROJECT_ID
```

Update `app.json` — replace `YOUR_EAS_PROJECT_ID` with the project ID from:
**expo.dev → your project → Project ID**

Also update these values in `app.json`:
```json
"extra": {
  "apiUrl":        "https://done-todo-api.onrender.com",
  "adminSecret":   "your-ADMIN_SECRET-value",
  "adminPassword": "your-admin-dashboard-password"
}
```

---

## Part 4 — Build the APK (20 minutes)

### 4a. Create eas.json

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### 4b. Build APK for testing

```bash
cd app/
eas build --platform android --profile preview
```

This uploads your code to Expo's build servers and compiles it.
Takes ~5-10 minutes. Free tier: 30 builds/month.

### 4c. Install on your phone

When the build completes, EAS gives you a QR code and download link.
- Scan QR code on Android → downloads APK → install (allow unknown sources)
- Or download the APK link on your phone directly

---

## Part 5 — Test notifications

1. Open the app → sign in with your existing account
2. The app registers its FCM token with the backend automatically
3. Create a task with a due time 2 minutes from now, mark as Important ★
4. Watch for notification at T-15, T+0, T+15

To verify FCM registration worked:
```
GET https://done-todo-api.onrender.com/api/admin/stats?secret=YOURSECRET
```
Should show increased `push_subscriptions` count.

---

## Part 6 — Secret admin access in app

Tap the "done." wordmark **3 times quickly** in the sidebar.
The phone vibrates and you're taken to the admin login screen.
Enter your admin password to access the full dashboard.

The 3 taps must happen within 800ms of each other.

---

## Notification behaviour on Android

| Scenario | Notification delivered? |
|----------|------------------------|
| App open | ✅ In-app + system notification |
| App minimised | ✅ System notification |
| App fully closed (swiped away) | ✅ FCM delivers to device |
| Phone locked/screen off | ✅ Wakes screen and shows notification |
| Phone in Do Not Disturb | ⚠️ Depends on DND settings |
| No internet | ❌ Queued until connection restored |

This is the key difference from the PWA — app does not need to be running at all.

---

## Project structure

```
app/
├── app.json                    # Expo config, Firebase, package name
├── google-services.json        # From Firebase (not committed to git)
├── eas.json                    # EAS build profiles
├── package.json
├── app/
│   ├── _layout.jsx             # Root layout, notification setup
│   ├── index.jsx               # Auth redirect
│   ├── auth.jsx                # Login + register + OTP
│   ├── tabs.jsx                # Main app + secret tap mechanism
│   └── admin.jsx               # In-app admin dashboard
├── hooks/
│   ├── useAuth.js
│   └── useTasks.js
└── services/
    ├── api.js                  # Axios + SecureStore
    └── notifications.js        # FCM registration + handlers
```

---

## .gitignore additions for mobile

```
app/google-services.json
app/node_modules/
app/.expo/
app/dist/
```

---

## Estimated costs

| Service | Cost |
|---------|------|
| Expo EAS builds | Free (30 builds/month) |
| Firebase FCM | Free (no limits) |
| UptimeRobot | Free (50 monitors) |
| Render backend | Free (existing) |
| Neon PostgreSQL | Free (existing) |
| **Total** | **$0/month** |

---

## Common issues

**"Build failed - google-services.json not found"**
→ Make sure `google-services.json` is in the `app/` root (not in a subfolder)

**"Notifications not arriving"**
→ Run: `POST /api/debug/reset-flags?secret=YOURSECRET` to reset flags
→ Check Render logs for `[Expo Push]` lines

**"Invalid token" on admin screen**
→ Make sure `adminSecret` in `app.json extra` matches your Render `ADMIN_SECRET`

**"App crashes on launch"**
→ Run `expo start` locally and check the error in Expo Go before building
