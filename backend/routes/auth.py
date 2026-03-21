# routes/auth.py
#
# WHAT IS A BLUEPRINT?
# A Blueprint is Flask's way of splitting routes across multiple files.
# Instead of putting every route in app.py, we group related routes together.
# auth_bp handles everything user-related: register and login.
# tasks_bp (in tasks.py) handles everything task-related.
#
# WHAT IS A JWT TOKEN?
# JWT = JSON Web Token. It's a compact string that proves who you are.
# Structure: header.payload.signature
# Example: eyJhbG... (long encoded string)
#
# Flow:
#   1. User POSTs email + password to /api/auth/login
#   2. Flask checks the password, creates a JWT token containing the user's id
#   3. React stores the token in localStorage
#   4. Every future request React sends includes the token in the header:
#      Authorization: Bearer eyJhbG...
#   5. Flask verifies the token signature and knows which user is making the request
#
# The token is signed with JWT_SECRET_KEY — only your server can create valid tokens.

from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from app_instance import db
from models import User

# Blueprint name, and __name__ tells Flask where to find templates/static files
auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """
    POST /api/auth/register
    Body: { name, preferredName, email, password }
    Returns: { user, token }
    """
    # request.get_json() parses the JSON body React sent
    data = request.get_json()

    # Basic validation — always validate on the server even if React also validates
    if not data or not data.get('email') or not data.get('password'):
        # jsonify() turns a Python dict into a JSON HTTP response
        # 400 = Bad Request status code
        return jsonify({'error': 'Email and password are required'}), 400

    # Check if email already exists in the database
    # .filter_by() adds a WHERE clause: SELECT * FROM users WHERE email = ?
    # .first() returns the first result or None
    existing = User.query.filter_by(email=data['email'].lower()).first()
    if existing:
        return jsonify({'error': 'An account with this email already exists'}), 409  # 409 = Conflict

    # generate_password_hash() uses bcrypt to hash the password.
    # NEVER store plain text passwords. Hashing is a one-way operation —
    # you can verify a password against a hash but can't reverse the hash.
    hashed_pw = generate_password_hash(data['password'])

    new_user = User(
        name           = data.get('name', '').strip(),
        preferred_name = data.get('preferredName', data.get('name', '').split()[0]).strip(),
        email          = data['email'].lower().strip(),
        password_hash  = hashed_pw,
    )

    # db.session is like a "shopping cart" for database changes.
    # .add() stages the new user.
    # .commit() executes the INSERT and saves it permanently.
    db.session.add(new_user)
    db.session.commit()

    # create_access_token() creates the JWT.
    # identity is the user's id — this is what gets decoded on future requests.
    # str() because JWT identity must be a string.
    token = create_access_token(identity=str(new_user.id))

    # 201 = Created (more specific than 200 = OK, used for new resources)
    return jsonify({'user': new_user.to_dict(), 'token': token}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """
    POST /api/auth/login
    Body: { email, password }
    Returns: { user, token }
    """
    data = request.get_json()

    if not data or not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400

    # Find user by email
    user = User.query.filter_by(email=data['email'].lower().strip()).first()

    # check_password_hash() compares the plain password against the stored hash
    # If user not found OR password wrong, return the SAME error message.
    # Never tell the user which one was wrong — that leaks information.
    if not user or not check_password_hash(user.password_hash, data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401  # 401 = Unauthorized

    token = create_access_token(identity=str(user.id))
    return jsonify({'user': user.to_dict(), 'token': token}), 200


@auth_bp.route('/me', methods=['GET'])
def get_me():
    """
    GET /api/auth/me
    Returns the current user's profile.
    Protected — requires JWT token in Authorization header.
    React calls this on app load to check if the stored token is still valid.
    """
    from flask_jwt_extended import jwt_required, get_jwt_identity

    @jwt_required()
    def protected():
        user_id = get_jwt_identity()
        user    = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404
        return jsonify({'user': user.to_dict()}), 200

    return protected()


@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    """
    PUT /api/auth/profile
    Body: { preferredName, email }
    Updates the current user's profile details.
    """
    from flask_jwt_extended import jwt_required, get_jwt_identity

    @jwt_required()
    def protected():
        user_id = get_jwt_identity()
        user    = User.query.get(int(user_id))
        if not user:
            return jsonify({'error': 'User not found'}), 404

        data = request.get_json()
        if data.get('preferredName'):
            user.preferred_name = data['preferredName'].strip()
        if data.get('email'):
            user.email = data['email'].lower().strip()

        db.session.commit()
        return jsonify({'user': user.to_dict()}), 200

    return protected()
