"""
MunLink Region 3 - Authentication Routes
User registration, login, email verification

Security: Critical endpoints have rate limiting applied to prevent:
- Brute force attacks on login
- Credential stuffing
- Spam account creation
- Email verification abuse
"""
from flask import Blueprint, request, jsonify, current_app
from sqlalchemy import func
import sqlite3
from sqlalchemy.exc import OperationalError as SAOperationalError, ProgrammingError as SAProgrammingError
from flask_jwt_extended import (
    create_access_token, 
    create_refresh_token, 
    jwt_required, 
    get_jwt_identity, 
    get_jwt,
    decode_token,
    set_refresh_cookies,
    unset_jwt_cookies,
)
from datetime import datetime, timedelta
try:
    from apps.api import db
except ImportError:
    from __init__ import db
try:
    from apps.api.app import limiter
except ImportError:
    try:
        from app import limiter
    except ImportError:
        limiter = None
import bcrypt
try:
    from apps.api.models.user import User
except ImportError:
    from models.user import User
try:
    from apps.api.models.municipality import Municipality
except ImportError:
    from models.municipality import Municipality
try:
    from apps.api.models.transfer import TransferRequest
except ImportError:
    from models.transfer import TransferRequest
try:
    from apps.api.models.token_blacklist import TokenBlacklist
except ImportError:
    from models.token_blacklist import TokenBlacklist
try:
    from apps.api.utils import (
        validate_email,
        validate_username,
        validate_password,
        validate_phone,
        validate_name,
        validate_date_of_birth,
        ValidationError,
        generate_verification_token,
        save_profile_picture,
        save_verification_document,
    )
except ImportError:
    from utils import (
        validate_email,
        validate_username,
        validate_password,
        validate_phone,
        validate_name,
        validate_date_of_birth,
        ValidationError,
        generate_verification_token,
        save_profile_picture,
        save_verification_document,
    )

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')


# Rate limiting helper - applies limiter if available
def _limit(limit_string):
    """Apply rate limit if limiter is available."""
    def decorator(f):
        if limiter:
            return limiter.limit(limit_string)(f)
        return f
    return decorator


