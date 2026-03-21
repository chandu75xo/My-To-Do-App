from datetime import datetime, timezone
from app_instance import db

class User(db.Model):
    __tablename__ = 'users'
    id             = db.Column(db.Integer, primary_key=True)
    name           = db.Column(db.String(120), nullable=False)
    preferred_name = db.Column(db.String(80),  nullable=False)
    email          = db.Column(db.String(120), nullable=False, unique=True)
    password_hash  = db.Column(db.String(256), nullable=False)
    # is_verified: False until they confirm their email via OTP
    is_verified    = db.Column(db.Boolean, nullable=False, default=False)
    created_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    tasks = db.relationship('Task', backref='owner', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id':            self.id,
            'name':          self.name,
            'preferredName': self.preferred_name,
            'email':         self.email,
            'isVerified':    self.is_verified,
        }


class Task(db.Model):
    __tablename__ = 'tasks'
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title         = db.Column(db.String(255), nullable=False)
    tag           = db.Column(db.String(50),  nullable=False, default='personal')
    priority      = db.Column(db.String(20),  nullable=False, default='medium')
    due_date      = db.Column(db.String(10),  nullable=True)
    due_time      = db.Column(db.String(10),  nullable=True)
    important     = db.Column(db.Boolean,     nullable=False, default=False)
    done          = db.Column(db.Boolean,     nullable=False, default=False)
    reminder_sent = db.Column(db.Boolean,     nullable=False, default=False)
    created_at    = db.Column(db.DateTime,    default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id':        self.id,
            'title':     self.title,
            'tag':       self.tag,
            'priority':  self.priority,
            'dueDate':   self.due_date  or '',
            'dueTime':   self.due_time  or '',
            'important': self.important,
            'done':      self.done,
            'createdAt': self.created_at.isoformat(),
        }


class OTPCode(db.Model):
    """
    Stores temporary 6-digit OTP codes for email verification.
    Each row is deleted once used or expired.
    
    purpose: 'verify' (signup verification) or 'reset' (password reset)
    """
    __tablename__ = 'otp_codes'
    id         = db.Column(db.Integer, primary_key=True)
    email      = db.Column(db.String(120), nullable=False)
    code       = db.Column(db.String(6),   nullable=False)
    purpose    = db.Column(db.String(20),  nullable=False)  # 'verify' or 'reset'
    # expires_at: OTP is invalid after this time (10 minutes from creation)
    expires_at = db.Column(db.DateTime, nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
