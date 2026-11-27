"""Backend support for the Citizen's Charter redesign.

- Public document catalogue exposes fee_confirmed.
- Admin request list supports search (q) and status lists.
- Admin queue summary counts open requests in the admin's scope only.
- Admins can confirm fees only for their own office's document types, and it is audited.
- Accepted ID types are public, and registration rejects unknown ID types.
"""
from flask_jwt_extended import create_access_token

from apps.api import db
from apps.api.app import create_app
from apps.api.config import Config
from apps.api.models.audit import AuditLog
from apps.api.models.document import DocumentRequest, DocumentType
from apps.api.models.municipality import Barangay, Municipality
from apps.api.models.province import Province
from apps.api.models.user import User


class RedesignConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False


ADMIN_PERMS = ['residents:approve', 'documents:manage']


def _setup():
    app = create_app(RedesignConfig)
    ids = {}
    with app.app_context():
        db.create_all()
        province = Province(id=6, name='Zambales', slug='zambales', psgc_code='037100000')
        iba = Municipality(id=112, name='Iba', slug='iba', province_id=6, psgc_code='037112000')
        botolan = Municipality(id=108, name='Botolan', slug='botolan', province_id=6, psgc_code='037108000')
        brgy = Barangay(id=2001, name='Zone 1', slug='zone-1', municipality_id=112, psgc_code='037112001')
        iba_permit = DocumentType(id=1, name='Business Permit', code='IBA-BP', authority_level='municipal',
                                  municipality_id=112, fee=300, processing_days=3)
        iba_clearance = DocumentType(id=2, name='Barangay Clearance', code='IBA-Z1-BC', authority_level='barangay',
                                     municipality_id=112, barangay_id=2001, fee=50, processing_days=1)
        botolan_permit = DocumentType(id=3, name='Business Permit', code='BOT-BP', authority_level='municipal',
                                      municipality_id=108, fee=250, processing_days=3)
        db.session.add_all([province, iba, botolan, brgy, iba_permit, iba_clearance, botolan_permit])

        def user(username, **kw):
            u = User(username=username, email=f'{username}@example.com', password_hash='x',
                     first_name=kw.pop('first_name', username.title()), last_name=kw.pop('last_name', 'Test'), **kw)
            db.session.add(u)
            db.session.flush()
            ids[username] = u.id
            return u

        maria = user('maria', first_name='Maria', last_name='Santos', role='resident', municipality_id=112, barangay_id=2001)
        jose = user('jose', first_name='Jose', last_name='Reyes', role='resident', municipality_id=108)
        user('iba_admin', role='municipal_admin', admin_municipality_id=112, permissions=ADMIN_PERMS)
        user('zone_admin', role='barangay_admin', admin_municipality_id=112, admin_barangay_id=2001, permissions=ADMIN_PERMS)

        def req(number, owner, doc_id, muni, status, brgy_id=None, manual=None):
            db.session.add(DocumentRequest(request_number=number, user_id=owner.id, document_type_id=doc_id,
                                           municipality_id=muni, barangay_id=brgy_id, delivery_method='physical',
                                           purpose='Employment', status=status, manual_payment_status=manual))

        req('REQ-A', maria, 1, 112, 'pending', manual='submitted')
        req('REQ-B', maria, 2, 112, 'barangay_processing', brgy_id=2001)
        req('REQ-C', maria, 1, 112, 'ready')
        req('REQ-D', maria, 1, 112, 'completed')
        req('REQ-E', jose, 3, 108, 'pending')
        db.session.commit()
    return app, ids


def _auth(app, user_id, role):
    with app.app_context():
        token = create_access_token(identity=str(user_id), additional_claims={'role': role})
    return {'Authorization': f'Bearer {token}'}


def test_public_document_types_report_fee_confirmed():
    app, _ = _setup()
    resp = app.test_client().get('/api/documents/types?municipality_id=112')
    assert resp.status_code == 200
    types = resp.get_json()['types']
    assert types and all(t['fee_confirmed'] is False for t in types)


