from datetime import datetime, timezone

from apps.api.app import create_app
from apps.api.config import Config
from apps.api import db
from apps.api.models.province import Province
from apps.api.models.municipality import Municipality, Barangay
from apps.api.models.user import User
from apps.api.models.announcement import Announcement
from apps.api.models.notification import NotificationOutbox
from apps.api.utils.notifications import queue_announcement_notifications
from flask_jwt_extended import create_access_token


class SharedAnnouncementConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False


def _seed_announcement_admin_fixture():
    province = Province(id=6, name='Zambales', slug='zambales', psgc_code='037100000')
    muni_a = Municipality(id=109, name='Cabangan', slug='cabangan', province_id=province.id, psgc_code='037109000')
    muni_b = Municipality(id=112, name='Iba', slug='iba', province_id=province.id, psgc_code='037112000')
    muni_c = Municipality(id=110, name='Candelaria', slug='candelaria', province_id=province.id, psgc_code='037110000')
    brgy_a = Barangay(id=5002, name='Barangay A', slug='barangay-a', municipality_id=muni_a.id, psgc_code='037109001')
    brgy_b = Barangay(id=5003, name='Barangay B', slug='barangay-b', municipality_id=muni_b.id, psgc_code='037112001')

    muni_admin = User(
        username='muni_admin',
        email='muni_admin@example.com',
        password_hash='test',
        first_name='Muni',
        last_name='Admin',
        role='municipal_admin',
        email_verified=True,
        admin_verified=True,
        is_active=True,
        admin_municipality_id=muni_a.id,
    )
    provincial_admin = User(
        username='prov_admin',
        email='prov_admin@example.com',
        password_hash='test',
        first_name='Prov',
        last_name='Admin',
        role='provincial_admin',
        email_verified=True,
        admin_verified=True,
        is_active=True,
    )
    superadmin = User(
        username='super_admin_ann',
        email='super_admin_ann@example.com',
        password_hash='test',
        first_name='Super',
        last_name='Admin',
        role='superadmin',
        email_verified=True,
        admin_verified=True,
        is_active=True,
    )
    creator = User(
        username='creator_admin_fixture',
        email='creator_admin_fixture@example.com',
        password_hash='test',
        first_name='Creator',
        last_name='Fixture',
        role='resident',
        email_verified=True,
        admin_verified=True,
        is_active=True,
        municipality_id=muni_a.id,
        barangay_id=brgy_a.id,
    )
    resident_a = User(
        username='resident_notify_a',
        email='resident_notify_a@example.com',
        password_hash='test',
        first_name='Resident',
        last_name='A',
        role='resident',
        email_verified=True,
        admin_verified=True,
        is_active=True,
        municipality_id=muni_a.id,
        barangay_id=brgy_a.id,
        notify_email_enabled=True,
        notify_sms_enabled=False,
    )
    resident_b = User(
        username='resident_notify_b',
        email='resident_notify_b@example.com',
        password_hash='test',
        first_name='Resident',
        last_name='B',
        role='resident',
        email_verified=True,
        admin_verified=True,
        is_active=True,
        municipality_id=muni_b.id,
        barangay_id=brgy_b.id,
        notify_email_enabled=True,
        notify_sms_enabled=False,
    )
    resident_c = User(
        username='resident_notify_c',
        email='resident_notify_c@example.com',
        password_hash='test',
        first_name='Resident',
        last_name='C',
        role='resident',
        email_verified=True,
        admin_verified=True,
        is_active=True,
        municipality_id=muni_c.id,
        notify_email_enabled=True,
        notify_sms_enabled=False,
    )

    db.session.add_all([
        province,
        muni_a,
        muni_b,
        muni_c,
        brgy_a,
        brgy_b,
        muni_admin,
        provincial_admin,
        superadmin,
        creator,
        resident_a,
        resident_b,
        resident_c,
    ])
    db.session.commit()
    return {
        'municipality_a_id': muni_a.id,
        'municipality_b_id': muni_b.id,
        'municipality_c_id': muni_c.id,
        'barangay_a_id': brgy_a.id,
        'barangay_b_id': brgy_b.id,
        'municipal_admin_id': muni_admin.id,
        'provincial_admin_id': provincial_admin.id,
        'superadmin_id': superadmin.id,
        'creator_id': creator.id,
        'resident_a_id': resident_a.id,
        'resident_b_id': resident_b.id,
        'resident_c_id': resident_c.id,
    }


def _auth_headers(user_id, role):
    token = create_access_token(identity=str(user_id), additional_claims={'role': role})
    return {'Authorization': f'Bearer {token}'}


