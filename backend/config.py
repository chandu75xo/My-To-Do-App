import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY                     = os.getenv('SECRET_KEY', 'dev-secret')
    JWT_SECRET_KEY                 = os.getenv('JWT_SECRET_KEY', 'jwt-secret')
    from datetime import timedelta
    JWT_ACCESS_TOKEN_EXPIRES       = timedelta(days=30)

    _db = os.getenv('DATABASE_URL', 'sqlite:///todo.db')
    if _db.startswith('postgres://'):
        _db = _db.replace('postgres://', 'postgresql+psycopg2://', 1)
    elif _db.startswith('postgresql://') and '+psycopg2' not in _db:
        _db = _db.replace('postgresql://', 'postgresql+psycopg2://', 1)
    SQLALCHEMY_DATABASE_URI        = _db
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS      = {'pool_pre_ping': True}

    MAIL_SERVER         = 'smtp.gmail.com'
    MAIL_PORT           = 465
    MAIL_USE_TLS        = False
    MAIL_USE_SSL        = True
    MAIL_USERNAME       = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD       = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_USERNAME', 'noreply@done.app')

    VAPID_PUBLIC_KEY    = os.getenv('VAPID_PUBLIC_KEY')
    VAPID_PRIVATE_KEY   = os.getenv('VAPID_PRIVATE_KEY')
    VAPID_CLAIM_EMAIL   = os.getenv('VAPID_CLAIM_EMAIL')
    BREVO_API_KEY       = os.getenv('BREVO_API_KEY')

    # Used by push_service and email_service to build action URLs
    BACKEND_URL         = os.getenv('BACKEND_URL', os.getenv('RENDER_EXTERNAL_URL', ''))
    FRONTEND_URL        = os.getenv('FRONTEND_URL', 'https://done-todoapp.netlify.app')
