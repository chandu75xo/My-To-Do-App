# tasks_complete.py — completion endpoints for push notification and email actions

import os
from flask import Blueprint, request, jsonify, redirect
from flask_jwt_extended import decode_token
from app_instance import db
from models import Task

complete_bp = Blueprint('complete', __name__)

FRONTEND_URL = os.getenv('FRONTEND_URL', 'https://done-todoapp.netlify.app')


def _complete_task_by_token(token):
    """Verify completion JWT and mark task done. Returns (task, error_str)."""
    try:
        data    = decode_token(token)
        purpose = data.get('sub_claims', {}).get('purpose') or data.get('purpose')
        task_id = data.get('sub_claims', {}).get('task_id') or data.get('task_id')
        if purpose != 'complete' or not task_id:
            return None, 'invalid_token'
        task = Task.query.get(task_id)
        if not task:
            return None, 'task_not_found'
        if not task.done:
            task.done = True
            db.session.commit()
        return task, None
    except Exception as e:
        print(f'[Complete] Token error: {e}', flush=True)
        return None, 'expired_or_invalid'


@complete_bp.route('/complete-token', methods=['POST'])
def complete_from_push():
    """Called by Service Worker when user taps 'Mark as complete' on push notification."""
    data  = request.get_json() or {}
    token = data.get('token', '')
    if not token:
        return jsonify({'error': 'Token required'}), 400
    task, err = _complete_task_by_token(token)
    if err:
        return jsonify({'error': err}), 400
    return jsonify({'message': 'Task completed', 'taskId': task.id}), 200


@complete_bp.route('/complete-email', methods=['GET'])
def complete_from_email():
    """Called when user clicks 'Mark as complete' link in email. Redirects to webapp."""
    token = request.args.get('token', '')
    if not token:
        return redirect(f'{FRONTEND_URL}?error=missing_token')
    task, err = _complete_task_by_token(token)
    if err:
        return redirect(f'{FRONTEND_URL}?error={err}')
    return redirect(f'{FRONTEND_URL}?completed={task.id}&title={task.title[:40]}')
