"""
Document fulfillment precondition tests.

Goal: standalone pickup/claim endpoints should honor the same minimum
fulfillment guardrails as the central admin status transition flow.
"""
from apps.api.app import create_app
from apps.api.config import Config
from apps.api import db
from apps.api.models.province import Province
from apps.api.models.municipality import Municipality, Barangay
from apps.api.models.user import User
from apps.api.models.document import DocumentRequest, DocumentType
from apps.api.routes import admin as admin_routes
from flask_jwt_extended import create_access_token


class DocumentFulfillmentConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False
    UPLOAD_FOLDER = 'tmp-tests/uploads'


def _mute_side_effects(monkeypatch):
    monkeypatch.setattr(admin_routes, 'queue_document_status_change', lambda *args, **kwargs: None)
    monkeypatch.setattr(admin_routes, 'flush_pending_notifications', lambda *args, **kwargs: None)
    monkeypatch.setattr(admin_routes, 'build_qr_png', lambda data, request_id, slug: (None, f'claims/{request_id}.png'))


def _seed_common(*, authority_level='municipal', requirements=None):
    province = Province(id=6, name='Zambales', slug='zambales', psgc_code='037100000')
    muni = Municipality(id=112, name='Iba', slug='iba', province_id=province.id, psgc_code='037112000')
    brgy = Barangay(id=2001, name='Barangay Uno', slug='barangay-uno', municipality_id=muni.id, psgc_code='037112001')

    resident = User(
        username='resident_doc',
        email='resident_doc@example.com',
        password_hash='test',
        first_name='Resident',
        last_name='Doc',
        role='resident',
        email_verified=True,
        admin_verified=True,
        municipality_id=muni.id,
        barangay_id=brgy.id,
        is_active=True,
    )
    muni_admin = User(
        username='muni_admin_doc',
        email='muni_admin_doc@example.com',
        password_hash='test',
        first_name='Muni',
        last_name='Admin',
        role='municipal_admin',
        email_verified=True,
        admin_verified=True,
        admin_municipality_id=muni.id,
        is_active=True,
    )
    brgy_admin = User(
        username='brgy_admin_doc',
        email='brgy_admin_doc@example.com',
        password_hash='test',
        first_name='Brgy',
        last_name='Admin',
        role='barangay_admin',
        email_verified=True,
        admin_verified=True,
        admin_municipality_id=muni.id,
        admin_barangay_id=brgy.id,
        is_active=True,
    )
    doc_type = DocumentType(
        id=1,
        name='Test Clearance',
        code='TEST-CLR',
        description='Test document',
        authority_level=authority_level,
        municipality_id=muni.id,
        requirements=requirements or [],
        supports_physical=True,
        supports_digital=False,
        is_active=True,
    )

    db.session.add_all([province, muni, brgy, resident, muni_admin, brgy_admin, doc_type])
    db.session.commit()
    return resident, muni_admin, brgy_admin, doc_type, muni, brgy


def _create_request(
    *,
    resident_id,
    doc_type_id,
    municipality_id,
    barangay_id,
    request_number,
    status='processing',
    final_fee=0,
    payment_status='waived',
    office_payment_status=None,
    office_payment_code_hash=None,
    supporting_documents=None,
):
    req = DocumentRequest(
        request_number=request_number,
        user_id=resident_id,
        document_type_id=doc_type_id,
        municipality_id=municipality_id,
        barangay_id=barangay_id,
        delivery_method='physical',
        purpose='Test purpose',
        status=status,
        final_fee=final_fee,
        payment_status=payment_status,
        office_payment_status=office_payment_status,
        office_payment_code_hash=office_payment_code_hash,
        supporting_documents=supporting_documents,
    )
    db.session.add(req)
    db.session.commit()
    return req


