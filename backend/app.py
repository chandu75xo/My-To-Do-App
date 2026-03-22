# app.py — FIXED for production
# Scheduler is now started by gunicorn's post_fork hook (in gunicorn.conf.py)
# NOT here at module level — that was causing multiple schedulers + worker timeouts

import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config       import Config
from app_instance import db, mail
from routes.auth  import auth_bp
from routes.tasks import tasks_bp
from routes.push  import push_bp
from routes.admin import admin_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    mail.init_app(app)
    JWTManager(app)

    allowed_origins = [
        'http://localhost:5173',
        'http://localhost:4173',
        os.getenv('FRONTEND_URL', ''),
    ]
    allowed_origins = [o for o in allowed_origins if o]

    CORS(app, origins=allowed_origins, supports_credentials=True)

    app.register_blueprint(auth_bp,  url_prefix='/api/auth')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(push_bp,  url_prefix='/api/push')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')

    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'done. API is running'}, 200

    with app.app_context():
        db.create_all()
        print('[DB] Tables ready.')

    return app


# Module-level app for gunicorn to find
app = create_app()

if __name__ == '__main__':
    # Local dev only — gunicorn does NOT use this block
    from services.reminder import start_scheduler
    start_scheduler(app)
    app.run(
        host  = '0.0.0.0',
        port  = int(os.getenv('PORT', 5000)),
        debug = os.getenv('FLASK_ENV') == 'development',
    )
