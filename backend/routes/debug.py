from flask import Blueprint, request, jsonify
import os

debug_bp = Blueprint('debug', __name__)

def _auth():
    s = os.getenv('ADMIN_SECRET', '')
    if not s or request.args.get('secret') != s:
        return jsonify({'error': 'Unauthorized'}), 401
    return None

@debug_bp.route('/scheduler', methods=['GET'])
def scheduler_status():
    err = _auth()
    if err: return err
    try:
        from services.reminder import _scheduler
        if _scheduler is None:
            return jsonify({'running': False, 'error': 'Not started'}), 200
        jobs = [{'id': j.id, 'next_run': str(j.next_run_time)} for j in _scheduler.get_jobs()]
        return jsonify({'running': _scheduler.running, 'jobs': jobs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/trigger', methods=['POST'])
def trigger():
    err = _auth()
    if err: return err
    try:
        from app import app as fa
        from services.reminder import check_reminders
        check_reminders(fa)
        return jsonify({'message': 'Triggered — check Render logs'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/fix-offsets', methods=['POST'])
def fix_offsets():
    """Set utc_offset_minutes for all tasks with offset=0. Use for legacy tasks."""
    err = _auth()
    if err: return err
    try:
        offset = int(request.args.get('offset', 330))
        from models import Task
        from app_instance import db
        n = Task.query.filter_by(utc_offset_minutes=0).update({'utc_offset_minutes': offset})
        db.session.commit()
        return jsonify({'message': f'Updated {n} tasks to offset={offset}'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/reset-flags', methods=['POST'])
def reset_flags():
    """Reset all notification flags so tasks can fire again. Use after fixes."""
    err = _auth()
    if err: return err
    try:
        from models import Task
        from app_instance import db
        n = Task.query.filter_by(done=False).update({
            'push_before_sent': False, 'push_due_sent': False, 'push_after_sent': False,
            'email_before_sent': False, 'email_due_sent': False, 'email_after_sent': False,
            'push_sent': False, 'reminder_sent': False, 'due_push_sent': False,
        })
        db.session.commit()
        return jsonify({'message': f'Reset flags on {n} tasks'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