def test_admin_request_search_and_status_list():
    app, ids = _setup()
    client = app.test_client()
    headers = _auth(app, ids['iba_admin'], 'municipal_admin')

    by_name = client.get('/api/admin/documents/requests?q=maria santos', headers=headers).get_json()
    assert by_name['pagination']['total'] == 4

    by_number = client.get('/api/admin/documents/requests?q=REQ-C', headers=headers).get_json()
    assert [r['request_number'] for r in by_number['requests']] == ['REQ-C']

    # Jose is in Botolan: never visible to the Iba admin, even by search.
    other_town = client.get('/api/admin/documents/requests?q=jose', headers=headers).get_json()
    assert other_town['pagination']['total'] == 0

    waiting = client.get('/api/admin/documents/requests?status=pending,barangay_processing', headers=headers).get_json()
    assert sorted(r['request_number'] for r in waiting['requests']) == ['REQ-A', 'REQ-B']


def test_queue_summary_is_scoped():
    app, ids = _setup()
    client = app.test_client()

    muni = client.get('/api/admin/documents/queue', headers=_auth(app, ids['iba_admin'], 'municipal_admin'))
    assert muni.status_code == 200
    data = muni.get_json()
    assert data['waiting'] == 2
    assert data['ready_for_pickup'] == 1
    assert data['payments_to_review'] == 1
    assert data['oldest_waiting_at']

    brgy = client.get('/api/admin/documents/queue', headers=_auth(app, ids['zone_admin'], 'barangay_admin')).get_json()
    assert brgy['waiting'] == 1
    assert brgy['ready_for_pickup'] == 0


def test_admin_confirms_fee_for_own_office_only():
    app, ids = _setup()
    client = app.test_client()
    headers = _auth(app, ids['iba_admin'], 'municipal_admin')

    listed = client.get('/api/admin/document-types', headers=headers).get_json()
    assert [t['id'] for t in listed['types']] == [1]

    ok = client.put('/api/admin/document-types/1/fee', json={'fee': 350, 'processing_days': 2}, headers=headers)
    assert ok.status_code == 200
    assert ok.get_json()['type']['fee_confirmed'] is True
    assert ok.get_json()['type']['fee'] == 350.0

    # Another town's document and a barangay document are both out of scope.
    assert client.put('/api/admin/document-types/3/fee', json={'fee': 1}, headers=headers).status_code == 404
    assert client.put('/api/admin/document-types/2/fee', json={'fee': 1}, headers=headers).status_code == 404

    bad = client.put('/api/admin/document-types/1/fee', json={'fee': 'free'}, headers=headers)
    assert bad.status_code == 400

    with app.app_context():
        assert db.session.get(DocumentType, 3).fee_confirmed is False
        log = AuditLog.query.filter_by(entity_type='document_type', entity_id=1).first()
        assert log is not None and log.action == 'document_fee_updated'


def test_barangay_admin_confirms_own_barangay_fee():
    app, ids = _setup()
    client = app.test_client()
    headers = _auth(app, ids['zone_admin'], 'barangay_admin')
    listed = client.get('/api/admin/document-types', headers=headers).get_json()
    assert [t['id'] for t in listed['types']] == [2]
    assert client.put('/api/admin/document-types/2/fee', json={'fee': 40}, headers=headers).status_code == 200
    assert client.put('/api/admin/document-types/1/fee', json={'fee': 40}, headers=headers).status_code == 404


def test_valid_id_types_are_public_and_enforced():
    app, _ = _setup()
    client = app.test_client()
    types = client.get('/api/auth/valid-id-types').get_json()['types']
    assert {'value': 'philsys', 'label': 'PhilSys National ID (PhilID / ePhilID)'} in types

    resp = client.post('/api/auth/register', json={
        'username': 'newres', 'email': 'newres@gmail.com', 'password': 'Str0ng!Passw0rd',
        'first_name': 'New', 'last_name': 'Resident', 'date_of_birth': '1990-01-01',
        'valid_id_type': 'library_card',
    })
    assert resp.status_code == 400
    assert 'ID type' in resp.get_json()['error']
