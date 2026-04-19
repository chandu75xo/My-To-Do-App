# push_fcm.py — Add these routes to your existing routes/push.py
# Handles FCM token registration from the React Native app

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app_instance import db
from models import FcmToken   # see models_patch.py

push_fcm_bp = Blueprint('push_fcm', __name__)


@push_fcm_bp.route('/register-fcm', methods=['POST'])
@jwt_required()
def register_fcm():
    """
    Called by the React Native app on every launch.
    Stores the Expo FCM push token for this user+device.
    """
    user_id   = int(get_jwt_identity())
    data      = request.get_json()
    fcm_token = data.get('fcmToken', '').strip()

    if not fcm_token:
        return jsonify({'error': 'fcmToken required'}), 400

    # Upsert — update existing or create new
    existing = FcmToken.query.filter_by(user_id=user_id, token=fcm_token).first()
    if not existing:
        # Remove old tokens for same user (device re-registration)
        FcmToken.query.filter_by(user_id=user_id).delete()
        db.session.add(FcmToken(user_id=user_id, token=fcm_token))
        db.session.commit()
        print(f'[FCM] Token registered for user {user_id}', flush=True)

    return jsonify({'message': 'FCM token registered'}), 200


@push_fcm_bp.route('/remove-fcm', methods=['POST'])
@jwt_required()
def remove_fcm():
    """Called on logout to clean up the token."""
    user_id   = int(get_jwt_identity())
    data      = request.get_json()
    fcm_token = data.get('fcmToken', '').strip()
    FcmToken.query.filter_by(user_id=user_id, token=fcm_token).delete()
    db.session.commit()
    return jsonify({'message': 'Token removed'}), 200
