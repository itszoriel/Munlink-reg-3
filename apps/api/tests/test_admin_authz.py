"""Phase 3: database-backed admin authorization, resident scope, and session revocation."""
from __future__ import annotations

from io import BytesIO
from pathlib import Path

import bcrypt
import pytest
from flask_jwt_extended import create_access_token
from PIL import Image

from apps.api import db
from apps.api.app import create_app
from apps.api.config import Config
from apps.api.models.admin_audit_log import AdminAuditLog, AuditAction
from apps.api.models.municipality import Barangay, Municipality
from apps.api.models.province import Province
from apps.api.models.user import User

PASSWORD = 'StrongPass123'  # gitleaks:allow  (fixture-only)
ADMIN_PERMS = ['residents:approve', 'residents:id_view']
ID_PATH = 'verification/residents/iba/user_{id}/valid_id_front/front.png'


class AuthzConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    DEBUG = False
    FLASK_ENV = 'testing'
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False
    JWT_COOKIE_SECURE = False
    JWT_COOKIE_DOMAIN = None
    JWT_COOKIE_CSRF_PROTECT = False
    SUPABASE_URL = ''
    SUPABASE_SERVICE_KEY = ''
    SUPABASE_KEY = ''
    TRUST_PROXY_HOPS = 0


@pytest.fixture(autouse=True)
def hermetic_env(monkeypatch):
    for name in ('SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_KEY', 'FORCE_SUPABASE_STORAGE', 'FLASK_ENV'):
        monkeypatch.delenv(name, raising=False)


def _png() -> bytes:
    buffer = BytesIO()
    Image.new('RGB', (2, 2), (1, 2, 3)).save(buffer, format='PNG')
    return buffer.getvalue()


@pytest.fixture
def world(tmp_path):
    """Two municipalities, three barangays, every admin role, three residents."""
    app = create_app(AuthzConfig)
    upload_root = tmp_path / 'uploads'
    app.config['UPLOAD_FOLDER'] = str(upload_root)
    ids = {}
    with app.app_context():
        db.create_all()
        db.session.add_all([
            Province(id=6, name='Zambales', slug='zambales', psgc_code='037100000'),
            Municipality(id=112, name='Iba', slug='iba', province_id=6, psgc_code='037112000'),
            Municipality(id=108, name='Botolan', slug='botolan', province_id=6, psgc_code='037108000'),
            Barangay(id=1, name='Zone A', slug='zone-a', municipality_id=112, psgc_code='037112001'),
            Barangay(id=2, name='Zone B', slug='zone-b', municipality_id=112, psgc_code='037112002'),
            Barangay(id=3, name='Zone C', slug='zone-c', municipality_id=108, psgc_code='037108001'),
        ])
        db.session.commit()

        hashed = bcrypt.hashpw(PASSWORD.encode(), bcrypt.gensalt()).decode()

        def add(key, **fields):
            base = dict(username=key, email=f'{key}@example.com', password_hash=hashed,
                        first_name=key.title(), last_name='Test', email_verified=True,
                        admin_verified=True, is_active=True)
            base.update(fields)
            user = User(**base)
            db.session.add(user)
            db.session.commit()
            ids[key] = user.id
            return user

        add('super', role='superadmin', permissions=['*'])
        add('provincial', role='provincial_admin', permissions=ADMIN_PERMS)
        add('iba_admin', role='municipal_admin', admin_municipality_id=112, permissions=ADMIN_PERMS)
        add('botolan_admin', role='municipal_admin', admin_municipality_id=108, permissions=ADMIN_PERMS)
        add('zone_a_admin', role='barangay_admin', admin_municipality_id=112, admin_barangay_id=1,
            permissions=ADMIN_PERMS)
        add('no_perm_admin', role='municipal_admin', admin_municipality_id=112, permissions=[])
        for key, muni, brgy in (('res_a', 112, 1), ('res_b', 112, 2), ('res_c', 108, 3)):
            user = add(key, role='resident', municipality_id=muni, barangay_id=brgy, admin_verified=False)
            path = ID_PATH.format(id=user.id)
            user.valid_id_front = path
            target = upload_root / Path(path)
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(_png())
        db.session.commit()
    return app, ids


def _token(app, user_id, role='resident'):
    with app.app_context():
        return create_access_token(identity=str(user_id), additional_claims={'role': role})


def _auth(token):
    return {'Authorization': f'Bearer {token}'}


