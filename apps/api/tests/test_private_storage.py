"""Phase 2: sensitive uploads live in the private bucket and are never exposed by URL."""
from __future__ import annotations

import json
from io import BytesIO

import pytest
from flask_jwt_extended import create_access_token
from PIL import Image
from werkzeug.datastructures import FileStorage

from apps.api import db
from apps.api.app import create_app
from apps.api.config import Config
from apps.api.models.audit import AuditLog
from apps.api.models.document import DocumentRequest, DocumentType
from apps.api.models.municipality import Barangay, Municipality
from apps.api.models.province import Province
from apps.api.models.user import User
from apps.api.routes import special_status as special_status_routes
from apps.api.scripts import migrate_private_storage as migration
from apps.api.utils import file_streaming
from apps.api.utils import supabase_storage as storage
from apps.api.utils.storage_handler import (
    delete_stored_file,
    save_profile_picture,
    save_verification_document,
)
from apps.api.utils.validators import ValidationError

SUPABASE = 'https://projectref.supabase.co'
PUBLIC = 'munlink-files'
PRIVATE = 'munlinkprivate-files'
PUBLIC_ID_URL = f'{SUPABASE}/storage/v1/object/public/{PUBLIC}/verification/residents/iba/user_1/valid_id_front/a.png'


class PrivateStorageConfig(Config):
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
    SUPABASE_URL = SUPABASE
    SUPABASE_SERVICE_KEY = 'service-role-test-key'
    SUPABASE_KEY = ''
    SUPABASE_STORAGE_BUCKET = PUBLIC
    SUPABASE_PRIVATE_BUCKET = PRIVATE
    ALLOWED_FILE_DOMAINS = []
    TRUST_PROXY_HOPS = 0


@pytest.fixture(autouse=True)
def hermetic_env(monkeypatch):
    """Ignore any developer .env storage settings."""
    for name in ('SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'SUPABASE_KEY', 'SUPABASE_STORAGE_BUCKET',
                 'SUPABASE_PRIVATE_BUCKET', 'FORCE_SUPABASE_STORAGE', 'FLASK_ENV'):
        monkeypatch.delenv(name, raising=False)


@pytest.fixture
def app(tmp_path):
    config = type('Cfg', (PrivateStorageConfig,), {'UPLOAD_FOLDER': tmp_path / 'uploads'})
    application = create_app(config)
    application.config['UPLOAD_FOLDER'] = str(tmp_path / 'uploads')
    with application.app_context():
        db.create_all()
        db.session.add_all([
            Province(id=6, name='Zambales', slug='zambales', psgc_code='037100000'),
            Municipality(id=112, name='Iba', slug='iba', province_id=6, psgc_code='037112000'),
            Barangay(id=2001, name='Barangay Uno', slug='barangay-uno', municipality_id=112,
                     psgc_code='037112001'),
        ])
        db.session.commit()
    return application


def _png_bytes() -> bytes:
    buffer = BytesIO()
    Image.new('RGB', (2, 2), (10, 20, 30)).save(buffer, format='PNG')
    return buffer.getvalue()


def _upload(name='id.png', data=None, content_type='image/png') -> FileStorage:
    return FileStorage(stream=BytesIO(data if data is not None else _png_bytes()),
                       filename=name, content_type=content_type)


def _resident(**overrides) -> User:
    fields = dict(
        username='resident_one', email='resident_one@example.com', password_hash='x',
        first_name='Resident', last_name='One', role='resident', email_verified=True,
        admin_verified=False, is_active=True, municipality_id=112, barangay_id=2001,
    )
    fields.update(overrides)
    user = User(**fields)
    db.session.add(user)
    db.session.commit()
    return user


class FakeStorageHTTP:
    """Stands in for the Supabase Storage REST API (requests.get/post/delete)."""

    def __init__(self, objects=None):
        self.objects = dict(objects or {})  # (bucket, path) -> bytes
        self.calls = []

    def _split(self, url):
        rest = url.split('/storage/v1/object/', 1)[1]
        bucket, _, path = rest.partition('/')
        return bucket, path

    def get(self, url, headers=None, **kwargs):
        self.calls.append(('GET', url, headers or {}))
        assert '/object/public/' not in url and '/object/sign/' not in url
        bucket, path = self._split(url)
        data = self.objects.get((bucket, path))
        return FakeResponse(200 if data is not None else 400, data or b'{"error":"not_found"}',
                            {'Content-Type': 'image/png'})

    def post(self, url, headers=None, data=None, json=None, **kwargs):
        self.calls.append(('POST', url, headers or {}))
        bucket, path = self._split(url)
        self.objects[(bucket, path)] = data
        return FakeResponse(200, b'{}')


