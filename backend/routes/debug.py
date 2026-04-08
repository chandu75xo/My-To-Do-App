from flask import Blueprint, request, jsonify
import os

debug_bp = Blueprint('debug', __name__)

def _require_secret():
    secret = os.getenv('ADMIN_SECRET', '')
    if not secret or request.args.get('secret') != secret:
        return jsonify({'error': 'Unauthorized'}), 401
    return None

@debug_bp.route('/scheduler', methods=['GET'])
def scheduler_status():
    err = _require_secret()
    if err: return err
    try:
        from services.reminder import _scheduler
        if _scheduler is None:
            return jsonify({'running': False, 'error': 'Scheduler not started'}), 200
        jobs = [{'id': j.id, 'next_run': str(j.next_run_time)} for j in _scheduler.get_jobs()]
        return jsonify({'running': _scheduler.running, 'jobs': jobs}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@debug_bp.route('/trigger', methods=['POST'])
def trigger():
    """Manually fire a reminder check — use to test without waiting for scheduler."""
    err = _require_secret()
    if err: return err
    try:
        from app import app as flask_app
        from services.reminder import check_reminders
        check_reminders(flask_app)
        return jsonify({'message': 'Triggered — check Render logs'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