@auth_bp.route('/register', methods=['POST'])
@_limit("5 per hour")  # Prevent spam account creation
def register():
    """Register a new resident account (Gmail-only, email verification required)."""
    try:
        is_multipart = request.content_type and 'multipart/form-data' in request.content_type
        data = request.form.to_dict() if is_multipart else request.get_json()
        
        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name', 'date_of_birth']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400
        
        # Validate and sanitize inputs
        username = validate_username(data['username']).lower()
        email = validate_email(data['email']).lower()
        # Gmail-only enforcement
        if not (email.endswith('@gmail.com') or email.endswith('@googlemail.com')):
            return jsonify({'error': 'Registration requires a Gmail address'}), 400
        password = validate_password(data['password'])
        first_name = validate_name(data['first_name'], 'first_name')
        last_name = validate_name(data['last_name'], 'last_name')
        date_of_birth = validate_date_of_birth(data['date_of_birth'])
        
        # Optional fields
        middle_name = validate_name(data.get('middle_name'), 'middle_name') if data.get('middle_name') else None
        suffix = data.get('suffix')
        phone_number = validate_phone(data.get('phone_number'))
        municipality_slug = data.get('municipality_slug')
        barangay_id_raw = data.get('barangay_id')
        
        # Get municipality ID from slug
        municipality_id = None
        if municipality_slug:
            municipality = Municipality.query.filter_by(slug=municipality_slug).first()
            if municipality:
                municipality_id = municipality.id
        # Validate optional barangay_id belongs to municipality if both provided
        barangay_id = None
        if barangay_id_raw is not None and str(barangay_id_raw).strip() != '':
            try:
                from apps.api.models.municipality import Barangay
            except ImportError:
                from models.municipality import Barangay
            try:
                bid = int(barangay_id_raw)
            except Exception:
                bid = None
            if bid:
                b = Barangay.query.get(bid)
                if b and (not municipality_id or b.municipality_id == municipality_id):
                    barangay_id = bid
        
        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already taken'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create new user as resident
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            middle_name=middle_name,
            last_name=last_name,
            suffix=suffix,
            date_of_birth=date_of_birth,
            phone_number=phone_number,
            municipality_id=municipality_id,
            barangay_id=barangay_id,
            role='resident'
        )
        
        db.session.add(user)
        db.session.flush()  # obtain user.id without committing

        # Optional uploads at registration: profile picture and verification docs if provided
        if request.files:
            municipality_slug_safe = municipality_slug or 'general'
            profile = request.files.get('profile_picture')
            if profile and getattr(profile, 'filename', ''):
                path = save_profile_picture(profile, user.id, municipality_slug_safe, user_type='residents')
                user.profile_picture = path

            id_front = request.files.get('valid_id_front')
            if id_front and getattr(id_front, 'filename', ''):
                user.valid_id_front = save_verification_document(id_front, user.id, municipality_slug_safe, 'valid_id_front', user_type='residents')

            id_back = request.files.get('valid_id_back')
            if id_back and getattr(id_back, 'filename', ''):
                user.valid_id_back = save_verification_document(id_back, user.id, municipality_slug_safe, 'valid_id_back', user_type='residents')

            selfie = request.files.get('selfie_with_id')
            if selfie and getattr(selfie, 'filename', ''):
                user.selfie_with_id = save_verification_document(selfie, user.id, municipality_slug_safe, 'selfie_with_id', user_type='residents')

        db.session.commit()

        # Generate email verification token
        verification_token = generate_verification_token(user.id, 'email')
        # Send verification email
        email_sent = False
        email_error = None
        try:
            from apps.api.utils.email_sender import send_verification_email
            web_url = current_app.config.get('WEB_URL', 'http://localhost:5173')
            verify_link = f"{web_url}/verify-email?token={verification_token}"
            send_verification_email(user.email, verify_link)
            email_sent = True
        except Exception as e:
            # Log the error for debugging - this is critical for diagnosing email issues
            import traceback
            current_app.logger.error(f"Failed to send verification email to {user.email}: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            email_error = str(e)
            email_sent = False

        resp = {
            'message': 'Registration successful. Please check your Gmail to verify your account.',
            'user': user.to_dict(),
            'email_sent': email_sent,  # Always include this for debugging
        }
        # Include error details in debug mode
        if current_app.config.get('DEBUG') and email_error:
            resp['email_error'] = email_error
        
        # Warn if email wasn't sent
        if not email_sent:
            resp['warning'] = 'Verification email could not be sent. Please use the resend verification option.'
            current_app.logger.warning(f"Registration completed but email NOT sent for user {user.email}")
        
        return jsonify(resp), 201
    
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500


@auth_bp.route('/login', methods=['POST'])
@_limit("10 per minute")  # Critical: prevent brute force attacks
def login():
    """Login and get access tokens with token family tracking for rotation."""
    try:
        data = request.get_json()
        
        # Get credentials
        username_or_email = data.get('username') or data.get('email')
        password = data.get('password')
        
        if not username_or_email or not password:
            return jsonify({'error': 'Username/email and password are required'}), 400
        
        # Find user by username or email (case-insensitive)
        ue = (username_or_email or '').lower()
        user = User.query.filter(
            (func.lower(User.username) == ue) |
            (func.lower(User.email) == ue)
        ).first()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check if account is active
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Create refresh token (token rotation is optional - gracefully degrade if tables don't exist)
        refresh_token = None
        try:
            from apps.api.models.refresh_token import RefreshTokenFamily, RefreshToken
            
            # Create token family for this session (for token rotation tracking)
            family = RefreshTokenFamily.create_family(
                user_id=user.id,
                user_agent=request.headers.get('User-Agent'),
                ip_address=request.remote_addr,
            )
            db.session.flush()  # Get family ID
            
            # Create refresh token with family_id in claims
            refresh_expires = timedelta(days=30)
            refresh_token = create_refresh_token(
                identity=str(user.id),
                expires_delta=refresh_expires,
                additional_claims={
                    "role": user.role,
                    "family_id": family.family_id,
                }
            )
            
            # Track the refresh token JTI
            refresh_jti = decode_token(refresh_token)['jti']
            RefreshToken.create_token(
                jti=refresh_jti,
                family=family,
                expires_at=datetime.utcnow() + refresh_expires,
            )
        except ImportError:
            # Token rotation models not available, fall back to simple refresh token
            current_app.logger.debug("Token rotation not available (ImportError)")
        except Exception as e:
            # Token rotation failed (likely table doesn't exist), fall back to simple refresh token
            db.session.rollback()
            current_app.logger.warning(f"Token rotation setup failed (falling back to simple token): {e}")
        
        # If token rotation failed or wasn't available, create simple refresh token
        if refresh_token is None:
            refresh_token = create_refresh_token(
                identity=str(user.id),
                expires_delta=timedelta(days=30),
                additional_claims={"role": user.role}
            )
        
        db.session.commit()
        
        # Create access token (subject must be a string) with role claim
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=1),
            additional_claims={"role": user.role}
        )
        
        resp = jsonify({
            'message': 'Login successful',
            'access_token': access_token,
            # refresh token is set via HttpOnly cookie for security
            'user': user.to_dict(include_sensitive=True, include_municipality=True)
        })
        # Set refresh token in HttpOnly cookie (domain/path controlled by config)
        set_refresh_cookies(resp, refresh_token)
        return resp, 200
    
    except Exception as e:
        db.session.rollback()
        # Log the error for debugging
        import traceback
        try:
            current_app.logger.error(f"Login error: {str(e)}")
            current_app.logger.error(traceback.format_exc())
        except:
            pass
        
        # Create error response with CORS headers
        response = jsonify({'error': 'Login failed', 'details': str(e) if current_app.config.get('DEBUG') else None})
        # Add CORS headers manually as backup (after_request should also add them)
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 500


