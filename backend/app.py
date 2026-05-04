import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from config              import Config
from app_instance        import db, mail
from routes.auth         import auth_bp
from routes.tasks        import tasks_bp
from routes.tasks_complete import complete_bp
from routes.push         import push_bp
from routes.admin        import admin_bp
from routes.debug        import debug_bp
from routes.push_fcm import push_fcm_bp


def run_migrations(app):
    with app.app_context():
        db_url = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        is_pg  = 'postgresql' in db_url or 'postgres' in db_url
        ifn    = 'IF NOT EXISTS' if is_pg else ''
        bf     = 'FALSE' if is_pg else '0'

        cols = [
            f"ALTER TABLE tasks ADD COLUMN {ifn} notes TEXT",
            f"ALTER TABLE tasks ADD COLUMN {ifn} recurrence VARCHAR(20) NOT NULL DEFAULT 'none'",
            f"ALTER TABLE tasks ADD COLUMN {ifn} utc_offset_minutes INTEGER NOT NULL DEFAULT 0",
            f"ALTER TABLE tasks ADD COLUMN {ifn} push_sent BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} reminder_sent BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} due_push_sent BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} push_before_sent BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} push_due_sent BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} push_after_sent BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} email_before_sent BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} email_due_sent BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} email_after_sent BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} overdue_push_last_at TIMESTAMP",
            f"ALTER TABLE tasks ADD COLUMN {ifn} overdue_email_last_date VARCHAR(10)",
            f"ALTER TABLE tasks ADD COLUMN {ifn} archived BOOLEAN NOT NULL DEFAULT {bf}",
            f"ALTER TABLE tasks ADD COLUMN {ifn} completed_at TIMESTAMP",
            # Indexes — CREATE INDEX IF NOT EXISTS is safe to run repeatedly
            "CREATE INDEX IF NOT EXISTS ix_tasks_user_archived     ON tasks (user_id, archived)",
            "CREATE INDEX IF NOT EXISTS ix_tasks_user_completed_at ON tasks (user_id, completed_at)",
            "CREATE INDEX IF NOT EXISTS ix_tasks_done_completed     ON tasks (done, completed_at)",
        ]
        conn = db.engine.raw_connection()
        try:
            cur = conn.cursor()
            for sql in cols:
                try:
                    cur.execute(sql)
                except Exception as e:
                    if not any(x in str(e).lower() for x in ['already exists','duplicate','already have']):
                        print(f'[Migration] WARN: {e}', flush=True)
            conn.commit()
        finally:
            conn.close()
        print('[Migration] Complete', flush=True)


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    mail.init_app(app)
    JWTManager(app)

    origins = [o for o in ['http://localhost:5173','http://localhost:4173',
                             os.getenv('FRONTEND_URL', '')] if o]
    CORS(app, origins=origins, supports_credentials=True)

    app.register_blueprint(auth_bp,     url_prefix='/api/auth')
    app.register_blueprint(tasks_bp,    url_prefix='/api/tasks')
    app.register_blueprint(complete_bp, url_prefix='/api/tasks')
    app.register_blueprint(push_bp,     url_prefix='/api/push')
    app.register_blueprint(admin_bp,    url_prefix='/api/admin')
    app.register_blueprint(debug_bp,    url_prefix='/api/debug')
    app.register_blueprint(push_fcm_bp, url_prefix='/api/push')

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}, 200

    with app.app_context():
        db.create_all()
        print('[DB] Tables ready.', flush=True)

    run_migrations(app)
    return app


app = create_app()

if __name__ == '__main__':
    from services.reminder import start_scheduler
    start_scheduler(app)
    app.run(host='0.0.0.0', port=int(os.getenv('PORT', 5000)),
            debug=os.getenv('FLASK_ENV') == 'development')
