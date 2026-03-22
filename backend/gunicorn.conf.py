import os

workers    = 1
worker_class = 'sync'
threads    = 4          # threads within the single worker for concurrent requests
bind       = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
timeout    = 300        # 5 minutes — generous for cold starts
keepalive  = 5
accesslog  = '-'
errorlog   = '-'
loglevel   = 'info'

# Start scheduler once in the worker process
def post_fork(server, worker):
    from app import app
    from services.reminder import start_scheduler
    try:
        start_scheduler(app)
        server.log.info('[Scheduler] Started in worker %s', worker.pid)
    except Exception as e:
        server.log.error('[Scheduler] Failed: %s', e)