def test_ready_for_pickup_rejects_invalid_transition_from_approved(monkeypatch):
    app = create_app(DocumentFulfillmentConfig)
    client = app.test_client()
    _mute_side_effects(monkeypatch)

    with app.app_context():
        db.create_all()
        resident, muni_admin, _, doc_type, muni, brgy = _seed_common()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            request_number='REQ-READY-APPROVED',
            status='approved',
        )
        token = create_access_token(identity=str(muni_admin.id), additional_claims={'role': 'municipal_admin'})
        req_id = req.id

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/ready-for-pickup',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 400
    assert 'invalid transition' in resp.get_json()['error'].lower()


def test_ready_for_pickup_requires_supporting_documents(monkeypatch):
    app = create_app(DocumentFulfillmentConfig)
    client = app.test_client()
    _mute_side_effects(monkeypatch)

    with app.app_context():
        db.create_all()
        resident, muni_admin, _, doc_type, muni, brgy = _seed_common(requirements=['valid_id'])
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            request_number='REQ-READY-REQS',
            status='processing',
            supporting_documents=[],
        )
        token = create_access_token(identity=str(muni_admin.id), additional_claims={'role': 'municipal_admin'})
        req_id = req.id

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/ready-for-pickup',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 400
    assert 'required documents' in resp.get_json()['error'].lower()


def test_barangay_admin_cannot_mark_municipal_request_ready_for_pickup(monkeypatch):
    app = create_app(DocumentFulfillmentConfig)
    client = app.test_client()
    _mute_side_effects(monkeypatch)

    with app.app_context():
        db.create_all()
        resident, _, brgy_admin, doc_type, muni, brgy = _seed_common(authority_level='municipal')
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            request_number='REQ-READY-BRGY-MUNI',
            status='processing',
        )
        token = create_access_token(identity=str(brgy_admin.id), additional_claims={'role': 'barangay_admin'})
        req_id = req.id

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/ready-for-pickup',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 403
    assert 'cannot set this status' in resp.get_json()['error'].lower()