SCOPE_MATRIX = {
    # admin:        res_a (Iba, Zone A), res_b (Iba, Zone B), res_c (Botolan)
    'super':        (200, 200, 200),
    'provincial':   (200, 200, 200),
    'iba_admin':    (200, 200, 403),
    'botolan_admin': (403, 403, 200),
    'zone_a_admin': (200, 403, 403),
}


@pytest.mark.parametrize('admin', sorted(SCOPE_MATRIX))
def test_resident_detail_follows_admin_scope(world, admin):
    app, ids = world
    client = app.test_client()
    token = _token(app, ids[admin], 'superadmin')  # role claim is ignored
    for resident, expected in zip(('res_a', 'res_b', 'res_c'), SCOPE_MATRIX[admin]):
        response = client.get(f"/api/admin/users/{ids[resident]}", headers=_auth(token))
        assert response.status_code == expected, (admin, resident, response.get_json())


@pytest.mark.parametrize('admin', sorted(SCOPE_MATRIX))
def test_id_viewing_follows_admin_scope_and_is_audited(world, admin):
    app, ids = world
    client = app.test_client()
    token = _token(app, ids[admin])
    for resident, expected in zip(('res_a', 'res_b', 'res_c'), SCOPE_MATRIX[admin]):
        response = client.get(
            f"/api/admin/residents/{ids[resident]}/documents/id_front",
            query_string={'reason': 'Verification review'},
            headers=_auth(token),
        )
        assert response.status_code == expected, (admin, resident, response.get_json(silent=True))
    with app.app_context():
        views = AdminAuditLog.query.filter_by(admin_id=ids[admin], action=AuditAction.RESIDENT_ID_VIEWED).count()
    assert views == sum(1 for code in SCOPE_MATRIX[admin] if code == 200)


def test_pending_list_is_limited_to_scope(world):
    app, ids = world
    client = app.test_client()

    def pending_ids(admin):
        response = client.get('/api/admin/users/pending', headers=_auth(_token(app, ids[admin])))
        assert response.status_code == 200
        return {user['id'] for user in response.get_json()['users']}

    assert pending_ids('zone_a_admin') == {ids['res_a']}
    assert pending_ids('iba_admin') == {ids['res_a'], ids['res_b']}
    assert pending_ids('provincial') == {ids['res_a'], ids['res_b'], ids['res_c']}


def test_role_claim_in_token_is_not_trusted(world):
    app, ids = world
    forged = _token(app, ids['res_a'], role='superadmin')
    response = app.test_client().get('/api/admin/users/pending', headers=_auth(forged))
    assert response.status_code == 403
    assert response.get_json()['code'] == 'ROLE_MISMATCH'


def test_demoted_admin_loses_access_on_next_request(world):
    app, ids = world
    client = app.test_client()
    token = _token(app, ids['iba_admin'], 'municipal_admin')
    assert client.get('/api/admin/users/pending', headers=_auth(token)).status_code == 200
    with app.app_context():
        db.session.get(User, ids['iba_admin']).role = 'resident'
        db.session.commit()
    assert client.get('/api/admin/users/pending', headers=_auth(token)).status_code == 403


def test_deactivated_account_token_is_rejected_everywhere(world):
    app, ids = world
    client = app.test_client()
    token = _token(app, ids['iba_admin'], 'municipal_admin')
    with app.app_context():
        db.session.get(User, ids['iba_admin']).is_active = False
        db.session.commit()
    for path in ('/api/admin/users/pending', '/api/auth/profile'):
        response = client.get(path, headers=_auth(token))
        assert response.status_code == 401
        assert response.get_json()['code'] == 'ACCOUNT_DISABLED'


def test_unassigned_barangay_admin_has_no_admin_access(world):
    app, ids = world
    with app.app_context():
        db.session.get(User, ids['zone_a_admin']).admin_barangay_id = None
        db.session.commit()
    response = app.test_client().get('/api/admin/users/pending', headers=_auth(_token(app, ids['zone_a_admin'])))
    assert response.status_code == 403


