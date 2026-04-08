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
    try:
        from app import app
        from services.reminder import start_scheduler
        start_scheduler(app)
        server.log.info(f'[Scheduler] Started in worker pid={worker.pid}')
    except Exception as e:
        server.log.error(f'[Scheduler] Failed to start: {e}')
