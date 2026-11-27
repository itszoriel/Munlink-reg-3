"""
Internal endpoints called by scheduled jobs (Supabase pg_cron through pg_net).

They are not for browsers: every call must carry the shared secret in the
``X-Cron-Secret`` header. The secret lives in Supabase Vault as
``munlink_internal_cron_secret`` (created by scripts/schedule_db_cron.py, so
nobody ever has to see or copy it); ``INTERNAL_CRON_SECRET`` can override it.
With neither available the endpoints are disabled.
"""
from __future__ import annotations

import hmac
import time

from flask import Blueprint, current_app, jsonify, request
from sqlalchemy import text

internal_bp = Blueprint('internal', __name__, url_prefix='/internal')

MAX_ITEMS_PER_RUN = 100
VAULT_SECRET_NAME = 'munlink_internal_cron_secret'
_VAULT_TTL_SECONDS = 300
_vault_cache: dict[str, object] = {'value': '', 'expires': 0.0}


def _vault_secret() -> str:
    """Shared secret from Supabase Vault, cached briefly; '' when unavailable."""
    now = time.monotonic()
    if now < float(_vault_cache['expires']):
        return str(_vault_cache['value'])
    value = ''
    from apps.api import db
    if db.engine.dialect.name == 'postgresql':
        try:
            value = db.session.execute(
                text("SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = :name"),
                {'name': VAULT_SECRET_NAME},
            ).scalar() or ''
        except Exception as exc:  # vault missing or not readable
            db.session.rollback()
            current_app.logger.warning("Cron secret lookup in Vault failed: %s", type(exc).__name__)
    _vault_cache.update(value=value, expires=now + _VAULT_TTL_SECONDS)
    return value


def _expected_secret() -> str:
    configured = str(current_app.config.get('INTERNAL_CRON_SECRET') or '')
    return configured if configured else _vault_secret()


def _authorized() -> bool | None:
    """True/False for a configured secret; None when the endpoints are disabled."""
    expected = _expected_secret()
    if len(expected) < 32:
        return None
    supplied = request.headers.get('X-Cron-Secret', '')
    return hmac.compare_digest(supplied.encode('utf-8'), expected.encode('utf-8'))


@internal_bp.route('/notifications/run', methods=['POST'])
def run_notifications():
    """Deliver one batch of queued email/SMS notifications."""
    authorized = _authorized()
    if authorized is None:
        return jsonify({'error': 'Not available'}), 404
    if not authorized:
        return jsonify({'error': 'Unauthorized'}), 401

    from apps.api.utils.notification_delivery import process_batch

    try:
        processed = process_batch(max_items=MAX_ITEMS_PER_RUN)
    except Exception as exc:
        current_app.logger.exception("Scheduled notification run failed: %s", exc)
        return jsonify({'error': 'Notification run failed'}), 500
    return jsonify({'processed': processed}), 200
