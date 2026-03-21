# app.py
#
# This is the entry point of the Flask backend — the equivalent of App.jsx
# for the frontend. It:
#   1. Creates the Flask app
#   2. Loads config from config.py
#   3. Initialises extensions (db, jwt, mail, cors)
#   4. Registers route blueprints
#   5. Creates database tables if they don't exist
#   6. Starts the background reminder scheduler
#   7. Runs the development server

import os
from flask import Flask
from flask_jwt_extended import JWTManager
from flask_cors import CORS

from config      import Config
from app_instance import db, mail
from routes.auth  import auth_bp
from routes.tasks import tasks_bp


def create_app():
    """
    Application Factory pattern.
    Returns a configured Flask app instance.
    Keeping creation inside a function makes testing easier later.
    """
    app = Flask(__name__)

    # Load all config values from config.py into the Flask app
    app.config.from_object(Config)

    # ── Initialise extensions ──────────────────────────────────────────────
    # .init_app(app) connects each extension to this specific Flask app instance
    db.init_app(app)
    mail.init_app(app)
    JWTManager(app)

    # CORS = Cross-Origin Resource Sharing.
    # Browsers block JavaScript from calling APIs on a DIFFERENT domain/port.
    # Your React app runs on localhost:5173.
    # Your Flask API runs on localhost:5000.
    # Without CORS, the browser would block every request from React → Flask.
    # CORS(app, origins=...) tells the browser "these origins are allowed".
    CORS(app, origins=[
        'http://localhost:5173',    # React dev server
        'http://localhost:4173',    # Vite preview server
        os.getenv('FRONTEND_URL', ''),  # production URL (set in .env when deployed)
    ])

    # ── Register blueprints ────────────────────────────────────────────────
    # url_prefix adds a prefix to all routes in that blueprint.
    # auth_bp route '/register' becomes '/api/auth/register'
    # tasks_bp route '/'        becomes '/api/tasks/'
    app.register_blueprint(auth_bp,  url_prefix='/api/auth')
    app.register_blueprint(tasks_bp, url_prefix='/api/tasks')

    # ── Health check route ─────────────────────────────────────────────────
    # A simple GET / that returns OK — useful for deployment platforms
    # to verify the server is running.
    @app.route('/api/health')
    def health():
        return {'status': 'ok', 'message': 'done. API is running'}, 200

    # ── Create database tables ─────────────────────────────────────────────
    with app.app_context():
        # db.create_all() looks at all models and creates their tables
        # if they don't already exist. Safe to run every time — it skips
        # tables that already exist.
        db.create_all()
        print("[DB] Tables ready.")

    return app


# ── Run ────────────────────────────────────────────────────────────────────────
# This block only runs when you execute `python app.py` directly.
# It does NOT run when imported (e.g. by tests or production WSGI servers).
if __name__ == '__main__':
    app = create_app()

    # Start the email reminder background scheduler
    from services.reminder import start_scheduler
    start_scheduler(app)

    # debug=True enables:
    #   - Auto-reload when you save a file (no need to restart Flask)
    #   - Detailed error pages in the browser
    # NEVER use debug=True in production.
    app.run(
        host  = '0.0.0.0',  # listen on all network interfaces (needed for Docker/Render)
        port  = int(os.getenv('PORT', 5000)),
        debug = os.getenv('FLASK_ENV') == 'development',
    )