class FakeResponse:
    def __init__(self, status_code, content=b'', headers=None):
        self.status_code = status_code
        self.content = content
        self.text = content.decode('utf-8', 'replace')
        self.headers = headers or {}

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        return False

    def iter_content(self, chunk_size=1):
        yield self.content

    def json(self):
        return json.loads(self.text or 'null')


@pytest.fixture
def fake_http(monkeypatch):
    fake = FakeStorageHTTP()
    monkeypatch.setattr(storage.requests, 'get', fake.get)
    monkeypatch.setattr(storage.requests, 'post', fake.post)
    return fake


# --------------------------------------------------------------- classification

def test_sensitive_categories_use_private_bucket(app):
    with app.app_context():
        for category in ('verification', 'document_requests', 'generated_docs', 'benefits',
                         'claims', 'qr_codes', 'manual-payments', 'special_status'):
            assert storage.bucket_for_category(category) == PRIVATE
        for category in ('profiles', 'marketplace', 'announcements', 'benefit_programs', 'issues'):
            assert storage.bucket_for_category(category) == PUBLIC


def test_parse_storage_url_only_accepts_our_project():
    assert storage.parse_storage_url(PUBLIC_ID_URL, SUPABASE) == (
        PUBLIC, 'verification/residents/iba/user_1/valid_id_front/a.png')
    signed = f'{SUPABASE}/storage/v1/object/sign/{PRIVATE}/claims/system/iba/c.png?token=abc'
    assert storage.parse_storage_url(signed, SUPABASE) == (PRIVATE, 'claims/system/iba/c.png')
    assert storage.parse_storage_url('https://evil.example/storage/v1/object/public/x/a.png', SUPABASE) is None
    assert storage.parse_storage_url(f'{SUPABASE}/storage/v1/object/public/{PUBLIC}/../secret', SUPABASE) is None


def test_storage_paths_cannot_escape_their_folder():
    path = storage.build_storage_path('verification', '../../etc', 'user_1/valid_id_front', 'x.png')
    assert '..' not in path.split('/')
    assert path.startswith('verification/residents/etc/user_1/valid_id_front/')


# --------------------------------------------------------------- uploads

def test_verification_upload_goes_to_private_bucket_and_returns_path(app, fake_http, monkeypatch):
    monkeypatch.setenv('FORCE_SUPABASE_STORAGE', 'true')
    with app.test_request_context():
        ref = save_verification_document(_upload(), 5, 'iba', 'valid_id_front')
        profile = save_profile_picture(_upload('me.png'), 5, 'iba')

    assert ref.startswith('verification/residents/iba/user_5/valid_id_front/')
    assert not ref.startswith('http')
    assert any(f'/storage/v1/object/{PRIVATE}/verification/' in url for _, url, _ in fake_http.calls)
    # Public-safe media keeps its public URL.
    assert profile.startswith(f'{SUPABASE}/storage/v1/object/public/{PUBLIC}/profiles/')


def test_private_path_is_downloaded_with_service_key(app, fake_http):
    path = 'verification/residents/iba/user_5/valid_id_front/a.png'
    fake_http.objects[(PRIVATE, path)] = b'private-bytes'
    with app.test_request_context():
        data, _ = file_streaming.read_stored_file(path)
    assert data == b'private-bytes'
    method, url, headers = fake_http.calls[-1]
    assert url == f'{SUPABASE}/storage/v1/object/{PRIVATE}/{path}'
    assert headers.get('Authorization') == 'Bearer service-role-test-key'


