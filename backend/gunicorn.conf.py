# gunicorn.conf.py — FIXED for Render.com
# Fix 1: Only 1 worker on free tier — avoids multiple schedulers competing
# Fix 2: PORT comes from Render's environment (they set it, not us)
# Fix 3: Scheduler starts via post_fork hook in the single worker only
# Fix 4: Timeout increased to 120s for email/push operations

import os

# Render free tier: use 1 worker to avoid scheduler conflicts and OOM kills
workers = 1

# Use gevent or sync — sync is simpler and works fine with 1 worker
worker_class = 'sync'

# CRITICAL: Use the PORT that Render assigns — do NOT hardcode 5000
bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"

# Increase timeout — email sending + push can take a few seconds
timeout = 120

# Logs go to stdout so Render captures them
accesslog = '-'
errorlog  = '-'
loglevel  = 'info'

keepalive = 2

# Start the scheduler once after the worker forks
# This prevents multiple scheduler instances running simultaneously
def post_fork(server, worker):
    from app import app
    from services.reminder import start_scheduler
    try:
        start_scheduler(app)
        server.log.info('[Scheduler] Started in worker %s', worker.pid)
    except Exception as e:
        server.log.error('[Scheduler] Failed to start: %s', e)
