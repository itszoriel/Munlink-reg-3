"""Authentication and authorization utilities."""
from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
from apps.api.models.user import User
from apps.api.models.token_blacklist import TokenBlacklist
from apps.api import db


def get_current_user():
    """Get the current authenticated user."""
    verify_jwt_in_request()
    user_id = get_jwt_identity()
    
    if not user_id:
        return None
    
    user = db.session.get(User, user_id)
    return user


def admin_required(fn):
    """Decorator to require admin role (accept legacy 'municipal_admin')."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = db.session.get(User, user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.role not in ('superadmin', 'provincial_admin', 'municipal_admin', 'barangay_admin'):
            return jsonify({'error': 'Admin access required', 'code': 'ROLE_MISMATCH'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


def verified_resident_required(fn):
    """Decorator to require verified resident (email verified at minimum)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = db.session.get(User, user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Strict resident role requirement
        if user.role != 'resident':
            return jsonify({'error': 'Resident account required', 'code': 'ROLE_MISMATCH'}), 403
        
        if not user.email_verified:
            return jsonify({'error': 'Email verification required'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


def fully_verified_required(fn):
    """Decorator to require fully verified resident (admin verified)."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = db.session.get(User, user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        # Must be a resident and fully verified
        if user.role != 'resident':
            return jsonify({'error': 'Resident account required', 'code': 'ROLE_MISMATCH'}), 403
        if not user.admin_verified:
            return jsonify({'error': 'Full verification required. Please submit ID documents for verification'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


def permission_required(permission: str):
    """Decorator to require specific permission."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()

            if not user_id:
                return jsonify({'error': 'Authentication required'}), 401

            user = db.session.get(User, user_id)

            if not user:
                return jsonify({'error': 'User not found'}), 404

            if not user.has_permission(permission):
                return jsonify({
                    'error': f'Permission denied: {permission} required',
                    'code': 'PERMISSION_DENIED'
                }), 403

            return fn(*args, **kwargs)

        return wrapper
    return decorator


def adult_required(fn):
    """Decorator to require user to be 18 or older."""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user_id = get_jwt_identity()
        
        if not user_id:
            return jsonify({'error': 'Authentication required'}), 401
        
        user = db.session.get(User, user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.is_under_18():
            return jsonify({'error': 'You must be 18 or older to access this feature'}), 403
        
        return fn(*args, **kwargs)
    
    return wrapper


def check_token_blacklist():
    """Check if the current token is blacklisted."""
    verify_jwt_in_request()
    jti = get_jwt()['jti']
    
    if TokenBlacklist.is_token_revoked(jti):
        return jsonify({'error': 'Token has been revoked'}), 401
    
    return None


def municipality_admin_required(municipality_id=None):
    """Decorator to require admin of a specific municipality (accept legacy 'municipal_admin')."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            
            if not user_id:
                return jsonify({'error': 'Authentication required'}), 401
            
            user = db.session.get(User, user_id)
            
            if not user:
                return jsonify({'error': 'User not found'}), 404
            
            if user.role not in ('superadmin', 'provincial_admin', 'municipal_admin', 'barangay_admin'):
                return jsonify({'error': 'Admin access required', 'code': 'ROLE_MISMATCH'}), 403
            
            # If specific municipality is required
            if municipality_id is not None:
                if user.admin_municipality_id != municipality_id:
                    return jsonify({'error': 'You do not have admin access to this municipality'}), 403
            
            return fn(*args, **kwargs)
        
        return wrapper
    
    return decorator


def roles_required(allowed_roles):
    """Role guard. Uses the current database role, never the JWT role claim."""
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user = db.session.get(User, get_jwt_identity())
            role = user.role if user is not None and user.is_active else None
            if role not in allowed_roles:
                return jsonify({'error': 'Forbidden', 'code': 'ROLE_MISMATCH'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def check_user_access_level(user, required_level):
    """
    Check if user meets required access level.
    
    Access levels (lowest to highest):
    - public
    - resident_under_18
    - resident_unverified
    - resident_email_verified
    - resident_fully_verified
    - admin
    """
    access_hierarchy = {
        'public': 0,
        'resident_under_18': 1,
        'resident_unverified': 2,
        'resident_email_verified': 3,
        'resident_fully_verified': 4,
        'admin': 5,
    }
    
    user_level = user.get_access_level()
    
    user_level_value = access_hierarchy.get(user_level, 0)
    required_level_value = access_hierarchy.get(required_level, 0)
    
    return user_level_value >= required_level_value


EMAIL_VERIFICATION_MAX_AGE_SECONDS = 24 * 60 * 60
_EMAIL_VERIFICATION_SALT = 'munlink-email-verification'
from apps.api.utils.session_guard import SESSION_TOKEN_TYPES  # noqa: E402,F401  (re-export)


def _email_fingerprint(email: str) -> str:
    import hashlib

    return hashlib.sha256((email or '').strip().lower().encode('utf-8')).hexdigest()[:16]


def _email_verification_serializer():
    from flask import current_app
    from itsdangerous import URLSafeTimedSerializer

    return URLSafeTimedSerializer(current_app.config['SECRET_KEY'], salt=_EMAIL_VERIFICATION_SALT)


def generate_verification_token(user_id, token_type='email', email=None):
    """Create a signed email-verification token.

    This is deliberately not a JWT: it can only verify an email address and is
    never accepted as a login/session token. It is bound to the email address it
    was sent to, so changing the address invalidates outstanding links.
    """
    if token_type != 'email':
        raise ValueError('Only email verification tokens are supported')
    payload = {'uid': int(user_id), 'em': _email_fingerprint(email or '')}
    return _email_verification_serializer().dumps(payload)


def read_verification_token(token):
    """Return ``(user_id, email_fingerprint)`` for a valid, unexpired token, else None."""
    from itsdangerous import BadSignature

    try:
        payload = _email_verification_serializer().loads(
            token, max_age=EMAIL_VERIFICATION_MAX_AGE_SECONDS
        )
    except BadSignature:  # includes SignatureExpired
        return None
    if not isinstance(payload, dict):
        return None
    try:
        user_id = int(payload.get('uid'))
    except (TypeError, ValueError):
        return None
    return user_id, str(payload.get('em') or '')


def verification_email_matches(fingerprint, email) -> bool:
    """True when a token's email fingerprint matches the account's current email."""
    import secrets

    return bool(fingerprint) and secrets.compare_digest(fingerprint, _email_fingerprint(email))


def verify_token_type(token_type):
    """Verify that the JWT has the correct type."""
    jwt_data = get_jwt()
    
    if jwt_data.get('type') != token_type:
        return False
    
    return True

