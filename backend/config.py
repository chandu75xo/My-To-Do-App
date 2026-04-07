import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY                     = os.getenv('SECRET_KEY', 'dev-secret')
    JWT_SECRET_KEY                 = os.getenv('JWT_SECRET_KEY', 'jwt-secret')
    from datetime import timedelta
    JWT_ACCESS_TOKEN_EXPIRES       = timedelta(days=30)

    # Supports SQLite (local), psycopg2 (Neon/Postgres), pg8000 (pure Python fallback)
    _db_url = os.getenv('DATABASE_URL', 'sqlite:///todo.db')

    # Neon / Postgres URL normalization
    if _db_url.startswith('postgres://'):
        _db_url = _db_url.replace('postgres://', 'postgresql+psycopg2://', 1)
    elif _db_url.startswith('postgresql://') and 'psycopg2' not in _db_url and 'pg8000' not in _db_url:
        _db_url = _db_url.replace('postgresql://', 'postgresql+psycopg2://', 1)

    SQLALCHEMY_DATABASE_URI        = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS      = {'pool_pre_ping': True}  # reconnect on lost connection

    MAIL_SERVER          = 'smtp.gmail.com'
    MAIL_PORT            = 465
    MAIL_USE_TLS         = False
    MAIL_USE_SSL         = True
    MAIL_USERNAME        = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD        = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER  = os.getenv('MAIL_USERNAME', 'noreply@done.app')

    VAPID_PUBLIC_KEY     = os.getenv('VAPID_PUBLIC_KEY')
    VAPID_PRIVATE_KEY    = os.getenv('VAPID_PRIVATE_KEY')
    VAPID_CLAIM_EMAIL    = os.getenv('VAPID_CLAIM_EMAIL')
    BREVO_API_KEY        = os.getenv('BREVO_API_KEY')
