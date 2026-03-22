from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from app_instance import db
from models import PushSubscription

push_bp = Blueprint('push', __name__)


@push_bp.route('/vapid-public-key', methods=['GET'])
def get_vapid_key():
    key = current_app.config.get('VAPID_PUBLIC_KEY')
    if not key:
        return jsonify({'error': 'Push notifications not configured'}), 503
    return jsonify({'publicKey': key}), 200


@push_bp.route('/subscribe', methods=['POST'])
@jwt_required()
def subscribe():
    user_id = int(get_jwt_identity())
    data    = request.get_json()

    endpoint = data.get('endpoint')
    p256dh   = data.get('keys', {}).get('p256dh')
    auth     = data.get('keys', {}).get('auth')

    if not all([endpoint, p256dh, auth]):
        return jsonify({'error': 'Invalid subscription object'}), 400

    existing = PushSubscription.query.filter_by(endpoint=endpoint).first()
    if existing:
        existing.p256dh  = p256dh
        existing.auth    = auth
        existing.user_id = user_id
    else:
        sub = PushSubscription(
            user_id  = user_id,
            endpoint = endpoint,
            p256dh   = p256dh,
            auth     = auth,
        )
        db.session.add(sub)

    db.session.commit()
    print(f'[Push] Subscription saved for user {user_id}')
    return jsonify({'message': 'Subscribed successfully'}), 201


@push_bp.route('/unsubscribe', methods=['POST'])
@jwt_required()
def unsubscribe():
    data     = request.get_json()
    endpoint = data.get('endpoint')
    sub      = PushSubscription.query.filter_by(endpoint=endpoint).first()
    if sub:
        db.session.delete(sub)
        db.session.commit()
    return jsonify({'message': 'Unsubscribed'}), 200


@push_bp.route('/status', methods=['GET'])
@jwt_required()
def status():
    """
    GET /api/push/status
    Returns subscription count for current user.
    Use this to verify if browser subscription was saved.
    """
    user_id = int(get_jwt_identity())
    subs    = PushSubscription.query.filter_by(user_id=user_id).all()
    vapid   = bool(current_app.config.get('VAPID_PUBLIC_KEY'))
    return jsonify({
        'subscriptionCount': len(subs),
        'vapidConfigured':   vapid,
        'endpoints':         [s.endpoint[:50] + '...' for s in subs],
    }), 200


@push_bp.route('/test', methods=['POST'])
@jwt_required()
def test_push():
    """
    POST /api/push/test
    Sends a test push notification immediately to all subscriptions
    of the logged-in user. Use this to verify push is working.
    """
    user_id = int(get_jwt_identity())
    subs    = PushSubscription.query.filter_by(user_id=user_id).all()

    if not subs:
        return jsonify({'error': 'No push subscriptions found for this user. Enable notifications first.'}), 404

    from services.push_service import send_push_notification
    results = []
    for sub in subs:
        result = send_push_notification(
            subscription_dict = sub.to_dict(),
            title             = '✅ done. notifications work!',
            body              = 'You will now get reminders 15 mins before important tasks.',
            url               = '/',
        )
        if result == '410':
            db.session.delete(sub)
            db.session.commit()
            results.append('expired')
        else:
            results.append('sent' if result else 'failed')

    return jsonify({'results': results, 'count': len(subs)}), 200
