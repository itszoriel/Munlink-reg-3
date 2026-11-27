"""
Per-request session checks for JWTs.

Runs for every protected request (see the ``token_verification_loader`` in
app.py). A token is accepted only when:

- it is a session token (``access`` or ``refresh``), not e.g. a verification JWT;
- its user still exists and is active (suspensions apply immediately);
- its session family, when the token names one, has not been ended by logout,
  a password change or reset, refresh-token reuse, or a suspension.

Tokens issued before access tokens carried ``family_id`` stay valid until they
expire (at most one hour).
"""
from __future__ import annotations

from typing import Optional

from flask import current_app

from apps.api import db
from apps.api.models.user import User

SESSION_TOKEN_TYPES = ('access', 'refresh')

REJECTION_MESSAGES = {
    'INVALID_TOKEN_TYPE': 'Invalid token',
    'INVALID_TOKEN': 'Invalid token',
    'ACCOUNT_NOT_FOUND': 'Account not found',
    'ACCOUNT_DISABLED': 'This account is disabled',
    'SESSION_REVOKED': 'Your session has ended. Please sign in again.',
}


def session_rejection_code(jwt_payload: dict) -> Optional[str]:
    """Return why a token must be refused, or None when it is acceptable."""
    if jwt_payload.get('type') not in SESSION_TOKEN_TYPES:
        return 'INVALID_TOKEN_TYPE'

    identity_claim = current_app.config.get('JWT_IDENTITY_CLAIM', 'sub')
    try:
        user_id = int(jwt_payload.get(identity_claim))
    except (TypeError, ValueError):
        return 'INVALID_TOKEN'

    user = db.session.get(User, user_id)
    if user is None:
        return 'ACCOUNT_NOT_FOUND'
    if not user.is_active:
        return 'ACCOUNT_DISABLED'

    family_id = jwt_payload.get('family_id')
    if family_id:
        from apps.api.models.refresh_token import RefreshTokenFamily

        family = RefreshTokenFamily.query.filter_by(family_id=str(family_id)).first()
        if family is None or not family.is_active or family.user_id != user.id:
            return 'SESSION_REVOKED'
    return None


def end_user_sessions(user_id: int, reason: str, keep_family_id: Optional[str] = None) -> int:
    """End every active session of a user (optionally keeping the current one).

    The caller commits. Returns the number of sessions ended.
    """
    from apps.api.models.refresh_token import RefreshTokenFamily

    ended = 0
    for family in RefreshTokenFamily.query.filter_by(user_id=user_id, is_active=True).all():
        if keep_family_id and family.family_id == keep_family_id:
            continue
        family.invalidate(reason)
        ended += 1
    return ended
