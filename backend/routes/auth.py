# auth.py — added /change-password endpoint

import random, string
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from app_instance import db
from models import User, OTPCode

auth_bp = Blueprint('auth', __name__)


def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


def send_otp(email, preferred_name, purpose):
    from services.email_service import send_otp_email
    OTPCode.query.filter_by(email=email, purpose=purpose).delete()
    db.session.commit()
    code       = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.session.add(OTPCode(email=email, code=code, purpose=purpose, expires_at=expires_at))
    db.session.commit()
    send_otp_email(email, preferred_name, code, purpose)


@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    existing = User.query.filter_by(email=data['email'].lower().strip()).first()
    if existing and existing.is_verified:
        return jsonify({'error': 'An account with this email already exists'}), 409
    if existing and not existing.is_verified:
        db.session.delete(existing); db.session.commit()

    preferred = data.get('preferredName', '').strip() or data.get('name', '').strip().split()[0]
    new_user  = User(
        name           = data.get('name', '').strip(),
        preferred_name = preferred,
        email          = data['email'].lower().strip(),
        password_hash  = generate_password_hash(data['password']),
        is_verified    = False,
    )
    db.session.add(new_user); db.session.commit()

    try:
        send_otp(new_user.email, new_user.preferred_name, 'verify')
    except Exception as e:
        print(f'[Auth] OTP email failed: {e}', flush=True)
        new_user.is_verified = True; db.session.commit()
        token = create_access_token(identity=str(new_user.id))
        return jsonify({'user': new_user.to_dict(), 'token': token, 'devMode': True}), 201

    return jsonify({'message': 'Check your email for the verification code.',
                    'email': new_user.email, 'needsOtp': True}), 201


@auth_bp.route('/send-otp', methods=['POST'])
def send_otp_route():
    data    = request.get_json()
    email   = data.get('email', '').lower().strip()
    purpose = data.get('purpose', 'verify')
    user    = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'If that email exists, a code has been sent.'}), 200
    try:
        send_otp(email, user.preferred_name, purpose)
    except Exception as e:
        print(f'[Auth] OTP failed: {e}', flush=True)
        return jsonify({'error': 'Failed to send email.'}), 500
    return jsonify({'message': 'Code sent. Check your email.'}), 200


@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    data    = request.get_json()
    email   = data.get('email', '').lower().strip()
    code    = data.get('code', '').strip()
    purpose = data.get('purpose', 'verify')
    otp     = OTPCode.query.filter_by(email=email, code=code, purpose=purpose).first()
    if not otp:
        return jsonify({'error': 'Invalid code.'}), 400
    now = datetime.now(timezone.utc)
    exp = otp.expires_at
    if exp.tzinfo is None: exp = exp.replace(tzinfo=timezone.utc)
    if now > exp:
        db.session.delete(otp); db.session.commit()
        return jsonify({'error': 'Code expired. Request a new one.'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found.'}), 404
    db.session.delete(otp)
    if purpose == 'verify':
        user.is_verified = True; db.session.commit()
        token = create_access_token(identity=str(user.id))
        return jsonify({'user': user.to_dict(), 'token': token}), 200
    elif purpose == 'reset':
        db.session.commit()
        reset_token = create_access_token(
            identity=str(user.id),
            additional_claims={'purpose': 'reset'},
            expires_delta=timedelta(minutes=15),
        )
        return jsonify({'resetToken': reset_token}), 200


@auth_bp.route('/reset-password', methods=['POST'])
@jwt_required()
def reset_password():
    claims = get_jwt()
    if claims.get('purpose') != 'reset':
        return jsonify({'error': 'Invalid token for this action'}), 403
    data   = request.get_json()
    new_pw = data.get('newPassword', '')
    if len(new_pw) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    user = User.query.get(int(get_jwt_identity()))
    if not user: return jsonify({'error': 'User not found'}), 404
    user.password_hash = generate_password_hash(new_pw)
    db.session.commit()
    return jsonify({'message': 'Password updated successfully'}), 200


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """
    POST /api/auth/change-password
    Body: { currentPassword, newPassword }
    Requires valid JWT (user must be logged in).
    Verifies current password before setting new one.
    """
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data        = request.get_json()
    current_pw  = data.get('currentPassword', '')
    new_pw      = data.get('newPassword', '')

    if not current_pw:
        return jsonify({'error': 'Current password is required'}), 400
    if not check_password_hash(user.password_hash, current_pw):
        return jsonify({'error': 'Current password is incorrect'}), 401
    if len(new_pw) < 6:
        return jsonify({'error': 'New password must be at least 6 characters'}), 400
    if current_pw == new_pw:
        return jsonify({'error': 'New password must be different from current password'}), 400

    user.password_hash = generate_password_hash(new_pw)
    db.session.commit()
    print(f'[Auth] Password changed for user {user.email}', flush=True)
    return jsonify({'message': 'Password changed successfully'}), 200


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    user = User.query.filter_by(email=data['email'].lower().strip()).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    if not user.is_verified:
        return jsonify({'error': 'Please verify your email first.',
                        'needsOtp': True, 'email': user.email}), 403
    token = create_access_token(identity=str(user.id))
    return jsonify({'user': user.to_dict(), 'token': token}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user = User.query.get(int(get_jwt_identity()))
    if not user: return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user = User.query.get(int(get_jwt_identity()))
    if not user: return jsonify({'error': 'User not found'}), 404
    data = request.get_json()
    if data.get('preferredName'):
        user.preferred_name = data['preferredName'].strip()
    if data.get('email'):
        new_email = data['email'].lower().strip()
        existing  = User.query.filter_by(email=new_email).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'Email already in use'}), 409
        user.email = new_email
    db.session.commit()
    return jsonify({'user': user.to_dict()}), 200
