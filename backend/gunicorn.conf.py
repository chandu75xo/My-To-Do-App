import os

workers      = 1
worker_class = 'sync'
threads      = 4
bind         = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
timeout      = 120
keepalive    = 5
accesslog    = '-'
errorlog     = '-'
loglevel     = 'info'
preload_app  = True

def post_fork(server, worker):
    # APScheduler threads do NOT survive fork().
    # Reset _scheduler=None so start_scheduler() always creates a fresh one.
    try:
        import services.reminder as rem
        rem._scheduler = None
    except Exception:
        pass
    try:
        from app import app
        from services.reminder import start_scheduler
        start_scheduler(app)
        server.log.info(f'[Scheduler] Started in worker pid={worker.pid}')
    except Exception as e:
        server.log.error(f'[Scheduler] FAILED: {e}')
        import traceback; traceback.print_exc()
