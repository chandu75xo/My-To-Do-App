# routes/admin.py
# Simple read-only admin endpoint to inspect the database.
# Protected by ADMIN_SECRET env variable — only you can access it.
# Remove or disable this in a future version once you have proper admin tooling.

from flask import Blueprint, request, jsonify
from models import User, Task, PushSubscription, OTPCode
import os

admin_bp = Blueprint('admin', __name__)

def require_secret():
    """Check the secret key passed as a query param."""
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
            'id':         u.id,
            'name':       u.name,
            'email':      u.email,
            'verified':   u.is_verified,
            'created_at': u.created_at.isoformat(),
        } for u in users]
    })


@admin_bp.route('/tasks', methods=['GET'])
def list_tasks():
    err = require_secret()
    if err: return err
    tasks = Task.query.order_by(Task.created_at.desc()).all()
    return jsonify({
        'count': len(tasks),
        'tasks': [{
            'id':       t.id,
            'user_id':  t.user_id,
            'title':    t.title,
            'tag':      t.tag,
            'done':     t.done,
            'due_date': t.due_date,
            'due_time': t.due_time,
            'important':t.important,
        } for t in tasks]
    })


@admin_bp.route('/stats', methods=['GET'])
def stats():
    err = require_secret()
    if err: return err
    return jsonify({
        'users':              User.query.count(),
        'verified_users':     User.query.filter_by(is_verified=True).count(),
        'tasks':              Task.query.count(),
        'completed_tasks':    Task.query.filter_by(done=True).count(),
        'push_subscriptions': PushSubscription.query.count(),
        'pending_otps':       OTPCode.query.count(),
    })
