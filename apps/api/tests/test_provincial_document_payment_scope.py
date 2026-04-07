"""
Provincial admin document payment scope tests.

Goal: province-wide roles should be accepted on selected payment endpoints
for any Zambales municipality because require_admin_municipality() returns
'ALL' for provincial/superadmin roles.
"""
from apps.api.app import create_app
from apps.api.config import Config
from apps.api import db
from apps.api.models.province import Province
from apps.api.models.municipality import Municipality
from apps.api.models.user import User
from apps.api.models.document import DocumentRequest, DocumentType
from apps.api.routes import admin as admin_routes
from apps.api.utils import office_payment as office_payment_utils
from flask_jwt_extended import create_access_token


class ProvincialDocPaymentScopeConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False


def _seed_scope_data():
    province = Province(id=6, name='Zambales', slug='zambales', psgc_code='037100000')
    muni = Municipality(id=112, name='Iba', slug='iba', province_id=province.id, psgc_code='037112000')
    resident = User(
        username='resident_scope',
        email='resident_scope@example.com',
        password_hash='test',
        first_name='Resident',
        last_name='Scope',
        role='resident',
        email_verified=True,
        admin_verified=True,
        municipality_id=muni.id,
        is_active=True,
    )
    provincial_admin = User(
        username='prov_scope',
        email='prov_scope@example.com',
        password_hash='test',
        first_name='Prov',
        last_name='Scope',
        role='provincial_admin',
        email_verified=True,
        admin_verified=True,
        admin_municipality_id=muni.id,
        is_active=True,
    )
    doc_type = DocumentType(
        id=1,
        name='Test Clearance',
        code='TEST-CLR',
        description='Test document',
        authority_level='municipal',
        municipality_id=muni.id,
        requirements=[],
        supports_physical=True,
        supports_digital=False,
        is_active=True,
    )
    db.session.add_all([province, muni, resident, provincial_admin, doc_type])
    db.session.commit()
    return resident, provincial_admin, doc_type, muni


def _create_request(
    *,
    resident_id: int,
    doc_type_id: int,
    municipality_id: int,
    request_number: str,
    final_fee=50,
    payment_status='pending',
    payment_method='office',
    office_payment_status='code_sent',
    office_payment_code_hash='hash',
    manual_payment_status=None,
    manual_payment_proof_path=None,
):
    req = DocumentRequest(
        request_number=request_number,
        user_id=resident_id,
        document_type_id=doc_type_id,
        municipality_id=municipality_id,
        delivery_method='physical',
        purpose='Test purpose',
        status='approved',
        final_fee=final_fee,
        payment_status=payment_status,
        payment_method=payment_method,
        office_payment_status=office_payment_status,
        office_payment_code_hash=office_payment_code_hash,
        manual_payment_status=manual_payment_status,
        manual_payment_proof_path=manual_payment_proof_path,
    )
    db.session.add(req)
    db.session.commit()
    return req


def test_provincial_admin_can_verify_office_payment_for_zambales_request(monkeypatch):
    app = create_app(ProvincialDocPaymentScopeConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        resident, provincial_admin, doc_type, muni = _seed_scope_data()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            request_number='REQ-OFFICE-VERIFY',
        )
        token = create_access_token(identity=str(provincial_admin.id), additional_claims={'role': 'provincial_admin'})
        req_id = req.id

    monkeypatch.setattr(office_payment_utils, 'verify_office_payment_code', lambda code, code_hash: True)

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/verify-office-payment',
        json={'code': 'ABC123'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 200


def test_provincial_admin_can_resend_office_code_for_zambales_request(monkeypatch):
    app = create_app(ProvincialDocPaymentScopeConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        resident, provincial_admin, doc_type, muni = _seed_scope_data()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            request_number='REQ-OFFICE-RESEND',
        )
        token = create_access_token(identity=str(provincial_admin.id), additional_claims={'role': 'provincial_admin'})
        req_id = req.id

    monkeypatch.setattr(admin_routes, 'send_office_payment_code_email', lambda **kwargs: True)

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/resend-office-code',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 200


def test_provincial_admin_can_approve_manual_payment_for_zambales_request():
    app = create_app(ProvincialDocPaymentScopeConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        resident, provincial_admin, doc_type, muni = _seed_scope_data()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            request_number='REQ-MANUAL-APPROVE',
            payment_method='manual_qr',
            manual_payment_status='submitted',
            manual_payment_proof_path='manual/proof.png',
        )
        token = create_access_token(identity=str(provincial_admin.id), additional_claims={'role': 'provincial_admin'})
        req_id = req.id

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/manual-payment/approve',
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 200


def test_provincial_admin_can_reject_manual_payment_for_zambales_request():
    app = create_app(ProvincialDocPaymentScopeConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        resident, provincial_admin, doc_type, muni = _seed_scope_data()
        req = _create_request(
            resident_id=resident.id,
            doc_type_id=doc_type.id,
            municipality_id=muni.id,
            request_number='REQ-MANUAL-REJECT',
            payment_method='manual_qr',
            manual_payment_status='submitted',
            manual_payment_proof_path='manual/proof.png',
        )
        token = create_access_token(identity=str(provincial_admin.id), additional_claims={'role': 'provincial_admin'})
        req_id = req.id

    resp = client.post(
        f'/api/admin/documents/requests/{req_id}/manual-payment/reject',
        json={'notes': 'Invalid proof'},
        headers={'Authorization': f'Bearer {token}'},
    )
    assert resp.status_code == 200