def test_legacy_public_url_reads_private_copy_first_then_public(app, fake_http):
    path = 'verification/residents/iba/user_1/valid_id_front/a.png'
    fake_http.objects[(PUBLIC, path)] = b'legacy-public'
    with app.test_request_context():
        assert file_streaming.read_stored_file(PUBLIC_ID_URL)[0] == b'legacy-public'
        fake_http.objects[(PRIVATE, path)] = b'migrated-private'
        assert file_streaming.read_stored_file(PUBLIC_ID_URL)[0] == b'migrated-private'


def test_foreign_urls_still_need_the_allowlist(app, fake_http):
    with app.test_request_context():
        with pytest.raises(PermissionError):
            file_streaming.read_stored_file('https://evil.example/storage/v1/object/public/x/a.png')


def test_delete_refuses_foreign_urls(app):
    with app.test_request_context():
        assert delete_stored_file('https://evil.example/storage/v1/object/public/x/a.png') is False


def test_streamed_files_are_not_cached(app, fake_http):
    path = 'generated_docs/system/iba/doc_1.pdf'
    fake_http.objects[(PRIVATE, path)] = b'%PDF-1.4'
    with app.test_request_context():
        response = file_streaming.stream_storage_file(path, download_name='doc.pdf')
    assert response.headers['Cache-Control'] == 'private, no-store'


# --------------------------------------------------------------- serialization & endpoints

def test_user_payload_reports_presence_not_locations(app):
    with app.app_context():
        user = _resident(valid_id_front=PUBLIC_ID_URL, selfie_with_id='verification/residents/iba/user_1/s.png')
        payload = user.to_dict(include_sensitive=True, include_municipality=True)

    assert payload['id_documents'] == {
        'valid_id_front': True, 'valid_id_back': False, 'selfie_with_id': True, 'proof_of_residency': False,
    }
    assert payload['valid_id_front'] is True and payload['valid_id_back'] is None
    serialized = json.dumps(payload)
    assert 'storage' not in serialized and 'verification/' not in serialized


def test_resident_can_view_only_their_own_id(app, fake_http):
    path = 'verification/residents/iba/user_1/valid_id_front/a.png'
    fake_http.objects[(PRIVATE, path)] = _png_bytes()
    with app.app_context():
        user = _resident(valid_id_front=path)
        token = create_access_token(identity=str(user.id), additional_claims={'role': 'resident'})
    client = app.test_client()
    headers = {'Authorization': f'Bearer {token}'}

    ok = client.get('/api/auth/verification-docs/id_front', headers=headers)
    assert ok.status_code == 200
    assert ok.mimetype == 'image/png'
    assert ok.headers['Cache-Control'] == 'private, no-store'
    assert client.get('/api/auth/verification-docs/id_back', headers=headers).status_code == 404
    assert client.get('/api/auth/verification-docs/passport', headers=headers).status_code == 400
    assert client.get('/api/auth/verification-docs/id_front').status_code == 401


def test_id_upload_uses_account_municipality_and_is_audited(app):
    with app.app_context():
        user = _resident()
        token = create_access_token(identity=str(user.id), additional_claims={'role': 'resident'})
        user_id = user.id
    client = app.test_client()

    response = client.post(
        '/api/auth/verification-docs',
        headers={'Authorization': f'Bearer {token}'},
        data={'municipality_slug': '../../outside', 'valid_id_front': (BytesIO(_png_bytes()), 'front.png')},
        content_type='multipart/form-data',
    )
    assert response.status_code == 200, response.get_json()
    body = response.get_json()
    assert body['user']['id_documents']['valid_id_front'] is True

    with app.app_context():
        stored = db.session.get(User, user_id).valid_id_front
        assert stored.startswith('verification/residents/iba/user_')
        audit = AuditLog.query.filter_by(entity_type='user', entity_id=user_id).one()
        assert audit.action == 'verification_docs_uploaded'
        assert audit.new_values == {'documents': ['valid_id_front']}