def test_claim_token_rejects_non_ready_request(monkeypatch):
    app = create_app(DocumentFulfillmentConfig)
    client = app.test_client()
    _mute_side_effects(monkeypatch)

    with app.app_context():
        db.create_all()
        resident, muni_admin, _, doc_type, muni, brgy = _seed_common()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            request_number='REQ-CLAIM-PROCESSING',
            status='processing',
        )
        token = create_access_token(identity=str(muni_admin.id), additional_claims={'role': 'municipal_admin'})
        req_id = req.id

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/claim-token',
        json={'window_start': '09:00', 'window_end': '10:00'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 400
    assert 'not ready' in resp.get_json()['error'].lower()


def test_claim_token_rejects_unpaid_ready_request(monkeypatch):
    app = create_app(DocumentFulfillmentConfig)
    client = app.test_client()
    _mute_side_effects(monkeypatch)

    with app.app_context():
        db.create_all()
        resident, muni_admin, _, doc_type, muni, brgy = _seed_common()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            request_number='REQ-CLAIM-UNPAID',
            status='ready',
            final_fee=50,
            payment_status='pending',
        )
        token = create_access_token(identity=str(muni_admin.id), additional_claims={'role': 'municipal_admin'})
        req_id = req.id

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/claim-token',
        json={'window_start': '09:00', 'window_end': '10:00'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 400
    assert 'payment' in resp.get_json()['error'].lower()


def test_claim_token_succeeds_for_ready_paid_pickup_request(monkeypatch):
    app = create_app(DocumentFulfillmentConfig)
    client = app.test_client()
    _mute_side_effects(monkeypatch)

    with app.app_context():
        db.create_all()
        resident, muni_admin, _, doc_type, muni, brgy = _seed_common()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            request_number='REQ-CLAIM-READY',
            status='ready',
            final_fee=50,
            payment_status='paid',
        )
        token = create_access_token(identity=str(muni_admin.id), additional_claims={'role': 'municipal_admin'})
        req_id = req.id

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/claim-token',
        json={'window_start': '09:00', 'window_end': '10:00'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 200
    payload = resp.get_json()
    assert payload['claim']['qr_available'] is True
    assert payload['request']['status'] == 'ready'


def test_free_pickup_approval_does_not_generate_office_payment_code(monkeypatch):
    app = create_app(DocumentFulfillmentConfig)
    client = app.test_client()
    _mute_side_effects(monkeypatch)

    sent = {'called': False}

    def _fake_send_email(**kwargs):
        sent['called'] = True
        return True

    monkeypatch.setattr(admin_routes, 'send_office_payment_code_email', _fake_send_email)
    monkeypatch.setattr(admin_routes, 'generate_office_payment_code', lambda: 'ABC123')
    monkeypatch.setattr(admin_routes, 'hash_office_payment_code', lambda code: f'hash:{code}')

    with app.app_context():
        db.create_all()
        resident, muni_admin, _, doc_type, muni, brgy = _seed_common()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            request_number='REQ-FREE-PICKUP',
            status='pending',
            final_fee=0,
            payment_status='waived',
        )
        token = create_access_token(identity=str(muni_admin.id), additional_claims={'role': 'municipal_admin'})
        req_id = req.id

    resp = client.put(
        f'/api/admin/documents/requests/{req_id}/status',
        json={'status': 'approved'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 200
    assert sent['called'] is False

    with app.app_context():
        refreshed = db.session.get(DocumentRequest, req_id)
        assert refreshed.office_payment_code_hash is None
        assert refreshed.office_payment_status in (None, '')


def test_paid_pickup_approval_still_generates_office_payment_code(monkeypatch):
    app = create_app(DocumentFulfillmentConfig)
    client = app.test_client()
    _mute_side_effects(monkeypatch)

    sent = {'called': False}

    def _fake_send_email(**kwargs):
        sent['called'] = True
        return True

    monkeypatch.setattr(admin_routes, 'send_office_payment_code_email', _fake_send_email)
    monkeypatch.setattr(admin_routes, 'generate_office_payment_code', lambda: 'ABC123')
    monkeypatch.setattr(admin_routes, 'hash_office_payment_code', lambda code: f'hash:{code}')

    with app.app_context():
        db.create_all()
        resident, muni_admin, _, doc_type, muni, brgy = _seed_common()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            request_number='REQ-PAID-PICKUP',
            status='pending',
            final_fee=75,
            payment_status='pending',
        )
        token = create_access_token(identity=str(muni_admin.id), additional_claims={'role': 'municipal_admin'})
        req_id = req.id

    resp = client.put(
        f'/api/admin/documents/requests/{req_id}/status',
        json={'status': 'approved'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 200
    assert sent['called'] is True

    with app.app_context():
        refreshed = db.session.get(DocumentRequest, req_id)
        assert refreshed.office_payment_code_hash == 'hash:ABC123'
        assert refreshed.office_payment_status == 'code_sent'


def test_resend_office_code_rejects_free_pickup_request(monkeypatch):
    app = create_app(DocumentFulfillmentConfig)
    client = app.test_client()
    _mute_side_effects(monkeypatch)

    sent = {'called': False}

    def _fake_send_email(**kwargs):
        sent['called'] = True
        return True

    monkeypatch.setattr(admin_routes, 'send_office_payment_code_email', _fake_send_email)
    monkeypatch.setattr(admin_routes, 'generate_office_payment_code', lambda: 'ABC123')
    monkeypatch.setattr(admin_routes, 'hash_office_payment_code', lambda code: f'hash:{code}')

    with app.app_context():
        db.create_all()
        resident, muni_admin, _, doc_type, muni, brgy = _seed_common()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            barangay_id=brgy.id,
            request_number='REQ-FREE-RESEND',
            status='approved',
            final_fee=0,
            payment_status='waived',
            office_payment_status='code_sent',
            office_payment_code_hash='legacy-hash',
        )
        token = create_access_token(identity=str(muni_admin.id), additional_claims={'role': 'municipal_admin'})
        req_id = req.id

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/resend-office-code',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 400
    assert resp.get_json()['error'] == 'No office payment is required for this request'
    assert sent['called'] is False
