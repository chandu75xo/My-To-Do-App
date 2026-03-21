from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app_instance import db
from models import Task

tasks_bp = Blueprint('tasks', __name__)

@tasks_bp.route('/', methods=['GET'])
@jwt_required()
def get_tasks():
    user_id = int(get_jwt_identity())
    query   = Task.query.filter_by(user_id=user_id)
    tag = request.args.get('tag')
    if tag and tag != 'all':
        query = query.filter_by(tag=tag)
    # Order: undone first, then by due_date (nulls last), then newest
    tasks = query.order_by(
        Task.done.asc(),
        Task.due_date.asc().nullslast(),
        Task.created_at.desc()
    ).all()
    return jsonify({'tasks': [t.to_dict() for t in tasks]}), 200

@tasks_bp.route('/', methods=['POST'])
@jwt_required()
def create_task():
    user_id = int(get_jwt_identity())
    data    = request.get_json()
    if not data or not data.get('title', '').strip():
        return jsonify({'error': 'Title is required'}), 400
    task = Task(
        user_id   = user_id,
        title     = data['title'].strip(),
        tag       = data.get('tag', 'personal'),
        priority  = data.get('priority', 'medium'),
        due_date  = data.get('dueDate', '').strip() or None,
        due_time  = data.get('dueTime', '').strip() or None,
        important = data.get('important', False),
        done      = False,
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 201

@tasks_bp.route('/<int:task_id>', methods=['PUT'])
@jwt_required()
def update_task(task_id):
    user_id = int(get_jwt_identity())
    task    = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    if task.user_id != user_id:
        return jsonify({'error': 'Not authorised'}), 403
    data = request.get_json()
    if 'title'     in data: task.title     = data['title'].strip()
    if 'tag'       in data: task.tag       = data['tag']
    if 'priority'  in data: task.priority  = data['priority']
    if 'dueDate'   in data: task.due_date  = data['dueDate'] or None
    if 'dueTime'   in data: task.due_time  = data['dueTime'] or None
    if 'important' in data:
        task.important     = data['important']
        task.reminder_sent = False
    if 'done'      in data: task.done      = data['done']
    db.session.commit()
    return jsonify({'task': task.to_dict()}), 200

@tasks_bp.route('/<int:task_id>', methods=['DELETE'])
@jwt_required()
def delete_task(task_id):
    user_id = int(get_jwt_identity())
    task    = Task.query.get(task_id)
    if not task:
        return jsonify({'error': 'Task not found'}), 404
    if task.user_id != user_id:
        return jsonify({'error': 'Not authorised'}), 403
    db.session.delete(task)
    db.session.commit()
    return '', 204

@tasks_bp.route('/clear-completed', methods=['DELETE'])
@jwt_required()
def clear_completed():
    user_id = int(get_jwt_identity())
    Task.query.filter_by(user_id=user_id, done=True).delete()
    db.session.commit()
    return jsonify({'message': 'Completed tasks cleared'}), 200