def test_admin_streams_private_id_with_audit(app, fake_http):
    path = 'verification/residents/iba/user_1/valid_id_front/a.png'
    fake_http.objects[(PRIVATE, path)] = _png_bytes()
    with app.app_context():
        resident = _resident(valid_id_front=path)
        admin = _resident(username='admin', email='admin@example.com', role='superadmin',
                          permissions=['*'], admin_verified=True)
        token = create_access_token(identity=str(admin.id), additional_claims={'role': 'superadmin'})
        resident_id = resident.id

    response = app.test_client().get(
        f'/api/admin/residents/{resident_id}/documents/id_front',
        query_string={'reason': 'Verification review'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert response.status_code == 200
    assert response.data == _png_bytes()


def test_special_status_documents_are_validated_and_private(app):
    with app.test_request_context():
        user = _resident()
        stored = special_status_routes._save_status_document(_upload('student.png'), user.id, 'student', 'student_id')
        assert stored.startswith(f'special_status/residents/iba/user_{user.id}/student/student_id/')
        with pytest.raises(ValidationError):
            special_status_routes._save_status_document(
                _upload('page.html', b'<script>alert(1)</script>', 'text/html'), user.id, 'student', 'cor')


def test_special_status_files_are_never_served_publicly(app):
    response = app.test_client().get('/uploads/special_status/residents/iba/user_1/student/student_id/x.png')
    assert response.status_code == 403


# --------------------------------------------------------------- migration script

def test_classify_reference():
    classify = migration.classify_reference
    assert classify(PUBLIC_ID_URL, SUPABASE, PUBLIC, PRIVATE).action == 'move'
    assert classify(f'{SUPABASE}/storage/v1/object/public/{PUBLIC}/profiles/residents/iba/p.png',
                    SUPABASE, PUBLIC, PRIVATE).action == 'skip'
    normalized = classify(f'{SUPABASE}/storage/v1/object/sign/{PRIVATE}/claims/system/iba/c.png?token=t',
                          SUPABASE, PUBLIC, PRIVATE)
    assert (normalized.action, normalized.path) == ('normalize', 'claims/system/iba/c.png')
    assert classify('verification/residents/iba/u/a.png', SUPABASE, PUBLIC, PRIVATE).action == 'verify'
    assert classify('https://cdn.example/x.png', SUPABASE, PUBLIC, PRIVATE).action == 'external'
    assert classify(None, SUPABASE, PUBLIC, PRIVATE).action == 'skip'


class FakeStorageModule:
    """Bucket store with the supabase_storage functions the migrator calls."""

    def __init__(self, objects):
        self.objects = dict(objects)
        self.deleted = []

    def file_exists(self, path, bucket=None):
        return (bucket, path) in self.objects

    def download_file(self, path, bucket=None):
        if (bucket, path) not in self.objects:
            raise FileNotFoundError(path)
        return self.objects[(bucket, path)], 'image/png'

    def upload_file_to_path(self, file, path, content_type=None, max_size_mb=10, bucket=None, upsert=False):
        self.objects[(bucket, path)] = file.read()
        return path

    def delete_file(self, path, bucket=None):
        self.deleted.append((bucket, path))
        self.objects.pop((bucket, path), None)
        return True

    def list_files(self, prefix, bucket=None):
        for (obj_bucket, path) in list(self.objects):
            if obj_bucket == bucket and path.startswith(prefix + '/'):
                yield {'path': path, 'created_at': '2020-01-01T00:00:00Z'}


def test_migrator_moves_public_files_and_rewrites_references(tmp_path):
    db_file = tmp_path / 'migration.db'
    config = type('Cfg', (PrivateStorageConfig,), {'SQLALCHEMY_DATABASE_URI': f'sqlite:///{db_file}'})
    application = create_app(config)
    id_path = 'verification/residents/iba/user_1/valid_id_front/a.png'
    support_path = 'document_requests/residents/iba/request_1/proof.pdf'
    support_url = f'{SUPABASE}/storage/v1/object/public/{PUBLIC}/{support_path}'
    profile_url = f'{SUPABASE}/storage/v1/object/public/{PUBLIC}/profiles/residents/iba/user_1/p.png'

    with application.app_context():
        db.create_all()
        db.session.add_all([
            Province(id=6, name='Zambales', slug='zambales', psgc_code='037100000'),
            Municipality(id=112, name='Iba', slug='iba', province_id=6, psgc_code='037112000'),
        ])
        db.session.commit()
        user = _resident(barangay_id=None, valid_id_front=PUBLIC_ID_URL, profile_picture=profile_url)
        db.session.add(DocumentType(id=1, name='Clearance', code='CLR', authority_level='municipal',
                                    municipality_id=112, supports_physical=True, is_active=True))
        db.session.commit()
        req = DocumentRequest(request_number='REQ-1', user_id=user.id, document_type_id=1, municipality_id=112,
                              delivery_method='pickup', purpose='Test', status='pending',
                              supporting_documents=[{'path': support_url, 'requirement': 'ID'}])
        db.session.add(req)
        db.session.commit()
        user_id, req_id = user.id, req.id
        engine = db.engine

        fake = FakeStorageModule({
            (PUBLIC, id_path): b'id',
            (PUBLIC, support_path): b'pdf',
            (PUBLIC, 'profiles/residents/iba/user_1/p.png'): b'photo',
            (PUBLIC, 'verification/residents/iba/user_9/old.png'): b'orphan',
        })

        dry = migration.Migrator(engine, fake, SUPABASE, PUBLIC, PRIVATE, apply=False, delete_public=True)
        assert dry.run().counts['references to rewrite'] == 2
        assert (PRIVATE, id_path) not in fake.objects

        live = migration.Migrator(engine, fake, SUPABASE, PUBLIC, PRIVATE, apply=True, delete_public=True)
        report = live.run()
        assert report.counts['references rewritten'] == 2
        assert fake.objects[(PRIVATE, id_path)] == b'id'
        assert fake.objects[(PRIVATE, support_path)] == b'pdf'
        assert (PUBLIC, id_path) not in fake.objects
        assert (PUBLIC, 'profiles/residents/iba/user_1/p.png') in fake.objects

        db.session.expire_all()
        assert db.session.get(User, user_id).valid_id_front == id_path
        assert db.session.get(User, user_id).profile_picture == profile_url
        assert db.session.get(DocumentRequest, req_id).supporting_documents == [
            {'path': support_path, 'requirement': 'ID'}]

        rerun = migration.Migrator(engine, fake, SUPABASE, PUBLIC, PRIVATE, apply=True, delete_public=True)
        assert 'references rewritten' not in rerun.run().counts

        orphans = migration.Migrator(engine, fake, SUPABASE, PUBLIC, PRIVATE,
                                     apply=False, delete_public=False).find_orphans(min_age_days=7)
        assert orphans == [(PUBLIC, 'verification/residents/iba/user_9/old.png')]


def test_supporting_document_lists_only_expose_file_names():
    entries = [
        f'{SUPABASE}/storage/v1/object/public/{PUBLIC}/benefits/residents/iba/application_1/a.pdf',
        {'path': 'document_requests/residents/iba/request_1/b.png', 'requirement': 'Valid ID'},
        '',
    ]
    assert storage.redact_file_entries(entries) == ['a.pdf', {'path': 'b.png', 'requirement': 'Valid ID'}]
    assert storage.redact_file_entries(None) is None
    assert storage.redact_file_entries('["generated_docs/system/iba/doc_1.pdf"]') == ['doc_1.pdf']


def test_missing_private_bucket_is_created_on_first_upload(app, monkeypatch):
    calls = []
    state = {'bucket_exists': False}

    def fake_post(url, headers=None, data=None, json=None, **kwargs):
        calls.append(url)
        if url.endswith('/storage/v1/bucket'):
            assert json['public'] is False and json['id'] == PRIVATE
            state['bucket_exists'] = True
            return FakeResponse(200, b'{"name":"munlinkprivate-files"}')
        if f'/object/{PRIVATE}/' in url and not state['bucket_exists']:
            return FakeResponse(400, b'{"statusCode":"404","error":"Bucket not found","message":"Bucket not found"}')
        return FakeResponse(200, b'{}')

    monkeypatch.setattr(storage.requests, 'post', fake_post)
    with app.test_request_context():
        path = storage.upload_file_to_path(BytesIO(b'%PDF-1.4'), 'generated_docs/system/iba/doc_1.pdf')
    assert path == 'generated_docs/system/iba/doc_1.pdf'
    assert [url.rsplit('/storage/v1/', 1)[1] for url in calls] == [
        f'object/{PRIVATE}/{path}', 'bucket', f'object/{PRIVATE}/{path}']