def test_suspend_and_reactivate_need_reason_permission_and_scope(world):
    app, ids = world
    client = app.test_client()
    admin_token = _token(app, ids['iba_admin'])
    resident_token = _token(app, ids['res_a'])
    url = f"/api/admin/users/{ids['res_a']}"

    assert client.post(f'{url}/suspend', json={}, headers=_auth(admin_token)).status_code == 400
    assert client.post(f'{url}/suspend', json={'reason': 'Fraudulent ID'},
                       headers=_auth(_token(app, ids['no_perm_admin']))).status_code == 403
    assert client.post(f"/api/admin/users/{ids['res_b']}/suspend", json={'reason': 'Fraudulent ID'},
                       headers=_auth(_token(app, ids['zone_a_admin']))).status_code == 403
    assert client.post(f"/api/admin/users/{ids['res_c']}/suspend", json={'reason': 'Fraudulent ID'},
                       headers=_auth(admin_token)).status_code == 403

    suspended = client.post(f'{url}/suspend', json={'reason': 'Fraudulent ID'}, headers=_auth(admin_token))
    assert suspended.status_code == 200
    assert client.post(f'{url}/suspend', json={'reason': 'Fraudulent ID'}, headers=_auth(admin_token)).status_code == 409
    profile = client.get('/api/auth/profile', headers=_auth(resident_token))
    assert profile.status_code == 401 and profile.get_json()['code'] == 'ACCOUNT_DISABLED'

    reactivated = client.post(f'{url}/reactivate', json={'reason': 'ID re-checked in person'},
                              headers=_auth(admin_token))
    assert reactivated.status_code == 200
    assert client.get('/api/auth/profile', headers=_auth(resident_token)).status_code == 200

    with app.app_context():
        entries = AdminAuditLog.query.filter_by(admin_id=ids['iba_admin'], resource_id=ids['res_a']).all()
        actions = [(entry.action, entry.details.get('reason')) for entry in entries]
    assert actions == [
        (AuditAction.RESIDENT_SUSPENDED, 'Fraudulent ID'),
        (AuditAction.RESIDENT_REACTIVATED, 'ID re-checked in person'),
    ]


def test_admin_id_replacement_is_scoped_and_audited(world):
    app, ids = world
    client = app.test_client()
    data = lambda: {'valid_id_front': (BytesIO(_png()), 'front.png')}  # noqa: E731
    denied = client.post(f"/api/admin/users/{ids['res_c']}/verification-docs", data=data(),
                         content_type='multipart/form-data', headers=_auth(_token(app, ids['iba_admin'])))
    assert denied.status_code == 403
    allowed = client.post(f"/api/admin/users/{ids['res_a']}/verification-docs", data=data(),
                          content_type='multipart/form-data', headers=_auth(_token(app, ids['iba_admin'])))
    assert allowed.status_code == 200, allowed.get_json()
    with app.app_context():
        entry = AdminAuditLog.query.filter_by(action=AuditAction.RESIDENT_DOCS_REPLACED).one()
    assert entry.resource_id == ids['res_a'] and entry.details['documents'] == ['valid_id_front']


def _login(app, email):
    client = app.test_client()
    response = client.post('/api/auth/login', json={'email': email, 'password': PASSWORD})
    assert response.status_code == 200, response.get_json()
    return client, response.get_json()['access_token']


def test_password_change_signs_out_other_devices(world):
    app, ids = world
    phone, phone_token = _login(app, 'res_a@example.com')
    laptop, laptop_token = _login(app, 'res_a@example.com')

    changed = phone.post('/api/auth/change-password', headers=_auth(phone_token),
                         json={'current_password': PASSWORD, 'new_password': 'NewStrongPass456'})
    assert changed.status_code == 200, changed.get_json()
    assert 'Other devices have been signed out' in changed.get_json()['message']

    # The device that changed the password keeps working ...
    assert phone.get('/api/auth/profile', headers=_auth(phone_token)).status_code == 200
    # ... the other one is signed out immediately, and cannot refresh.
    other = laptop.get('/api/auth/profile', headers=_auth(laptop_token))
    assert other.status_code == 401 and other.get_json()['code'] == 'SESSION_REVOKED'
    assert laptop.post('/api/auth/refresh').status_code == 401


def test_suspension_ends_existing_sessions(world):
    app, ids = world
    client, token = _login(app, 'res_a@example.com')
    response = app.test_client().post(f"/api/admin/users/{ids['res_a']}/suspend", json={'reason': 'Fraudulent ID'},
                                      headers=_auth(_token(app, ids['iba_admin'])))
    assert response.status_code == 200
    with app.app_context():
        db.session.get(User, ids['res_a']).is_active = True  # even if re-enabled directly in the DB
        db.session.commit()
    revoked = client.get('/api/auth/profile', headers=_auth(token))
    assert revoked.status_code == 401 and revoked.get_json()['code'] == 'SESSION_REVOKED'


def test_database_health_hides_connection_details(tmp_path):
    config = type('Cfg', (AuthzConfig,), {
        'SQLALCHEMY_DATABASE_URI': f"sqlite:///{tmp_path / 'missing' / 'nested' / 'db.sqlite'}",
    })
    response = create_app(config).test_client().get('/health/db')
    assert response.status_code == 503
    assert response.get_json() == {'status': 'error'}
