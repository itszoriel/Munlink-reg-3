"""2FA codes are stored hashed; writes from untrusted browser origins are refused."""
from __future__ import annotations

import re

import pytest

from apps.api import db
from apps.api.app import create_app
from apps.api.config import Config
from apps.api.models.email_verification_code import EmailVerificationCode
from apps.api.models.user import User

TRUSTED = 'https://munlink-zambales-of1v.onrender.com'


class OriginConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False
    WEB_URL = TRUSTED


@pytest.fixture
def app():
    app = create_app(OriginConfig)
    with app.app_context():
        db.create_all()
        yield app


def _superadmin():
    user = User(
        username='hash_super', email='hash_super@example.com', password_hash='x',
        first_name='Hash', last_name='Super', role='superadmin',
        email_verified=True, admin_verified=True, is_active=True,
    )
    db.session.add(user)
    db.session.commit()
    return user


def test_2fa_code_is_stored_as_digest(app):
    user = _superadmin()
    verification = EmailVerificationCode.create_for_user(user.id, '2fa_login')
    plain = verification.plain_code

    stored = db.session.get(EmailVerificationCode, verification.id).code
    assert re.fullmatch(r'[0-9a-f]{64}', stored)
    assert plain not in stored

    wrong = '000000' if plain != '000000' else '111111'
    ok, _, _ = EmailVerificationCode.verify(verification.session_id, wrong)
    assert not ok
    ok, error, _ = EmailVerificationCode.verify(verification.session_id, plain)
    assert ok, error


def test_digest_is_bound_to_its_session(app):
    user = _superadmin()
    first = EmailVerificationCode.create_for_user(user.id, '2fa_login')
    assert first.code != EmailVerificationCode.hash_code(first.plain_code, '2fa_login', 'other-session')


@pytest.mark.parametrize('headers, blocked', [
    ({'Origin': 'https://evil.example'}, True),
    ({'Origin': TRUSTED}, False),
    ({'Origin': TRUSTED + '/'}, False),
    ({}, False),                                   # server-to-server, no Origin
    ({'Sec-Fetch-Site': 'cross-site'}, True),      # browser that hid Origin
])
def test_state_changing_requests_need_a_trusted_origin(app, headers, blocked):
    response = app.test_client().post('/api/auth/refresh', headers=headers)
    if blocked:
        assert response.status_code == 403
        assert response.get_json()['code'] == 'UNTRUSTED_ORIGIN'
    else:
        assert response.status_code != 403


def test_reads_are_not_origin_checked(app):
    response = app.test_client().get('/health', headers={'Origin': 'https://evil.example'})
    assert response.status_code == 200
