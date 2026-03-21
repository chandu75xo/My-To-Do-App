# app_instance.py
#
# WHY DOES THIS FILE EXIST?
# Python has a "circular import" problem. If app.py imports from models.py,
# and models.py imports from app.py, you get an error:
#   "cannot import name 'db' from partially initialized module"
#
# The fix: create db and mail in a SEPARATE file that neither app.py nor
# models.py fully depends on. Both import from here instead.
# This is a standard Flask pattern called the "Application Factory" approach.

from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail

# These are created here but not connected to any Flask app yet.
# They get connected when app.py calls db.init_app(app).
db   = SQLAlchemy()
mail = Mail()
