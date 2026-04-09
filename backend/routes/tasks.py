from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app_instance import db
from models import Task, Subtask

tasks_bp = Blueprint('tasks', __name__)


def _next_due_date(due_date_str, recurrence):
    if not due_date_str:
        base = datetime.now(timezone.utc).date()
    else:
        base = datetime.strptime(due_date_str, '%Y-%m-%d').date()
    if recurrence == 'daily':
        return (base + timedelta(days=1)).isoformat()
    elif recurrence == 'weekly':
        return (base + timedelta(weeks=1)).isoformat()
    elif recurrence == 'monthly':
        import calendar
        month = base.month + 1
        year  = base.year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        day   = min(base.day, calendar.monthrange(year, month)[1])
        return base.replace(year=year, month=month, day=day).isoformat()
    return due_date_str


@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = int(get_jwt_identity())
    tag     = request.args.get('tag')
    query   = Task.query.filter_by(user_id=user_id)
    if tag:
        query = query.filter_by(tag=tag)
    tasks = query.order_by(Task.created_at.desc()).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]}), 200


@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())
    data    = request.get_json()
    if not data or not data.get('title', '').strip():
        return jsonify({'error': 'Title is required'}), 400

    task = Task(
        user_id            = user_id,
        title              = data['title'].strip(),
        notes              = data.get('notes', '') or '',
        tag                = data.get('tag', 'personal'),
        priority           = data.get('priority', 'medium'),
        due_date           = data.get('dueDate') or None,
        due_time           = data.get('dueTime') or None,
        important          = bool(data.get('important', False)),
        done               = bool(data.get('done', False)),
        recurrence         = data.get('recurrence', 'none'),
        utc_offset_minutes = data.get('utcOffsetMinutes', 0),
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 201


@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id  = int(get_jwt_identity())
    task     = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404

    data     = request.get_json()
    was_done = task.done

    if 'title'              in data: task.title              = data['title'].strip()
    if 'notes'              in data: task.notes              = data.get('notes', '')
    if 'tag'                in data: task.tag                = data['tag']
    if 'priority'           in data: task.priority           = data['priority']
    if 'dueDate'            in data: task.due_date           = data['dueDate'] or None
    if 'dueTime'            in data: task.due_time           = data['dueTime'] or None
    if 'important'          in data: task.important          = bool(data['important'])
    if 'done'               in data: task.done               = bool(data['done'])
    if 'recurrence'         in data: task.recurrence         = data['recurrence']
    if 'utcOffsetMinutes'   in data: task.utc_offset_minutes = data['utcOffsetMinutes']

    if 'dueTime' in data or 'dueDate' in data:
        task.reminder_sent = False
        task.push_sent     = False
        task.due_push_sent = False

    if task.subtasks and all(s.done for s in task.subtasks):
        task.done = True

    newly_done = task.done
    if not was_done and newly_done and task.recurrence != 'none':
        next_date = _next_due_date(task.due_date, task.recurrence)
        db.session.add(Task(
            user_id            = user_id,
            title              = task.title,
            tag                = task.tag,
            priority           = task.priority,
            due_date           = next_date,
            due_time           = task.due_time,
            important          = task.important,
            recurrence         = task.recurrence,
            utc_offset_minutes = task.utc_offset_minutes,
        ))

    db.session.commit()
    return jsonify({'task': task.to_dict()}), 200


@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task    = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    db.session.delete(task)
    db.session.commit()
    return '', 204


@tasks_bp.route('/clear-completed', methods=['DELETE'])
@jwt_required()
def clear_completed():
    user_id = int(get_jwt_identity())
    Task.query.filter_by(user_id=user_id, done=True).delete()
    db.session.commit()
    return '', 204


@tasks_bp.route('/<int:task_id>/subtasks', methods=['POST'])
@jwt_required()
def add_subtask(task_id):
    user_id = int(get_jwt_identity())
    task    = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task: return jsonify({'error': 'Task not found'}), 404
    data  = request.get_json()
    title = data.get('title', '').strip()
    if not title: return jsonify({'error': 'Title required'}), 400
    if len(task.subtasks) >= 10: return jsonify({'error': 'Max 10 subtasks'}), 400
    s = Subtask(task_id=task_id, title=title)
    db.session.add(s); db.session.commit()
    return jsonify({'subtask': s.to_dict()}), 201


@tasks_bp.route('/<int:task_id>/subtasks/<int:sub_id>', methods=['PUT'])
@jwt_required()
def update_subtask(task_id, sub_id):
    user_id = int(get_jwt_identity())
    task    = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task: return jsonify({'error': 'Task not found'}), 404
    sub = Subtask.query.filter_by(id=sub_id, task_id=task_id).first()
    if not sub: return jsonify({'error': 'Subtask not found'}), 404
    data = request.get_json()
    if 'title' in data: sub.title = data['title'].strip()
    if 'done'  in data: sub.done  = bool(data['done'])
    if all(s.done for s in task.subtasks): task.done = True
    db.session.commit()
    return jsonify({'subtask': sub.to_dict(), 'task': task.to_dict()}), 200


@tasks_bp.route('/<int:task_id>/subtasks/<int:sub_id>', methods=['DELETE'])
@jwt_required()
def delete_subtask(task_id, sub_id):
    user_id = int(get_jwt_identity())
    task    = Task.query.filter_by(id=task_id, user_id=user_id).first()
    if not task: return jsonify({'error': 'Task not found'}), 404
    sub = Subtask.query.filter_by(id=sub_id, task_id=task_id).first()
    if not sub: return jsonify({'error': 'Subtask not found'}), 404
    db.session.delete(sub); db.session.commit()
    return '', 204
