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


def run_migrations(app):
    """
    Safely add any columns that were added after the initial table creation.
    Uses IF NOT EXISTS so it's safe to run on every startup.
    Works with both SQLite (local) and PostgreSQL (Neon).
    """
    with app.app_context():
        db_url = app.config.get('SQLALCHEMY_DATABASE_URI', '')
        is_postgres = 'postgresql' in db_url or 'postgres' in db_url

        migrations = []

        if is_postgres:
            # PostgreSQL syntax
            migrations = [
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS notes TEXT",
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS recurrence VARCHAR(20) NOT NULL DEFAULT 'none'",
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS utc_offset_minutes INTEGER NOT NULL DEFAULT 0",
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_push_sent BOOLEAN NOT NULL DEFAULT FALSE",
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS push_sent BOOLEAN NOT NULL DEFAULT FALSE",
                "ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN NOT NULL DEFAULT FALSE",
            ]
        else:
            # SQLite — no IF NOT EXISTS for ADD COLUMN, use try/except per statement
            migrations = [
                "ALTER TABLE tasks ADD COLUMN notes TEXT",
                "ALTER TABLE tasks ADD COLUMN recurrence VARCHAR(20) NOT NULL DEFAULT 'none'",
                "ALTER TABLE tasks ADD COLUMN utc_offset_minutes INTEGER NOT NULL DEFAULT 0",
                "ALTER TABLE tasks ADD COLUMN due_push_sent BOOLEAN NOT NULL DEFAULT 0",
                "ALTER TABLE tasks ADD COLUMN push_sent BOOLEAN NOT NULL DEFAULT 0",
                "ALTER TABLE tasks ADD COLUMN reminder_sent BOOLEAN NOT NULL DEFAULT 0",
            ]

        conn = db.engine.raw_connection()
        try:
            cursor = conn.cursor()
            for sql in migrations:
                try:
                    cursor.execute(sql)
                    print(f'[Migration] OK: {sql[:60]}', flush=True)
                except Exception as e:
                    err = str(e).lower()
                    # "already exists" / "duplicate column" = fine, skip
                    if 'already exists' in err or 'duplicate' in err or 'already have' in err:
                        pass  # column already there — not an error
                    else:
                        print(f'[Migration] WARN: {e}', flush=True)
            conn.commit()
        finally:
            conn.close()

        print('[Migration] Complete.', flush=True)


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
        db.create_all()           # creates any missing tables
        print('[DB] Tables ready.', flush=True)

    run_migrations(app)           # adds any missing columns to existing tables

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
