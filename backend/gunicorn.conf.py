# gunicorn.conf.py
# Gunicorn is a production-grade Python WSGI server.
# Flask's built-in server (what you use with python app.py) is for development only.
# Gunicorn handles multiple requests concurrently and is stable for production.
#
# Render.com will use this config automatically when we set the start command.

import os

# Number of worker processes
# Formula: (2 × CPU cores) + 1. Render free tier has 1 core → 3 workers
workers = 3

# Worker class — sync is simplest and works well for our app
worker_class = 'sync'

# Bind to the port Render provides via $PORT environment variable
bind = f"0.0.0.0:{os.getenv('PORT', '5000')}"

# Timeout — important for the scheduler and push notification HTTP calls
timeout = 120

# Log to stdout so Render can capture logs
accesslog  = '-'
errorlog   = '-'
loglevel   = 'info'

# Keep connections alive for 2 seconds
keepalive = 2
