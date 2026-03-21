from datetime import datetime, timezone
from app_instance import db

class User(db.Model):
    __tablename__ = 'users'
    id             = db.Column(db.Integer, primary_key=True)
    name           = db.Column(db.String(120), nullable=False)
    preferred_name = db.Column(db.String(80),  nullable=False)
    email          = db.Column(db.String(120), nullable=False, unique=True)
    password_hash  = db.Column(db.String(256), nullable=False)
    created_at     = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    tasks = db.relationship('Task', backref='owner', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        return {
            'id':            self.id,
            'name':          self.name,
            'preferredName': self.preferred_name,
            'email':         self.email,
        }

class Task(db.Model):
    __tablename__ = 'tasks'
    id            = db.Column(db.Integer, primary_key=True)
    user_id       = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title         = db.Column(db.String(255), nullable=False)
    tag           = db.Column(db.String(50),  nullable=False, default='personal')
    priority      = db.Column(db.String(20),  nullable=False, default='medium')
    # due_date stores "YYYY-MM-DD" — which day the task is due
    due_date      = db.Column(db.String(10),  nullable=True)
    # due_time stores "HH:MM" — what time on that day
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
