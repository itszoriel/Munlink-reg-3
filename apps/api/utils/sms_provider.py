"""SMS provider utilities (Semaphore + console fallback)."""
from __future__ import annotations
import time
from typing import List, Dict, Any
from datetime import datetime
import requests
from flask import current_app


_capability_cache: Dict[str, Any] = {
    'expires_at': 0,
    'data': None,
}


def mask_number(number: str) -> str:
    """Mask all but last 4 digits of a phone number."""
    digits = ''.join(ch for ch in str(number or '') if ch.isdigit())
    if not digits:
        return '***'
    if len(digits) <= 4:
        return '*' * len(digits)
    return f"{'*' * (len(digits) - 4)}{digits[-4:]}"


def normalize_sms_number(number: str | None) -> str | None:
    """Normalize to digits-only format accepted by Semaphore (63XXXXXXXXXX)."""
    if not number:
        return None
    digits = ''.join(ch for ch in str(number) if ch.isdigit())
    if not digits:
        return None
    if digits.startswith('09') and len(digits) == 11:
        digits = '63' + digits[1:]
    elif digits.startswith('9') and len(digits) == 10:
        digits = '639' + digits
    elif digits.startswith('63') and len(digits) == 12:
        pass
    elif digits.startswith('0') and len(digits) == 10:
        digits = '63' + digits[1:]
    else:
        return None
    return digits


def _sanitize_message(text: str) -> str:
    """Ensure message is not rejected for starting with TEST and carries branding."""
    try:
        brand = (current_app.config.get('APP_NAME') or 'MunLink Zambales')
    except Exception:
        brand = 'MunLink Zambales'
    brand = brand.strip() or 'MunLink'
    brand_lower = brand.lower()
    trimmed = (text or '').lstrip()
    if not trimmed:
        return ''
    if trimmed.upper().startswith('TEST'):
        trimmed = f"{brand}: {trimmed}"
    if not trimmed.lower().startswith(brand_lower):
        trimmed = f"{brand}: {trimmed}"
    return trimmed


def get_semaphore_capability(force: bool = False, ttl_seconds: int | None = None) -> Dict[str, Any]:
    """Check Semaphore account status and credits with short-lived caching."""
    provider = (current_app.config.get('SMS_PROVIDER') or 'disabled').lower()
    if provider != 'semaphore':
        return {
            'provider': provider,
            'available': provider == 'console',
            'reason': None if provider == 'console' else 'sms_disabled',
            'credit_balance': None,
            'status': None,
        }

    api_key = current_app.config.get('SEMAPHORE_API_KEY', '')
    base_url = (current_app.config.get('SEMAPHORE_BASE_URL') or 'https://api.semaphore.co').rstrip('/')
    ttl = ttl_seconds or int(current_app.config.get('SMS_CAPABILITY_CACHE_SECONDS', 90) or 90)
    now = time.time()

    if not force and _capability_cache['data'] and _capability_cache['expires_at'] > now:
        return _capability_cache['data']

    if not api_key:
        data = {
            'provider': 'semaphore',
            'available': False,
            'reason': 'not_configured',
            'credit_balance': None,
            'status': None,
        }
        _capability_cache['data'] = data
        _capability_cache['expires_at'] = now + ttl
        return data

    try:
        resp = requests.get(f"{base_url}/api/v4/account", params={'apikey': api_key}, timeout=10)
        resp.raise_for_status()
        payload = resp.json() if resp.headers.get('content-type', '').startswith('application/json') else {}
        status = str(payload.get('status') or payload.get('account_status') or '').strip()
        credit_balance = float(payload.get('credit_balance') or 0)
        available = status.lower() == 'active' and credit_balance > 0
        reason = None
        if status.lower() != 'active':
            reason = 'semaphore_not_approved'
        elif credit_balance <= 0:
            reason = 'semaphore_no_credits'
        data = {
            'provider': 'semaphore',
            'available': available,
            'reason': reason,
            'credit_balance': credit_balance,
            'status': status or None,
            'checked_at': datetime.utcnow(),
        }
    except Exception as exc:
        data = {
            'provider': 'semaphore',
            'available': False,
            'reason': 'semaphore_unreachable',
            'credit_balance': None,
            'status': None,
            'error': str(exc)[:200],
        }
    _capability_cache['data'] = data
    _capability_cache['expires_at'] = now + ttl
    return data


def send_sms(numbers: List[str], message: str) -> Dict[str, Any]:
    """Send SMS using configured provider. Returns dict with status and optional reason/error."""
    provider = (current_app.config.get('SMS_PROVIDER') or 'disabled').lower()
    payload_numbers = [n for n in numbers if n]
    if not payload_numbers:
        return {'status': 'skipped', 'reason': 'no_numbers'}

    sanitized_message = _sanitize_message(message)
    if not sanitized_message:
        return {'status': 'skipped', 'reason': 'empty_message'}

    if provider == 'disabled':
        return {'status': 'skipped', 'reason': 'sms_disabled'}

    if provider == 'console':
        try:
            masked = [mask_number(n) for n in payload_numbers]
            current_app.logger.info("[SMS console] to=%s message=%s", masked, sanitized_message[:240])
        except Exception:
            pass
        return {'status': 'sent'}

    if provider != 'semaphore':
        return {'status': 'skipped', 'reason': 'unknown_provider'}

    api_key = current_app.config.get('SEMAPHORE_API_KEY', '')
    sendername = current_app.config.get('SEMAPHORE_SENDERNAME', '')
    base_url = (current_app.config.get('SEMAPHORE_BASE_URL') or 'https://api.semaphore.co').rstrip('/')

    capability = get_semaphore_capability()
    if not capability.get('available'):
        return {'status': 'skipped', 'reason': capability.get('reason') or 'semaphore_unavailable'}

    payload: Dict[str, Any] = {
        'apikey': api_key,
        'number': ','.join(payload_numbers),
        'message': sanitized_message,
    }
    if sendername:
        payload['sendername'] = sendername

    try:
        resp = requests.post(f"{base_url}/api/v4/messages", json=payload, timeout=15)
        if resp.status_code not in (200, 201, 202):
            detail = None
            try:
                detail = resp.json()
            except Exception:
                detail = resp.text[:200]
            return {'status': 'failed', 'reason': f"{resp.status_code}", 'error': detail}
        return {'status': 'sent'}
    except requests.exceptions.RequestException as exc:
        return {'status': 'failed', 'reason': 'network_error', 'error': str(exc)[:200]}


def get_provider_status() -> Dict[str, Any]:
    """Lightweight capability snapshot for APIs/UI."""
    data = get_semaphore_capability()
    return {
        'provider': data.get('provider'),
        'available': data.get('available'),
        'reason': data.get('reason'),
        'credit_balance': data.get('credit_balance'),
        'status': data.get('status'),
    }