def test_barangay_shared_metadata_does_not_override_scope_for_feed_or_detail():
    app = create_app(SharedAnnouncementConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        ids = _seed_announcement_admin_fixture()
        resident_b = User.query.filter_by(id=ids['resident_b_id']).first()
        now = datetime.now(timezone.utc)
        ann = Announcement(
            title='Shared Barangay Notice',
            content='Shared to another municipality',
            scope='BARANGAY',
            municipality_id=ids['municipality_a_id'],
            barangay_id=ids['barangay_a_id'],
            created_by=ids['creator_id'],
            priority='medium',
            status='PUBLISHED',
            publish_at=now,
            shared_with_municipalities=[ids['municipality_b_id']],
            is_active=True,
        )
        db.session.add(ann)
        db.session.commit()
        ann_id = ann.id
        headers = _auth_headers(resident_b.id, 'resident')

    resp = client.get('/api/announcements', headers=headers)
    assert resp.status_code == 200
    data = resp.get_json() or {}
    ids_seen = [item.get('id') for item in data.get('announcements', [])]
    assert ann_id not in ids_seen

    resp = client.get(f'/api/announcements/{ann_id}', headers=headers)
    assert resp.status_code == 404


def test_municipal_admin_create_persists_normalized_shared_municipalities():
    app = create_app(SharedAnnouncementConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        ids = _seed_announcement_admin_fixture()
        headers = _auth_headers(ids['municipal_admin_id'], 'municipal_admin')

    resp = client.post(
        '/api/admin/announcements',
        json={
            'title': 'Municipality Draft',
            'content': 'Draft announcement',
            'scope': 'MUNICIPALITY',
            'municipality_id': ids['municipality_a_id'],
            'status': 'DRAFT',
            'shared_with_municipalities': [
                ids['municipality_a_id'],
                ids['municipality_b_id'],
                ids['municipality_b_id'],
                ids['municipality_c_id'],
            ],
            'public_viewable': True,
        },
        headers=headers,
    )
    assert resp.status_code == 201
    payload = resp.get_json() or {}
    announcement = payload.get('announcement') or {}
    assert announcement.get('shared_with_municipalities') == [
        ids['municipality_b_id'],
        ids['municipality_c_id'],
    ]
    assert announcement.get('public_viewable') is False

    ann_id = announcement.get('id')
    with app.app_context():
        created = db.session.get(Announcement, ann_id)
        assert created is not None
        assert created.shared_with_municipalities == [
            ids['municipality_b_id'],
            ids['municipality_c_id'],
        ]
        assert created.public_viewable is False


def test_municipal_admin_update_replaces_normalized_shared_municipalities():
    app = create_app(SharedAnnouncementConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        ids = _seed_announcement_admin_fixture()
        now = datetime.now(timezone.utc)
        ann = Announcement(
            title='Shared Post',
            content='Original share list',
            scope='MUNICIPALITY',
            municipality_id=ids['municipality_a_id'],
            created_by=ids['creator_id'],
            created_by_staff_id=ids['municipal_admin_id'],
            priority='medium',
            status='DRAFT',
            publish_at=now,
            shared_with_municipalities=[ids['municipality_b_id']],
            public_viewable=True,
            is_active=False,
        )
        db.session.add(ann)
        db.session.commit()
        ann_id = ann.id
        headers = _auth_headers(ids['municipal_admin_id'], 'municipal_admin')

    resp = client.put(
        f'/api/admin/announcements/{ann_id}',
        json={
            'title': 'Updated Shared Post',
            'shared_with_municipalities': [
                ids['municipality_a_id'],
                ids['municipality_c_id'],
                ids['municipality_c_id'],
            ],
            'public_viewable': True,
        },
        headers=headers,
    )
    assert resp.status_code == 200
    payload = resp.get_json() or {}
    announcement = payload.get('announcement') or {}
    assert announcement.get('shared_with_municipalities') == [ids['municipality_c_id']]
    assert announcement.get('public_viewable') is False

    with app.app_context():
        updated = db.session.get(Announcement, ann_id)
        assert updated is not None
        assert updated.shared_with_municipalities == [ids['municipality_c_id']]
        assert updated.public_viewable is False


def test_create_rejects_invalid_shared_municipalities_and_unsupported_scopes():
    app = create_app(SharedAnnouncementConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        ids = _seed_announcement_admin_fixture()
        muni_headers = _auth_headers(ids['municipal_admin_id'], 'municipal_admin')
        super_headers = _auth_headers(ids['superadmin_id'], 'superadmin')

    invalid_target = client.post(
        '/api/admin/announcements',
        json={
            'title': 'Invalid Share',
            'content': 'Invalid municipality',
            'scope': 'MUNICIPALITY',
            'municipality_id': ids['municipality_a_id'],
            'status': 'DRAFT',
            'shared_with_municipalities': [130],
        },
        headers=muni_headers,
    )
    assert invalid_target.status_code == 400

    province_share = client.post(
        '/api/admin/announcements',
        json={
            'title': 'Province Share',
            'content': 'Unsupported share list',
            'scope': 'PROVINCE',
            'status': 'DRAFT',
            'shared_with_municipalities': [ids['municipality_b_id']],
        },
        headers=super_headers,
    )
    assert province_share.status_code == 400

    barangay_share = client.post(
        '/api/admin/announcements',
        json={
            'title': 'Barangay Share',
            'content': 'Unsupported share list',
            'scope': 'BARANGAY',
            'barangay_id': ids['barangay_a_id'],
            'municipality_id': ids['municipality_a_id'],
            'status': 'DRAFT',
            'shared_with_municipalities': [ids['municipality_b_id']],
        },
        headers=super_headers,
    )
    assert barangay_share.status_code == 400


def test_superadmin_can_create_shared_municipality_announcement():
    app = create_app(SharedAnnouncementConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        ids = _seed_announcement_admin_fixture()
        headers = _auth_headers(ids['superadmin_id'], 'superadmin')

    resp = client.post(
        '/api/admin/announcements',
        json={
            'title': 'Super Shared Announcement',
            'content': 'Superadmin municipal share',
            'scope': 'MUNICIPALITY',
            'municipality_id': ids['municipality_a_id'],
            'status': 'DRAFT',
            'shared_with_municipalities': [ids['municipality_b_id']],
        },
        headers=headers,
    )
    assert resp.status_code == 201
    payload = resp.get_json() or {}
    assert (payload.get('announcement') or {}).get('shared_with_municipalities') == [ids['municipality_b_id']]


def test_provincial_admin_cannot_create_shared_municipality_announcement():
    app = create_app(SharedAnnouncementConfig)
    client = app.test_client()

    with app.app_context():
        db.create_all()
        ids = _seed_announcement_admin_fixture()
        headers = _auth_headers(ids['provincial_admin_id'], 'provincial_admin')

    resp = client.post(
        '/api/admin/announcements',
        json={
            'title': 'Province Cannot Share Municipality',
            'content': 'Should fail',
            'scope': 'MUNICIPALITY',
            'municipality_id': ids['municipality_a_id'],
            'status': 'DRAFT',
            'shared_with_municipalities': [ids['municipality_b_id']],
        },
        headers=headers,
    )
    assert resp.status_code == 403


def test_municipality_shared_notifications_target_source_and_shared_municipalities():
    app = create_app(SharedAnnouncementConfig)

    with app.app_context():
        db.create_all()
        ids = _seed_announcement_admin_fixture()
        now = datetime.now(timezone.utc)
        ann = Announcement(
            title='Shared Notification',
            content='Notification fanout should match source plus shared audiences',
            scope='MUNICIPALITY',
            municipality_id=ids['municipality_a_id'],
            created_by=ids['creator_id'],
            priority='medium',
            status='PUBLISHED',
            publish_at=now,
            shared_with_municipalities=[
                ids['municipality_a_id'],
                ids['municipality_b_id'],
                ids['municipality_b_id'],
            ],
            is_active=True,
        )
        db.session.add(ann)
        db.session.commit()

        results = queue_announcement_notifications(ann)
        db.session.commit()

        rows = NotificationOutbox.query.filter_by(
            event_type='announcement_published',
            channel='email',
            entity_id=ann.id,
        ).all()
        resident_ids = {row.resident_id for row in rows}

        assert ids['resident_a_id'] in resident_ids
        assert ids['resident_b_id'] in resident_ids
        assert ids['resident_c_id'] not in resident_ids
        assert results['queued'] >= 2


def test_barangay_notifications_ignore_shared_metadata():
    app = create_app(SharedAnnouncementConfig)

    with app.app_context():
        db.create_all()
        ids = _seed_announcement_admin_fixture()
        now = datetime.now(timezone.utc)
        ann = Announcement(
            title='Barangay Notification',
            content='Barangay fanout should remain exact-match only',
            scope='BARANGAY',
            municipality_id=ids['municipality_a_id'],
            barangay_id=ids['barangay_a_id'],
            created_by=ids['creator_id'],
            priority='medium',
            status='PUBLISHED',
            publish_at=now,
            shared_with_municipalities=[ids['municipality_b_id']],
            is_active=True,
        )
        db.session.add(ann)
        db.session.commit()

        results = queue_announcement_notifications(ann)
        db.session.commit()

        rows = NotificationOutbox.query.filter_by(
            event_type='announcement_published',
            channel='email',
            entity_id=ann.id,
        ).all()
        resident_ids = {row.resident_id for row in rows}

        assert ids['resident_a_id'] in resident_ids
        assert ids['resident_b_id'] not in resident_ids
        assert ids['resident_c_id'] not in resident_ids
        assert results['queued'] >= 1
