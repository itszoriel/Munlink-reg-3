"""
Regression tests for the Phase 1 security fixes.

Each test proves an attack that used to work is now refused:
- email-verification links can no longer be used as login tokens
- residents cannot make the API fetch arbitrary URLs through supporting documents
- superadmin login no longer reveals accounts, failed 2FA is audited, and
  superadmin sessions use short, refreshable tokens
- rate limits and audit logs see the real client IP behind the proxy
"""
from datetime import datetime, timedelta, timezone

import bcrypt
import pytest
from flask import request
from flask_jwt_extended import create_access_token, decode_token

from apps.api import db
from apps.api.app import create_app
from apps.api.config import Config
from apps.api.models.admin_audit_log import AdminAuditLog, AuditAction
from apps.api.models.document import DocumentRequest, DocumentType
from apps.api.models.email_verification_code import EmailVerificationCode
from apps.api.models.municipality import Barangay, Municipality
from apps.api.models.province import Province
from apps.api.models.user import User
from apps.api.routes import documents as documents_routes
from apps.api.utils import file_streaming
from apps.api.utils.auth import generate_verification_token
from apps.api.utils.file_streaming import is_remote_url_allowed, references_request_upload

# Fixture-only credential for the in-memory test database.
RESIDENT_PASSWORD = 'StrongPass123'  # gitleaks:allow


class SecurityFixesConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    DEBUG = False
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_DOMAIN = None
    JWT_COOKIE_CSRF_PROTECT = False
    SUPABASE_URL = 'https://projectref.supabase.co'
    ALLOWED_FILE_DOMAINS = []
    TRUST_PROXY_HOPS = 0


