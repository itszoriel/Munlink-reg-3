"""
Internal endpoints called by scheduled jobs (Supabase pg_cron through pg_net).

They are not for browsers: every call must carry the shared secret from
``INTERNAL_CRON_SECRET`` in the ``X-Cron-Secret`` header. When the variable is
unset the endpoints are disabled. The database side keeps the same value in
Supabase Vault (see supabase/notification_cron.sql).
"""
from __future__ import annotations

import hmac

from flask import Blueprint, current_app, jsonify, request

internal_bp = Blueprint('internal', __name__, url_prefix='/internal')

MAX_ITEMS_PER_RUN = 100


def _authorized() -> bool | None:
    """True/False for a configured secret; None when the endpoints are disabled."""
    expected = str(current_app.config.get('INTERNAL_CRON_SECRET') or '')
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
