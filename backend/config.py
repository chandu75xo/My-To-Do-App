# config.py
#
# Centralises all Flask configuration in one place.
# Instead of scattering app.config['X'] = Y all over app.py,
# we define a Config class and load it once.
#
# os.getenv('KEY', 'default') reads from the .env file.
# If the key isn't found, it falls back to the default value.

import os
from dotenv import load_dotenv

# load_dotenv() reads the .env file and sets each line as an environment variable.
# Must be called before any os.getenv() calls.
load_dotenv()

class Config:
    # ── Flask core ────────────────────────────────────────────────────────
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-change-in-production')

    # ── Database ──────────────────────────────────────────────────────────
    # SQLAlchemy reads this URI to know which database to connect to.
    # sqlite:///todo.db  → creates todo.db file in the backend/ folder
    # mysql+pymysql://.. → connects to a remote MySQL server
    SQLALCHEMY_DATABASE_URI     = os.getenv('DATABASE_URL', 'sqlite:///todo.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False  # disables a feature we don't need (saves memory)

    # ── JWT ───────────────────────────────────────────────────────────────
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    # Tokens expire after 30 days — user stays logged in without re-entering password
    from datetime import timedelta
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=30)

    # ── Email (Flask-Mail via Gmail SMTP) ─────────────────────────────────
    MAIL_SERVER   = 'smtp.gmail.com'
    MAIL_PORT     = 587          # port 587 = TLS (encrypted) — always use this, not 25
    MAIL_USE_TLS  = True         # encrypts the connection to Gmail's server
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')  # your Gmail App Password (not your real password)