def _pw_hash(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')


def _make_app():
    app = create_app(SecurityFixesConfig)
    with app.app_context():
        db.create_all()
    return app


def _add_user(**overrides) -> User:
    fields = dict(
        username='resident_one',
        email='resident_one@example.com',
        password_hash=_pw_hash(RESIDENT_PASSWORD),
        first_name='Resident',
        last_name='One',
        role='resident',
        email_verified=False,
        admin_verified=False,
        is_active=True,
    )
    fields.update(overrides)
    user = User(**fields)
    db.session.add(user)
    db.session.commit()
    return user


def _seed_location():
    province = Province(id=6, name='Zambales', slug='zambales', psgc_code='037100000')
    muni = Municipality(id=112, name='Iba', slug='iba', province_id=6, psgc_code='037112000')
    brgy = Barangay(id=2001, name='Barangay Uno', slug='barangay-uno', municipality_id=112, psgc_code='037112001')
    db.session.add_all([province, muni, brgy])
    db.session.commit()
    return muni, brgy


@pytest.fixture
def no_network(monkeypatch):
    """Fail the test if anything tries to fetch a remote file."""
    def _blocked(*args, **kwargs):
        raise AssertionError(f"unexpected outbound request: {args[:1]}")

    monkeypatch.setattr(file_streaming.requests, 'get', _blocked)


# ---------------------------------------------------------------------------
# 1.1 Email verification tokens are not login tokens
# ---------------------------------------------------------------------------

def test_email_verification_token_cannot_authenticate():
    app = _make_app()
    client = app.test_client()
    with app.app_context():
        user = _add_user()
        token = generate_verification_token(user.id, 'email', email=user.email)

    resp = client.get('/api/auth/profile', headers={'Authorization': f'Bearer {token}'})
    assert resp.status_code in (401, 422)


def test_legacy_email_jwt_is_rejected_as_session_token():
    app = _make_app()
    client = app.test_client()
    with app.app_context():
        user = _add_user()
        legacy = create_access_token(identity=str(user.id), additional_claims={'type': 'email'})

    resp = client.get('/api/auth/profile', headers={'Authorization': f'Bearer {legacy}'})
    assert resp.status_code == 401
    assert (resp.get_json() or {}).get('code') == 'INVALID_TOKEN_TYPE'


def test_verify_email_accepts_signed_token():
    app = _make_app()
    client = app.test_client()
    with app.app_context():
        user = _add_user()
        user_id = user.id
        token = generate_verification_token(user.id, 'email', email=user.email)

    resp = client.get(f'/api/auth/verify-email/{token}')
    assert resp.status_code == 200
    with app.app_context():
        assert db.session.get(User, user_id).email_verified is True


def test_verify_email_rejects_link_after_email_change():
    app = _make_app()
    client = app.test_client()
    with app.app_context():
        user = _add_user()
        token = generate_verification_token(user.id, 'email', email=user.email)
        user.email = 'changed@example.com'
        db.session.commit()

    resp = client.get(f'/api/auth/verify-email/{token}')
    assert resp.status_code == 400


def test_verify_email_still_accepts_unexpired_legacy_link():
    app = _make_app()
    client = app.test_client()
    with app.app_context():
        user = _add_user()
        user_id = user.id
        legacy = create_access_token(
            identity=str(user.id),
            expires_delta=timedelta(hours=24),
            additional_claims={'type': 'email'},
        )

    resp = client.get(f'/api/auth/verify-email/{legacy}')
    assert resp.status_code == 200
    with app.app_context():
        assert db.session.get(User, user_id).email_verified is True


def test_verify_email_rejects_forged_token():
    app = _make_app()
    client = app.test_client()
    resp = client.get('/api/auth/verify-email/not-a-real-token')
    assert resp.status_code == 400


# ---------------------------------------------------------------------------
# 1.2 / 1.3 Supporting documents and remote fetches
# ---------------------------------------------------------------------------

def test_remote_fetch_allowlist_defaults_to_supabase_host_only(monkeypatch):
    app = _make_app()
    with app.app_context():
        assert is_remote_url_allowed('https://projectref.supabase.co/storage/v1/object/public/x.pdf')
        assert not is_remote_url_allowed('https://evil.example.com/x.pdf')
        assert not is_remote_url_allowed('http://169.254.169.254/latest/meta-data/')
        assert not is_remote_url_allowed('file:///etc/passwd')
        # Plain http is refused outside debug, even for the storage host.
        assert not is_remote_url_allowed('http://projectref.supabase.co/x.pdf')

        app.config['SUPABASE_URL'] = ''
        monkeypatch.delenv('SUPABASE_URL', raising=False)
        assert not is_remote_url_allowed('https://projectref.supabase.co/x.pdf')


def test_references_request_upload_only_matches_own_request():
    assert references_request_upload('document_requests/residents/iba/request_7/a.pdf', 7)
    assert references_request_upload(
        'https://projectref.supabase.co/storage/v1/object/public/munlink-files/'
        'document_requests/residents/iba/request_7/a.pdf',
        7,
    )
    assert not references_request_upload('document_requests/residents/iba/request_8/a.pdf', 7)
    assert not references_request_upload('document_requests/residents/iba/request_7', 7)
    assert not references_request_upload('verification/residents/iba/user_1/valid_id_front/a.jpg', 7)
    assert not references_request_upload('document_requests/../verification/request_7/a.pdf', 7)
    assert not references_request_upload('http://169.254.169.254/latest/meta-data', 7)


def test_create_request_ignores_client_supporting_documents(monkeypatch):
    app = _make_app()
    client = app.test_client()
    monkeypatch.setattr(documents_routes, 'queue_document_request_created', lambda *a, **k: None)
    monkeypatch.setattr(documents_routes, 'flush_pending_notifications', lambda *a, **k: None)

    with app.app_context():
        muni, brgy = _seed_location()
        resident = _add_user(
            email_verified=True,
            admin_verified=True,
            municipality_id=muni.id,
            barangay_id=brgy.id,
        )
        doc_type = DocumentType(
            id=1,
            name='Clearance',
            code='CLR',
            authority_level='municipal',
            municipality_id=muni.id,
            requirements=['Valid ID'],
            exemption_rules={'student': True},
            fee=50,
            supports_physical=True,
            supports_digital=False,
            is_active=True,
        )
        db.session.add(doc_type)
        db.session.commit()
        token = create_access_token(identity=str(resident.id), additional_claims={'role': 'resident'})

    resp = client.post(
        '/api/documents/requests',
        json={
            'document_type_id': 1,
            'municipality_id': 112,
            'delivery_method': 'pickup',
            'purpose': 'Employment',
            'civil_status': 'single',
            'supporting_documents': ['http://169.254.169.254/latest/meta-data/'],
            'requirements_submitted': True,
        },
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 201, resp.get_json()
    request_id = resp.get_json()['request']['id']
    with app.app_context():
        saved = db.session.get(DocumentRequest, request_id)
        assert saved.supporting_documents == []
        assert float(saved.final_fee) == 50.0


def _admin_download(client, token, request_id, index):
    return client.get(
        f'/api/admin/documents/requests/{request_id}/supporting-documents/{index}',
        headers={'Authorization': f'Bearer {token}'},
    )


def test_admin_supporting_document_download_refuses_foreign_references(tmp_path, no_network):
    app = _make_app()
    app.config['UPLOAD_FOLDER'] = tmp_path
    client = app.test_client()

    with app.app_context():
        muni, brgy = _seed_location()
        resident = _add_user(municipality_id=muni.id, barangay_id=brgy.id, admin_verified=True)
        admin = _add_user(
            username='muni_admin',
            email='muni_admin@example.com',
            role='municipal_admin',
            admin_municipality_id=muni.id,
        )
        doc_type = DocumentType(
            id=1, name='Clearance', code='CLR', authority_level='municipal',
            municipality_id=muni.id, supports_physical=True, is_active=True,
        )
        db.session.add(doc_type)
        db.session.commit()
        req = DocumentRequest(
            request_number='REQ-TEST-1',
            user_id=resident.id,
            document_type_id=1,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            delivery_method='pickup',
            purpose='Test',
            status='pending',
        )
        db.session.add(req)
        db.session.commit()
        own_path = f'document_requests/residents/iba/request_{req.id}/proof.pdf'
        req.supporting_documents = [
            'http://169.254.169.254/latest/meta-data/',
            'document_requests/residents/iba/request_999/other.pdf',
            {'path': own_path, 'requirement': 'Valid ID'},
        ]
        db.session.commit()
        request_id = req.id
        token = create_access_token(identity=str(admin.id), additional_claims={'role': 'municipal_admin'})

    own_file = tmp_path / own_path
    own_file.parent.mkdir(parents=True)
    own_file.write_bytes(b'%PDF-1.4 test')

    assert _admin_download(client, token, request_id, 0).status_code == 400
    assert _admin_download(client, token, request_id, 1).status_code == 400
    ok = _admin_download(client, token, request_id, 2)
    assert ok.status_code == 200
    assert ok.data == b'%PDF-1.4 test'
    assert ok.mimetype == 'application/pdf'


# ---------------------------------------------------------------------------
# 1.4 Superadmin login, 2FA auditing, and session lifetime
# ---------------------------------------------------------------------------

def _add_superadmin() -> User:
    return _add_user(
        username='root_admin',
        email='root_admin@example.com',
        role='superadmin',
        email_verified=True,
        admin_verified=True,
        permissions=['*'],
    )


def test_superadmin_login_does_not_reveal_other_accounts():
    app = _make_app()
    client = app.test_client()
    with app.app_context():
        _add_user(email='someone@example.com')

    resp = client.post('/api/auth/superadmin/login', json={
        'email': 'someone@example.com',
        'password': 'WrongPassword1',
    })
    assert resp.status_code == 401
    assert resp.get_json()['error'] == 'Invalid email or password'


def test_failed_superadmin_2fa_is_audited():
    app = _make_app()
    client = app.test_client()
    with app.app_context():
        superadmin = _add_superadmin()
        code = EmailVerificationCode.create_for_user(superadmin.id, '2fa_login', expiry_minutes=10)
        session_id = code.session_id
        wrong = '000000' if code.code != '000000' else '111111'

    resp = client.post('/api/auth/superadmin/verify-2fa', json={'session_id': session_id, 'code': wrong})
    assert resp.status_code == 401
    with app.app_context():
        actions = [log.action for log in AdminAuditLog.query.all()]
        assert AuditAction.SUPERADMIN_2FA_FAILED in actions


def test_superadmin_session_is_short_lived_and_refreshable():
    app = _make_app()
    client = app.test_client()
    with app.app_context():
        superadmin = _add_superadmin()
        code = EmailVerificationCode.create_for_user(superadmin.id, '2fa_login', expiry_minutes=10)
        session_id, plain = code.session_id, code.code

    resp = client.post('/api/auth/superadmin/verify-2fa', json={'session_id': session_id, 'code': plain})
    assert resp.status_code == 200, resp.get_json()
    with app.app_context():
        claims = decode_token(resp.get_json()['access_token'])
    assert claims['exp'] - claims['iat'] == 15 * 60

    refreshed = client.post('/api/auth/refresh')
    assert refreshed.status_code == 200, refreshed.get_json()
    with app.app_context():
        new_claims = decode_token(refreshed.get_json()['access_token'])
    assert new_claims['role'] == 'superadmin'
    assert new_claims['exp'] - new_claims['iat'] == 15 * 60


def test_resident_login_refresh_still_works():
    app = _make_app()
    client = app.test_client()
    with app.app_context():
        _add_user(email_verified=True)

    login = client.post('/api/auth/login', json={'email': 'resident_one@example.com', 'password': RESIDENT_PASSWORD})
    assert login.status_code == 200, login.get_json()
    with app.app_context():
        claims = decode_token(login.get_json()['access_token'])
    assert claims['exp'] - claims['iat'] == 60 * 60
    assert client.post('/api/auth/refresh').status_code == 200


# ---------------------------------------------------------------------------
# 1.5 Real client IP behind the proxy
# ---------------------------------------------------------------------------

class ProxiedConfig(SecurityFixesConfig):
    TRUST_PROXY_HOPS = 1


def test_proxy_fix_uses_proxy_appended_client_ip():
    app = create_app(ProxiedConfig)

    @app.route('/_test/client-ip')
    def _client_ip():
        return request.remote_addr or ''

    client = app.test_client()
    resp = client.get(
        '/_test/client-ip',
        headers={'X-Forwarded-For': '6.6.6.6, 203.0.113.9'},  # first value is client-spoofable
        environ_base={'REMOTE_ADDR': '10.0.0.1'},
    )
    assert resp.get_data(as_text=True) == '203.0.113.9'


def test_without_trusted_proxy_forwarded_header_is_ignored():
    app = create_app(SecurityFixesConfig)

    @app.route('/_test/client-ip')
    def _client_ip():
        return request.remote_addr or ''

    client = app.test_client()
    resp = client.get(
        '/_test/client-ip',
        headers={'X-Forwarded-For': '6.6.6.6'},
        environ_base={'REMOTE_ADDR': '10.0.0.1'},
    )
    assert resp.get_data(as_text=True) == '10.0.0.1'
