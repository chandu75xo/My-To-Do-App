# routes/admin.py
# Read-only admin dashboard. Protected by ADMIN_SECRET env var.
# Task content is NEVER exposed — only counts and system metrics.

from flask import Blueprint, request, jsonify
from models import User, Task, PushSubscription, OTPCode
from datetime import datetime, timezone, timedelta
import os

admin_bp = Blueprint('admin', __name__)


def require_secret():
    secret = os.getenv('ADMIN_SECRET', '')
    if not secret:
        return jsonify({'error': 'ADMIN_SECRET not configured'}), 503
    if request.args.get('secret') != secret:
        return jsonify({'error': 'Unauthorized'}), 401
    return None


@admin_bp.route('/users', methods=['GET'])
def list_users():
    err = require_secret()
    if err: return err
    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({
        'count': len(users),
        'users': [{
            'id':            u.id,
            'name':          u.name,
            'email':         u.email,
            'verified':      u.is_verified,
            'task_count':    Task.query.filter_by(user_id=u.id, archived=False).count(),
            'push_subs':     PushSubscription.query.filter_by(user_id=u.id).count(),
            'created_at':    u.created_at.isoformat() if u.created_at else None,
        } for u in users]
    })


@admin_bp.route('/stats', methods=['GET'])
def stats():
    err = require_secret()
    if err: return err

    now      = datetime.now(timezone.utc)
    cutoff7  = now - timedelta(days=7)
    cutoff30 = now - timedelta(days=30)

    total_users      = User.query.count()
    verified_users   = User.query.filter_by(is_verified=True).count()
    unverified_users = total_users - verified_users

    total_tasks  = Task.query.filter_by(archived=False).count()
    done_tasks   = Task.query.filter_by(archived=False, done=True).count()
    archived_tasks = Task.query.filter_by(archived=True).count()
    overdue_tasks = Task.query.filter(
        Task.archived == False,
        Task.done == False,
        Task.due_date != None,
        Task.due_date < now.strftime('%Y-%m-%d'),
    ).count()

    push_subs    = PushSubscription.query.count()
    pending_otps = OTPCode.query.count()

    new_users_7d  = User.query.filter(User.created_at >= cutoff7).count()
    new_users_30d = User.query.filter(User.created_at >= cutoff30).count()

    completed_7d  = Task.query.filter(
        Task.completed_at != None,
        Task.completed_at >= cutoff7,
    ).count()
    completed_30d = Task.query.filter(
        Task.completed_at != None,
        Task.completed_at >= cutoff30,
    ).count()

    return jsonify({
        'users': {
            'total':        total_users,
            'verified':     verified_users,
            'unverified':   unverified_users,
            'new_7d':       new_users_7d,
            'new_30d':      new_users_30d,
        },
        'tasks': {
            'active':        total_tasks,
            'done':          done_tasks,
            'archived':      archived_tasks,
            'overdue':       overdue_tasks,
            'completed_7d':  completed_7d,
            'completed_30d': completed_30d,
        },
        'push_subscriptions': push_subs,
        'pending_otps':       pending_otps,
        'generated_at':       now.isoformat(),
    })


@admin_bp.route('/health', methods=['GET'])
def health():
    err = require_secret()
    if err: return err
    from app_instance import db
    try:
        db.session.execute(db.text('SELECT 1'))
        db_ok = True
    except Exception:
        db_ok = False

    from services.reminder import _scheduler
    scheduler_running = _scheduler is not None and _scheduler.running

    return jsonify({
        'db':         'ok' if db_ok else 'error',
        'scheduler':  'running' if scheduler_running else 'stopped',
        'checked_at': datetime.now(timezone.utc).isoformat(),
    })
