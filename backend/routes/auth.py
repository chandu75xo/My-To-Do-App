# routes/auth.py — UPDATED for v2.2
#
# New routes added:
#   POST /api/auth/send-otp     → sends OTP for verify or reset
#   POST /api/auth/verify-otp   → verifies OTP code entered by user
#   POST /api/auth/reset-password → sets new password after OTP verified

import random
import string
from datetime import datetime, timezone, timedelta
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from app_instance import db
from models import User, OTPCode

auth_bp = Blueprint('auth', __name__)


def generate_otp():
    """Generate a random 6-digit numeric OTP code."""
    return ''.join(random.choices(string.digits, k=6))


def send_otp(email, preferred_name, purpose):
    """
    Helper: create an OTP in the DB and email it.
    Deletes any existing OTPs for this email+purpose first (prevents duplicates).
    """
    from services.email_service import send_otp_email

    # Delete any previous OTPs for this email and purpose
    OTPCode.query.filter_by(email=email, purpose=purpose).delete()
    db.session.commit()

    code       = generate_otp()
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=10)

    otp = OTPCode(email=email, code=code, purpose=purpose, expires_at=expires_at)
    db.session.add(otp)
    db.session.commit()

    send_otp_email(email, preferred_name, code, purpose)


# ── Register ──────────────────────────────────────────────────────────────────
@auth_bp.route('/register', methods=['POST'])
def register():
    """
    POST /api/auth/register
    Body: { name, preferredName, email, password }
    Creates the user (unverified) and sends OTP to their email.
    Returns: { message } — user must verify before logging in.
    """
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    if len(data['password']) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    existing = User.query.filter_by(email=data['email'].lower().strip()).first()
    if existing and existing.is_verified:
        return jsonify({'error': 'An account with this email already exists'}), 409
    # If unverified account exists (didn't complete OTP), overwrite it
    if existing and not existing.is_verified:
        db.session.delete(existing)
        db.session.commit()

    preferred = data.get('preferredName', '').strip() or data.get('name', '').strip().split()[0]

    new_user = User(
        name           = data.get('name', '').strip(),
        preferred_name = preferred,
        email          = data['email'].lower().strip(),
        password_hash  = generate_password_hash(data['password']),
        is_verified    = False,
    )
    db.session.add(new_user)
    db.session.commit()

    # Send OTP — if mail isn't configured, skip silently in dev mode
    try:
        send_otp(new_user.email, new_user.preferred_name, 'verify')
    except Exception as e:
        print(f"[Auth] Email not configured — OTP skipped: {e}")
        # In development without email, auto-verify so app still works
        new_user.is_verified = True
        db.session.commit()
        token = create_access_token(identity=str(new_user.id))
        return jsonify({
            'user':    new_user.to_dict(),
            'token':   token,
            'message': 'dev-mode: email not configured, auto-verified',
            'devMode': True,
        }), 201

    return jsonify({
        'message':  'Account created. Check your email for the verification code.',
        'email':    new_user.email,
        'needsOtp': True,
    }), 201


# ── Send OTP (resend or password reset) ───────────────────────────────────────
@auth_bp.route('/send-otp', methods=['POST'])
def send_otp_route():
    """
    POST /api/auth/send-otp
    Body: { email, purpose }  — purpose = 'verify' or 'reset'
    Sends or resends an OTP to the given email.
    """
    data    = request.get_json()
    email   = data.get('email', '').lower().strip()
    purpose = data.get('purpose', 'verify')

    user = User.query.filter_by(email=email).first()
    if not user:
        # Don't reveal whether email exists — security best practice
        return jsonify({'message': 'If that email exists, a code has been sent.'}), 200

    try:
        send_otp(email, user.preferred_name, purpose)
    except Exception as e:
        print(f"[Auth] Failed to send OTP: {e}")
        return jsonify({'error': 'Failed to send email. Check MAIL settings in .env'}), 500

    return jsonify({'message': 'Code sent. Check your email.'}), 200