@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout and blacklist the current token, invalidating the session family."""
    try:
        jwt_data = get_jwt()
        jti = jwt_data.get('jti')
        user_id = get_jwt_identity()
        token_type = jwt_data.get('type', 'access')
        family_id = jwt_data.get('family_id')
        
        # Calculate expiration time
        expires_delta = timedelta(hours=1) if token_type == 'access' else timedelta(days=30)
        expires_at = datetime.utcnow() + expires_delta
        
        # Add token to blacklist
        TokenBlacklist.add_token_to_blacklist(jti, token_type, user_id, expires_at)
        
        # Invalidate the entire token family if present (prevents any refresh tokens in this session)
        try:
            from apps.api.models.refresh_token import RefreshTokenFamily
            
            if family_id:
                family = RefreshTokenFamily.query.filter_by(family_id=family_id, is_active=True).first()
                if family:
                    family.invalidate('logout')
                    db.session.commit()
        except ImportError:
            pass
        except Exception as e:
            current_app.logger.warning(f"Failed to invalidate token family on logout: {e}")
        
        resp = jsonify({'message': 'Logout successful'})
        # Clear JWT cookies (access/refresh) if present
        unset_jwt_cookies(resp)
        return resp, 200
    
    except Exception as e:
        return jsonify({'error': 'Logout failed', 'details': str(e)}), 500


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token using refresh token with rotation.
    
    Security: Implements token rotation to detect and prevent token theft.
    - Each refresh token can only be used once
    - Reusing an old token invalidates the entire session family
    - A new refresh token is issued with each refresh
    """
    try:
        user_id = get_jwt_identity()
        jwt_data = get_jwt()
        old_jti = jwt_data.get('jti')
        family_id = jwt_data.get('family_id')
        
        # Include current role in refreshed token
        try:
            uid = int(user_id) if isinstance(user_id, str) else user_id
        except Exception:
            uid = user_id
        user = User.query.get(uid)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        role = getattr(user, 'role', None) or 'public'
        
        # Token rotation with theft detection
        new_refresh_token = None
        try:
            from apps.api.models.refresh_token import RefreshTokenFamily, RefreshToken
            
            if old_jti:
                # Validate the old token and check for reuse
                is_valid, error_reason, old_token = RefreshToken.is_token_valid(old_jti)
                
                if not is_valid:
                    if error_reason == 'reuse_detected':
                        # SECURITY: Token reuse detected! Session compromised.
                        current_app.logger.warning(
                            f"Token reuse detected for user {uid}. "
                            f"Family invalidated. Possible token theft."
                        )
                        return jsonify({
                            'error': 'Session invalidated for security',
                            'code': 'TOKEN_REUSE_DETECTED'
                        }), 401
                    elif error_reason == 'family_invalid':
                        return jsonify({
                            'error': 'Session expired. Please login again.',
                            'code': 'SESSION_EXPIRED'
                        }), 401
                    else:
                        return jsonify({
                            'error': 'Invalid refresh token',
                            'code': 'INVALID_TOKEN'
                        }), 401
                
                # Mark old token as used
                old_token.mark_used()
                
                # Create new refresh token in the same family
                family = old_token.family
                refresh_expires = timedelta(days=30)
                new_refresh_token = create_refresh_token(
                    identity=str(user_id),
                    expires_delta=refresh_expires,
                    additional_claims={
                        "role": role,
                        "family_id": family.family_id,
                    }
                )
                
                # Track the new refresh token
                new_jti = decode_token(new_refresh_token)['jti']
                RefreshToken.create_token(
                    jti=new_jti,
                    family=family,
                    expires_at=datetime.utcnow() + refresh_expires,
                )
                
                db.session.commit()
            else:
                # No JTI - legacy token without rotation, just create access token
                pass
                
        except ImportError:
            # Token rotation models not available
            pass
        except Exception as e:
            db.session.rollback()
            current_app.logger.warning(f"Token rotation error: {e}")
            # Continue without rotation - better UX than failing

        # Create new access token (subject must be a string)
        access_token = create_access_token(
            identity=str(user_id),
            expires_delta=timedelta(hours=1),
            additional_claims={"role": role}
        )
        
        response_data = {'access_token': access_token}
        resp = jsonify(response_data)
        
        # Set new refresh token cookie if rotation occurred
        if new_refresh_token:
            set_refresh_cookies(resp, new_refresh_token)
        
        return resp, 200
    
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Token refresh failed: {e}")
        return jsonify({
            'error': 'Token refresh failed',
            'details': str(e) if current_app.config.get('DEBUG') else None
        }), 500


