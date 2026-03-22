import os
from dotenv import load_dotenv
load_dotenv()

class Config:
    SECRET_KEY                      = os.getenv('SECRET_KEY', 'dev-secret-change-in-production')
    SQLALCHEMY_DATABASE_URI         = os.getenv('DATABASE_URL', 'sqlite:///todo.db')
    SQLALCHEMY_TRACK_MODIFICATIONS  = False
    JWT_SECRET_KEY                  = os.getenv('JWT_SECRET_KEY', 'jwt-secret-change-in-production')
    from datetime import timedelta
    JWT_ACCESS_TOKEN_EXPIRES        = timedelta(days=30)
    MAIL_SERVER                     = 'smtp.gmail.com'
    MAIL_PORT                       = 587
    MAIL_USE_TLS                    = True
    MAIL_USERNAME                   = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD                   = os.getenv('MAIL_PASSWORD')
    # Default sender fixes "message does not specify a sender" error
    MAIL_DEFAULT_SENDER             = os.getenv('MAIL_USERNAME', 'noreply@done.app')
    VAPID_PUBLIC_KEY                = os.getenv('VAPID_PUBLIC_KEY')
    VAPID_PRIVATE_KEY               = os.getenv('VAPID_PRIVATE_KEY')
    VAPID_CLAIM_EMAIL               = os.getenv('VAPID_CLAIM_EMAIL')