# ── Verify OTP ────────────────────────────────────────────────────────────────
@auth_bp.route('/verify-otp', methods=['POST'])
def verify_otp():
    """
    POST /api/auth/verify-otp
    Body: { email, code, purpose }
    Verifies the OTP. On success:
      - purpose='verify' → marks user as verified, returns JWT token
      - purpose='reset'  → returns a short-lived reset token (no full login)
    """
    data    = request.get_json()
    email   = data.get('email', '').lower().strip()
    code    = data.get('code', '').strip()
    purpose = data.get('purpose', 'verify')

    # Find the OTP record
    otp = OTPCode.query.filter_by(email=email, code=code, purpose=purpose).first()

    if not otp:
        return jsonify({'error': 'Invalid code. Please check and try again.'}), 400

    # Check expiry — compare timezone-aware datetimes
    now = datetime.now(timezone.utc)
    # expires_at may be stored as naive UTC — make it aware
    exp = otp.expires_at
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    if now > exp:
        db.session.delete(otp)
        db.session.commit()
        return jsonify({'error': 'Code has expired. Please request a new one.'}), 400

    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found.'}), 404

    # Delete the used OTP
    db.session.delete(otp)

    if purpose == 'verify':
        user.is_verified = True
        db.session.commit()
        token = create_access_token(identity=str(user.id))
        return jsonify({'user': user.to_dict(), 'token': token}), 200

    elif purpose == 'reset':
        db.session.commit()
        # Return a short-lived reset token (15 mins) — only used for the reset step
        reset_token = create_access_token(
            identity=str(user.id),
            additional_claims={'purpose': 'reset'},
            expires_delta=timedelta(minutes=15),
        )
        return jsonify({'resetToken': reset_token}), 200


# ── Reset Password ────────────────────────────────────────────────────────────
@auth_bp.route('/reset-password', methods=['POST'])
@jwt_required()
def reset_password():
    """
    POST /api/auth/reset-password
    Header: Authorization: Bearer <resetToken>
    Body: { newPassword }
    Sets a new password. Only works with the reset token from verify-otp.
    """
    from flask_jwt_extended import get_jwt
    claims = get_jwt()
    if claims.get('purpose') != 'reset':
        return jsonify({'error': 'Invalid token for this action'}), 403

    data = request.get_json()
    new_pw = data.get('newPassword', '')
    if len(new_pw) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400

    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    user.password_hash = generate_password_hash(new_pw)
    db.session.commit()

    return jsonify({'message': 'Password updated successfully'}), 200


# ── Login ─────────────────────────────────────────────────────────────────────
@auth_bp.route('/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Body: { email, password }
    Returns JWT token if credentials are valid and email is verified.
    """
    data = request.get_json()
    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    user = User.query.filter_by(email=data['email'].lower().strip()).first()
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401

    # Block unverified users from logging in
    if not user.is_verified:
        return jsonify({
            'error':    'Please verify your email first.',
            'needsOtp': True,
            'email':    user.email,
        }), 403

    token = create_access_token(identity=str(user.id))
    return jsonify({'user': user.to_dict(), 'token': token}), 200


# ── Get current user ──────────────────────────────────────────────────────────
@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'user': user.to_dict()}), 200


# ── Update profile ────────────────────────────────────────────────────────────
@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """
    PUT /api/auth/profile
    Body: { preferredName, email }
    Updates profile and saves to DB properly.
    """
    user_id = int(get_jwt_identity())
    user    = User.query.get(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404

    data = request.get_json()
    if data.get('preferredName'):
        user.preferred_name = data['preferredName'].strip()
    if data.get('email'):
        # Check new email isn't taken by someone else
        new_email = data['email'].lower().strip()
        existing  = User.query.filter_by(email=new_email).first()
        if existing and existing.id != user.id:
            return jsonify({'error': 'Email already in use'}), 409
        user.email = new_email

    db.session.commit()
    return jsonify({'user': user.to_dict()}), 200