@auth_bp.route('/admin/login', methods=['POST'])
@_limit("10 per minute")  # Rate limit admin login attempts
def admin_login():
    """Admin login - same as regular login but validates admin role.
    
    This is a convenience endpoint for the admin panel.
    Returns 403 if user is not an admin.
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Request body is required'}), 400
        
        username_or_email = data.get('username') or data.get('email')
        password = data.get('password')
        
        if not username_or_email or not password:
            return jsonify({'error': 'Username/email and password are required'}), 400
        
        # Find user by username or email (case-insensitive)
        user = User.query.filter(
            db.or_(
                db.func.lower(User.username) == username_or_email.lower(),
                db.func.lower(User.email) == username_or_email.lower()
            )
        ).first()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Check password
        if not bcrypt.checkpw(password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # ADMIN CHECK: Verify user has admin role
        if user.role not in ('admin', 'superadmin'):
            return jsonify({'error': 'Access denied. Admin privileges required.'}), 403
        
        # Check if account is active
        if not user.is_active:
            return jsonify({'error': 'Account is deactivated'}), 403
        
        # Update last login
        user.last_login = datetime.utcnow()
        
        # Create refresh token (token rotation is optional)
        refresh_token = None
        try:
            from apps.api.models.refresh_token import RefreshTokenFamily, RefreshToken
            
            family = RefreshTokenFamily.create_family(
                user_id=user.id,
                user_agent=request.headers.get('User-Agent'),
                ip_address=request.remote_addr,
            )
            db.session.flush()
            
            refresh_expires = timedelta(days=30)
            refresh_token = create_refresh_token(
                identity=str(user.id),
                expires_delta=refresh_expires,
                additional_claims={
                    "role": user.role,
                    "family_id": family.family_id,
                }
            )
            
            refresh_jti = decode_token(refresh_token)['jti']
            RefreshToken.create_token(
                jti=refresh_jti,
                family=family,
                expires_at=datetime.utcnow() + refresh_expires,
            )
        except ImportError:
            current_app.logger.debug("Token rotation not available")
        except Exception as e:
            db.session.rollback()
            current_app.logger.warning(f"Token rotation failed: {e}")
        
        if refresh_token is None:
            refresh_token = create_refresh_token(
                identity=str(user.id),
                expires_delta=timedelta(days=30),
                additional_claims={"role": user.role}
            )
        
        db.session.commit()
        
        # Create access token
        access_token = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=1),
            additional_claims={"role": user.role}
        )
        
        resp = jsonify({
            'message': 'Admin login successful',
            'access_token': access_token,
            'user': user.to_dict(include_sensitive=True, include_municipality=True)
        })
        set_refresh_cookies(resp, refresh_token)
        return resp, 200
    
    except Exception as e:
        db.session.rollback()
        import traceback
        current_app.logger.error(f"Admin login error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        
        response = jsonify({
            'error': 'Login failed',
            'details': str(e) if current_app.config.get('DEBUG') else None
        })
        origin = request.headers.get('Origin')
        if origin:
            response.headers['Access-Control-Allow-Origin'] = origin
            response.headers['Access-Control-Allow-Credentials'] = 'true'
        return response, 500


@auth_bp.route('/admin/register', methods=['POST'])
@_limit("3 per hour")  # Strict limit on admin account creation
def admin_register():
    """Create a municipal admin account (separate admin site).
    Requires ADMIN_SECRET_KEY to be provided in the request body as 'admin_secret'.
    Accepts admin_municipality_id or admin_municipality_slug to scope the admin.
    """
    try:
        is_multipart = request.content_type and 'multipart/form-data' in request.content_type
        data = request.form.to_dict() if is_multipart else request.get_json()

        admin_secret = data.get('admin_secret')
        if not admin_secret:
            return jsonify({'error': 'admin_secret is required'}), 400
        if admin_secret != current_app.config.get('ADMIN_SECRET_KEY'):
            return jsonify({'error': 'Invalid admin secret'}), 401

        # Validate required fields
        required_fields = ['username', 'email', 'password', 'first_name', 'last_name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'{field} is required'}), 400

        # Validate and sanitize inputs
        username = validate_username(data['username']).lower()
        email = validate_email(data['email']).lower()
        password = validate_password(data['password'])
        first_name = validate_name(data['first_name'], 'first_name')
        middle_name = validate_name(data.get('middle_name'), 'middle_name') if data.get('middle_name') else None
        last_name = validate_name(data['last_name'], 'last_name')

        admin_municipality_id = data.get('admin_municipality_id')
        admin_municipality_slug = data.get('admin_municipality_slug')

        if admin_municipality_slug and not admin_municipality_id:
            mun = Municipality.query.filter_by(slug=admin_municipality_slug).first()
            if not mun:
                return jsonify({'error': 'Invalid municipality slug'}), 400
            admin_municipality_id = mun.id

        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username already taken'}), 409
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email already registered'}), 409

        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Create admin user
        user = User(
            username=username,
            email=email,
            password_hash=password_hash,
            first_name=first_name,
            last_name=last_name,
            role='municipal_admin',
            email_verified=True,
            admin_verified=True,
            admin_municipality_id=admin_municipality_id,
        )

        db.session.add(user)
        db.session.flush()

        # Require ID uploads via multipart for admin
        if not is_multipart:
            db.session.rollback()
            return jsonify({'error': 'Admin registration requires Valid ID Front and Back uploaded as files (multipart/form-data)'}), 400

        if request.files:
            municipality_slug = data.get('admin_municipality_slug') or 'general'

            # Validate required IDs
            id_front = request.files.get('valid_id_front')
            id_back = request.files.get('valid_id_back')
            if not (id_front and getattr(id_front, 'filename', '')) or not (id_back and getattr(id_back, 'filename', '')):
                db.session.rollback()
                return jsonify({'error': 'Valid ID Front and Back are required for admin registration'}), 400

            # Optional profile
            profile = request.files.get('profile_picture')
            if profile and getattr(profile, 'filename', ''):
                user.profile_picture = save_profile_picture(profile, user.id, municipality_slug, user_type='admins')

            user.valid_id_front = save_verification_document(id_front, user.id, municipality_slug, 'valid_id_front', user_type='admins')
            user.valid_id_back = save_verification_document(id_back, user.id, municipality_slug, 'valid_id_back', user_type='admins')

        db.session.commit()

        return jsonify({
            'message': 'Admin account created successfully',
            'user': user.to_dict(include_sensitive=True, include_municipality=True)
        }), 201

    except ValidationError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        # Log the full error for debugging
        import traceback
        current_app.logger.error(f"Admin registration error: {str(e)}")
        current_app.logger.error(traceback.format_exc())
        return jsonify({'error': 'Admin registration failed', 'details': str(e)}), 500


@auth_bp.route('/verify-email/<token>', methods=['GET'])
def verify_email(token):
    """Verify user email with token."""
    try:
        # Decode the token
        decoded = decode_token(token)
        # flask_jwt_extended changed sub to string; identity is in sub
        user_id = decoded.get('sub') or decoded.get('user_id')
        token_type = decoded.get('type')
        
        if token_type != 'email':
            return jsonify({'error': 'Invalid verification token'}), 400
        
        # Find user
        try:
            uid = int(user_id) if isinstance(user_id, str) else user_id
        except Exception:
            uid = user_id
        user = User.query.get(uid)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user.email_verified:
            return jsonify({'message': 'Email already verified'}), 200
        
        # Verify email
        user.email_verified = True
        user.email_verified_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Email verified successfully'}), 200
    
    except Exception as e:
        return jsonify({'error': 'Email verification failed', 'details': str(e)}), 400


@auth_bp.route('/resend-verification', methods=['POST'])
@jwt_required()
def resend_verification_email():
    """Resend the email verification link to the authenticated user."""
    try:
        user_id = get_jwt_identity()
        # user_id may be a string
        try:
            uid = int(user_id) if isinstance(user_id, str) else user_id
        except Exception:
            uid = user_id

        user = User.query.get(uid)
        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.email_verified:
            return jsonify({'message': 'Email already verified'}), 200

        verification_token = generate_verification_token(user.id, 'email')
        email_sent = False
        email_error = None
        try:
            from apps.api.utils.email_sender import send_verification_email
            web_url = current_app.config.get('WEB_URL', 'http://localhost:5173')
            verify_link = f"{web_url}/verify-email?token={verification_token}"
            send_verification_email(user.email, verify_link)
            email_sent = True
        except Exception as e:
            import traceback
            current_app.logger.error(f"Failed to resend verification email to {user.email}: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            email_error = str(e)
            email_sent = False

        resp = {'message': 'Verification email sent' if email_sent else 'Failed to send verification email'}
        resp['email_sent'] = email_sent
        if current_app.config.get('DEBUG') and email_error:
            resp['email_error'] = email_error
        return jsonify(resp), 200 if email_sent else 500

    except Exception as e:
        return jsonify({'error': 'Failed to resend verification email', 'details': str(e)}), 400


@auth_bp.route('/resend-verification-public', methods=['POST'])
@_limit("3 per hour")  # Prevent email spam/enumeration attacks
def resend_verification_email_public():
    """Public endpoint to resend email verification link by email address.
    Always returns 200 to avoid account enumeration.
    """
    try:
        data = request.get_json(silent=True) or {}
        email = (data.get('email') or '').strip().lower()
        if not email:
            return jsonify({'error': 'Email is required'}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({'message': 'If an account exists, a verification email has been sent'}), 200

        if user.email_verified:
            return jsonify({'message': 'Email already verified'}), 200

        verification_token = generate_verification_token(user.id, 'email')
        email_sent = False
        email_error = None
        try:
            from apps.api.utils.email_sender import send_verification_email
            web_url = current_app.config.get('WEB_URL', 'http://localhost:5173')
            verify_link = f"{web_url}/verify-email?token={verification_token}"
            send_verification_email(user.email, verify_link)
            email_sent = True
        except Exception as e:
            import traceback
            current_app.logger.error(f"Failed to send verification email (public) to {user.email}: {str(e)}")
            current_app.logger.error(traceback.format_exc())
            email_error = str(e)
            email_sent = False

        resp = {'message': 'If an account exists, a verification email has been sent'}
        if current_app.config.get('DEBUG'):
            resp['email_sent'] = email_sent
            if email_error:
                resp['email_error'] = email_error
        return jsonify(resp), 200
    except Exception as e:
        return jsonify({'error': 'Failed to resend verification email', 'details': str(e)}), 400

@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get current user profile."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user.to_dict(include_sensitive=True, include_municipality=True)), 200
    
    except Exception as e:
        return jsonify({'error': 'Failed to get profile', 'details': str(e)}), 500


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update current user profile."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = validate_name(data['first_name'], 'first_name')
        
        if 'middle_name' in data:
            user.middle_name = validate_name(data['middle_name'], 'middle_name') if data['middle_name'] else None
        
        if 'last_name' in data:
            user.last_name = validate_name(data['last_name'], 'last_name')
        
        if 'suffix' in data:
            user.suffix = data['suffix']
        
        if 'phone_number' in data:
            user.phone_number = validate_phone(data['phone_number'])
        
        if 'street_address' in data:
            user.street_address = data['street_address']
        
        # Location updates
        if 'barangay_id' in data:
            try:
                from apps.api.models.municipality import Barangay
            except ImportError:
                from models.municipality import Barangay
            bid = data.get('barangay_id')
            try:
                bid_int = int(bid) if bid is not None else None
            except Exception:
                bid_int = None
            if bid_int is not None:
                # Only allow barangay within user's municipality
                b = Barangay.query.get(bid_int)
                if not b or (user.municipality_id and b.municipality_id != user.municipality_id):
                    return jsonify({'error': 'Invalid barangay for your municipality'}), 400
                user.barangay_id = bid_int

        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict(include_sensitive=True, include_municipality=True)
        }), 200
    
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to update profile', 'details': str(e)}), 500


@auth_bp.route('/profile/photo', methods=['POST'])
@jwt_required()
def upload_profile_photo():
    """Upload or replace current user's profile photo (admins and residents)."""
    try:
        user_id = get_jwt_identity()
        try:
            uid = int(user_id) if isinstance(user_id, str) else user_id
        except Exception:
            uid = user_id
        user = User.query.get(uid)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if not (request.content_type and 'multipart/form-data' in request.content_type):
            return jsonify({'error': 'File must be uploaded as multipart/form-data'}), 400

        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400

        f = request.files['file']
        if not getattr(f, 'filename', ''):
            return jsonify({'error': 'Invalid file'}), 400

        # Determine scope for storage path
        municipality_slug = None
        try:
            if getattr(user, 'admin_municipality_id', None):
                mun = Municipality.query.get(user.admin_municipality_id)
                municipality_slug = getattr(mun, 'slug', None)
            if not municipality_slug and getattr(user, 'municipality_id', None):
                mun = Municipality.query.get(user.municipality_id)
                municipality_slug = getattr(mun, 'slug', None)
        except Exception:
            municipality_slug = None

        category = 'admins' if str(getattr(user, 'role', '')).startswith('admin') or getattr(user, 'role', '') == 'municipal_admin' else 'residents'
        rel_path = save_profile_picture(f, user.id, municipality_slug or 'general', user_type=category)
        user.profile_picture = rel_path
        user.updated_at = datetime.utcnow()
        db.session.commit()

        return jsonify({'message': 'Profile photo updated', 'user': user.to_dict(include_sensitive=True, include_municipality=True)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to upload profile photo', 'details': str(e)}), 500


@auth_bp.route('/profile/photo', methods=['DELETE'])
@jwt_required()
def delete_profile_photo():
    """Remove current user's profile photo reference (does not delete file)."""
    try:
        user_id = get_jwt_identity()
        try:
            uid = int(user_id) if isinstance(user_id, str) else user_id
        except Exception:
            uid = user_id
        user = User.query.get(uid)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        user.profile_picture = None
        user.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'message': 'Profile photo removed', 'user': user.to_dict(include_sensitive=True, include_municipality=True)}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to remove profile photo', 'details': str(e)}), 500


@auth_bp.route('/verification-docs', methods=['POST'])
@jwt_required()
def upload_verification_docs():
    """Upload resident verification documents after email verification.

    Accepts multipart/form-data with any of: valid_id_front, valid_id_back, selfie_with_id.
    """
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)

        if not user:
            return jsonify({'error': 'User not found'}), 404

        if user.role == 'public':
            return jsonify({'error': 'Resident account required'}), 403

        if not user.email_verified:
            return jsonify({'error': 'Please verify your email first'}), 403

        if not (request.content_type and 'multipart/form-data' in request.content_type):
            return jsonify({'error': 'Files must be uploaded as multipart/form-data'}), 400

        municipality_slug = request.form.get('municipality_slug') or 'general'

        # Check if user already has ID documents uploaded
        existing_ids = bool(user.valid_id_front or user.valid_id_back)
        
        # Save provided files (optional)
        saved_any = False

        id_front = request.files.get('valid_id_front')
        if id_front and getattr(id_front, 'filename', ''):
            user.valid_id_front = save_verification_document(id_front, user.id, municipality_slug, 'valid_id_front', user_type='residents')
            saved_any = True

        id_back = request.files.get('valid_id_back')
        if id_back and getattr(id_back, 'filename', ''):
            user.valid_id_back = save_verification_document(id_back, user.id, municipality_slug, 'valid_id_back', user_type='residents')
            saved_any = True

        selfie = request.files.get('selfie_with_id')
        if selfie and getattr(selfie, 'filename', ''):
            user.selfie_with_id = save_verification_document(selfie, user.id, municipality_slug, 'selfie_with_id', user_type='residents')
            saved_any = True

        if not saved_any:
            return jsonify({'error': 'Please upload at least one verification file'}), 400

        user.updated_at = datetime.utcnow()
        db.session.commit()

        if existing_ids:
            message = 'Verification documents updated. Your account is pending admin review.'
        else:
            message = 'Verification documents uploaded. Your account is pending admin review.'

        return jsonify({
            'message': message,
            'user': user.to_dict(include_sensitive=True)
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to upload verification documents', 'details': str(e)}), 500


@auth_bp.route('/change-password', methods=['POST'])
@jwt_required()
@_limit("5 per hour")  # Limit password change attempts
def change_password():
    """Change user password."""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not current_password or not new_password:
            return jsonify({'error': 'Current password and new password are required'}), 400
        
        # Verify current password
        if not bcrypt.checkpw(current_password.encode('utf-8'), user.password_hash.encode('utf-8')):
            return jsonify({'error': 'Current password is incorrect'}), 401
        
        # Validate new password
        new_password = validate_password(new_password)
        
        # Hash and update password
        user.password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        user.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'message': 'Password changed successfully'}), 200
    
    except ValidationError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to change password', 'details': str(e)}), 500


