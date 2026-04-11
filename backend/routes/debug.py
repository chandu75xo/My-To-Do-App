# debug.py — scheduler status + fix UTC offsets for legacy tasks

from flask import Blueprint, request, jsonify
import os

debug_bp = Blueprint('debug', __name__)

def _auth():
    secret = os.getenv('ADMIN_SECRET', '')
    if not secret or request.args.get('secret') != secret:
        return jsonify({'error': 'Unauthorized'}), 401
    return None

@debug_bp.route('/scheduler', methods=['GET'])
def scheduler_status():
    err = _auth()
    if err: return err
    try:
        from services.reminder import _scheduler
        if _scheduler is None:
            return jsonify({'running': False, 'error': 'Scheduler is None'}), 200
        jobs = [{'id': j.id, 'next_run': str(j.next_run_time)} for j in _scheduler.get_jobs()]
        return jsonify({'running': _scheduler.running, 'jobs': jobs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/trigger', methods=['POST'])
def trigger():
    """Manually fire reminder check — use to test without waiting."""
    err = _auth()
    if err: return err
    try:
        from app import app as flask_app
        from services.reminder import check_reminders
        check_reminders(flask_app)
        return jsonify({'message': 'Done — check Render logs'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/fix-offsets', methods=['POST'])
def fix_offsets():
    """
    One-time fix for legacy tasks that have utc_offset_minutes=0
    but were created by users in non-UTC timezones.
    Pass offset_minutes as the correct offset (e.g. 330 for IST).
    Only updates tasks where utc_offset_minutes is currently 0.
    POST /api/debug/fix-offsets?secret=X&offset=330
    """
    err = _auth()
    if err: return err
    try:
        offset = int(request.args.get('offset', 0))
        from models import Task
        from app_instance import db
        updated = Task.query.filter_by(utc_offset_minutes=0).update(
            {'utc_offset_minutes': offset}
        )
        # Also reset reminder flags so tasks can fire with correct timing
        Task.query.filter_by(utc_offset_minutes=offset, push_sent=True).update(
            {'push_sent': False, 'reminder_sent': False, 'due_push_sent': False}
        )
        db.session.commit()
        return jsonify({'message': f'Updated {updated} tasks to offset={offset}min'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/reset-task-flags', methods=['POST'])
def reset_task_flags():
    """
    Reset push/reminder flags on all incomplete tasks so they can fire again.
    Useful when testing or after a fix deployment.
    POST /api/debug/reset-task-flags?secret=X
    """
    err = _auth()
    if err: return err
    try:
        from models import Task
        from app_instance import db
        count = Task.query.filter_by(done=False).update({
            'push_sent': False,
            'reminder_sent': False,
            'due_push_sent': False,
        })
        db.session.commit()
        return jsonify({'message': f'Reset flags on {count} incomplete tasks'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
