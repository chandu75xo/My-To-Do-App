import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config        import Config
from app_instance  import db, mail
from routes.auth   import auth_bp
from routes.tasks  import tasks_bp
from routes.push   import push_bp
from routes.admin  import admin_bp
from routes.debug  import debug_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    mail.init_app(app)
    JWTManager(app)

    allowed_origins = [o for o in [
        'http://localhost:5173',
        'http://localhost:4173',
        os.getenv('FRONTEND_URL', ''),
    ] if o]

    CORS(app, origins=allowed_origins, supports_credentials=True)

    app.register_blueprint(auth_bp,  url_prefix='/api/auth')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')
    app.register_blueprint(push_bp,  url_prefix='/api/push')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(debug_bp, url_prefix='/api/debug')

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}, 200

    with app.app_context():
        db.create_all()
        print('[DB] Tables ready.', flush=True)

    return app


app = create_app()

if __name__ == '__main__':
    from services.reminder import start_scheduler
    start_scheduler(app)
    app.run(
        host  = '0.0.0.0',
        port  = int(os.getenv('PORT', 5000)),
        debug = os.getenv('FLASK_ENV') == 'development',
    )