@auth_bp.route('/transfer', methods=['POST'])
@jwt_required()
def request_transfer():
    """Resident-initiated transfer to another municipality."""
    try:
        user_id = get_jwt_identity()
        try:
            uid = int(user_id) if isinstance(user_id, str) else user_id
        except Exception:
            uid = user_id
        user = User.query.get(uid)
        if not user or user.role != 'resident':
            return jsonify({'error': 'Resident access required'}), 403
        data = request.get_json() or {}
        to_municipality_id = int(data.get('to_municipality_id') or 0)
        to_barangay_id = data.get('to_barangay_id')
        if to_barangay_id:
            try:
                to_barangay_id = int(to_barangay_id)
            except (ValueError, TypeError):
                to_barangay_id = None
        else:
            to_barangay_id = None
        notes = (data.get('notes') or '').strip()
        
        if not to_municipality_id:
            return jsonify({'error': 'to_municipality_id is required'}), 400
        if not to_barangay_id:
            return jsonify({'error': 'to_barangay_id is required'}), 400
        if not notes:
            return jsonify({'error': 'notes is required'}), 400
        if not user.municipality_id:
            return jsonify({'error': 'Your current municipality is not set'}), 400
        if int(user.municipality_id) == to_municipality_id:
            return jsonify({'error': 'You are already in this municipality'}), 400
        # Validate both current and target municipalities exist
        if not Municipality.query.get(user.municipality_id):
            return jsonify({'error': 'Your current municipality record no longer exists'}), 400
        target_municipality = Municipality.query.get(to_municipality_id)
        if not target_municipality:
            return jsonify({'error': 'Target municipality not found'}), 404
        # Validate barangay belongs to target municipality if provided
        if to_barangay_id:
            from apps.api.models.municipality import Barangay
            barangay = Barangay.query.get(to_barangay_id)
            if not barangay:
                return jsonify({'error': 'Target barangay not found'}), 404
            if barangay.municipality_id != to_municipality_id:
                return jsonify({'error': 'Barangay does not belong to the selected municipality'}), 400
        # Prevent duplicate open requests
        existing = TransferRequest.query.filter(
            TransferRequest.user_id == user.id,
            TransferRequest.status.in_(['pending','approved'])
        ).first()
        if existing:
            return jsonify({'error': 'You already have an active transfer request'}), 400
        t = TransferRequest(
            user_id=user.id,
            from_municipality_id=user.municipality_id,
            to_municipality_id=to_municipality_id,
            to_barangay_id=to_barangay_id,
            status='pending',
            notes=notes,
        )
        db.session.add(t)
        db.session.commit()
        return jsonify({'message': 'Transfer request submitted', 'transfer': t.to_dict()}), 201
    except (sqlite3.OperationalError, SAOperationalError, SAProgrammingError) as e:
        # Attempt to auto-initialize missing tables (first-run convenience)
        try:
            db.create_all()
            # retry once
            try:
                user_id = get_jwt_identity()
                user = User.query.get(user_id)
                data = request.get_json() or {}
                to_municipality_id = int(data.get('to_municipality_id') or 0)
                to_barangay_id = data.get('to_barangay_id')
                if to_barangay_id:
                    try:
                        to_barangay_id = int(to_barangay_id)
                    except (ValueError, TypeError):
                        to_barangay_id = None
                else:
                    to_barangay_id = None
                notes = (data.get('notes') or '').strip()
                t = TransferRequest(
                    user_id=user.id,
                    from_municipality_id=user.municipality_id,
                    to_municipality_id=to_municipality_id,
                    to_barangay_id=to_barangay_id,
                    status='pending',
                    notes=notes,
                )
                db.session.add(t)
                db.session.commit()
                return jsonify({'message': 'Transfer request submitted', 'transfer': t.to_dict()}), 201
            except Exception as retry_err:
                db.session.rollback()
                return jsonify({'error': 'Failed to submit transfer', 'details': str(retry_err)}), 500
        except Exception as init_err:
            return jsonify({'error': 'Transfer feature not initialized', 'details': str(init_err)}), 500
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': 'Failed to submit transfer', 'details': str(e)}), 500
