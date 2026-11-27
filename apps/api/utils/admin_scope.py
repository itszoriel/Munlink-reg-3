"""
Database-backed admin identity and resident scope.

Authorization never trusts the role claim inside a JWT: a token proves who the
caller is, and the current database row decides what they may do. A demoted or
deactivated admin therefore loses access on their next request, not when their
token expires.

Scope rules (see docs/PERMISSIONS.md):
- superadmin and provincial_admin: Zambales-wide
- municipal_admin: their ``admin_municipality_id``
- barangay_admin: their ``admin_barangay_id`` (inside their municipality)
"""
from __future__ import annotations

from typing import Optional

from flask import has_request_context, request
from flask_jwt_extended import get_jwt_identity

from apps.api import db
from apps.api.models.municipality import Barangay
from apps.api.models.user import User
from apps.api.utils.zambales_scope import ZAMBALES_MUNICIPALITY_IDS, is_valid_zambales_municipality

ADMIN_ROLES = ('superadmin', 'provincial_admin', 'municipal_admin', 'barangay_admin')
_CACHE_KEY = 'munlink.staff_context'


def _resolve_staff_context(user_id) -> Optional[dict]:
    try:
        user = db.session.get(User, int(user_id))
    except (TypeError, ValueError):
        return None
    if user is None or not user.is_active:
        return None

    role = (user.role or '').lower()
    if role not in ADMIN_ROLES:
        return None

    municipality_id = user.admin_municipality_id
    if municipality_id and not is_valid_zambales_municipality(municipality_id):
        municipality_id = None

    barangay_id = user.admin_barangay_id
    if barangay_id:
        barangay = db.session.get(Barangay, barangay_id)
        if barangay is None or not is_valid_zambales_municipality(barangay.municipality_id):
            barangay_id = None
        elif municipality_id is None:
            municipality_id = barangay.municipality_id
        elif barangay.municipality_id != municipality_id:
            barangay_id = None

    # Scoped admins without a valid assignment get no admin access at all.
    if role == 'municipal_admin' and not municipality_id:
        return None
    if role == 'barangay_admin' and not (municipality_id and barangay_id):
        return None

    return {
        'user': user,
        'user_id': user.id,
        'role': user.role,
        'role_lower': role,
        'is_super': role == 'superadmin',
        'is_provincial': role == 'provincial_admin',
        'municipality_id': municipality_id,
        'barangay_id': barangay_id if role == 'barangay_admin' else None,
    }


def load_staff_context(user_id=None) -> Optional[dict]:
    """Return the current admin's context, or None unless they are an active admin.

    The result is cached for the rest of the request.
    """
    if user_id is not None:
        return _resolve_staff_context(user_id)
    try:
        identity = get_jwt_identity()
    except Exception:
        return None
    if not has_request_context():
        return _resolve_staff_context(identity)
    # Cached on the request itself (flask.g can be shared when an app context is reused).
    cached = request.environ.get(_CACHE_KEY)
    if cached is not None and cached[0] == identity:
        return cached[1]
    ctx = _resolve_staff_context(identity)
    request.environ[_CACHE_KEY] = (identity, ctx)
    return ctx


def can_access_resident(ctx: Optional[dict], person: Optional[User]) -> bool:
    """True when the admin's scope covers this person's account records."""
    if not ctx or person is None:
        return False

    if (person.role or '').lower() in ADMIN_ROLES:
        # Admin accounts: superadmin, or colleagues assigned to the same municipality.
        if ctx['is_super']:
            return True
        return bool(ctx['municipality_id']) and person.admin_municipality_id == ctx['municipality_id']

    if not is_valid_zambales_municipality(person.municipality_id):
        return False
    if ctx['is_super'] or ctx['is_provincial']:
        return True
    if ctx['role_lower'] == 'barangay_admin':
        return bool(ctx['barangay_id']) and person.barangay_id == ctx['barangay_id']
    return bool(ctx['municipality_id']) and person.municipality_id == ctx['municipality_id']


def resident_scope_conditions(ctx: dict) -> list:
    """SQLAlchemy filters that limit a User query to the admin's scope."""
    conditions = [User.municipality_id.in_(ZAMBALES_MUNICIPALITY_IDS)]
    if ctx['is_super'] or ctx['is_provincial']:
        return conditions
    conditions.append(User.municipality_id == ctx['municipality_id'])
    if ctx['role_lower'] == 'barangay_admin':
        conditions.append(User.barangay_id == ctx['barangay_id'])
    return conditions
