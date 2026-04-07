from datetime import datetime, timedelta, timezone

from apps.api.app import create_app
from apps.api.config import Config
from apps.api import db
from apps.api.models.province import Province
from apps.api.models.municipality import Municipality, Barangay
from apps.api.models.user import User
from apps.api.models.announcement import Announcement
from flask_jwt_extended import create_access_token


class ScopedTestConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False


def build_app_with_announcements():
    app = create_app(ScopedTestConfig)
    with app.app_context():
        db.create_all()
        province = Province(id=6, name='Zambales', slug='zambales', psgc_code='037100000')
        home_muni = Municipality(id=112, name='Iba', slug='iba', province_id=province.id, psgc_code='037112000')
        other_muni = Municipality(id=109, name='Cabangan', slug='cabangan', province_id=province.id, psgc_code='037109000')
        third_muni = Municipality(id=110, name='Candelaria', slug='candelaria', province_id=province.id, psgc_code='037110000')
        home_brgy = Barangay(id=5001, name='Barangay 1', slug='barangay-1', municipality_id=home_muni.id, psgc_code='037112001')
        other_brgy = Barangay(id=5002, name='Barangay 2', slug='barangay-2', municipality_id=other_muni.id, psgc_code='037109001')
        third_brgy = Barangay(id=5003, name='Barangay 3', slug='barangay-3', municipality_id=third_muni.id, psgc_code='037110001')

        resident = User(
            username='resident',
            email='res@example.com',
            password_hash='test',
            first_name='Home',
            last_name='Resident',
            role='resident',
            email_verified=True,
            admin_verified=True,
            municipality_id=home_muni.id,
            barangay_id=home_brgy.id,
        )
        other_creator = User(
            username='other_creator',
            email='other_creator@example.com',
            password_hash='test',
            first_name='Other',
            last_name='Creator',
            role='resident',
            email_verified=True,
            admin_verified=True,
            municipality_id=other_muni.id,
            barangay_id=other_brgy.id,
        )
        third_creator = User(
            username='third_creator',
            email='third_creator@example.com',
            password_hash='test',
            first_name='Third',
            last_name='Creator',
            role='resident',
            email_verified=True,
            admin_verified=True,
            municipality_id=third_muni.id,
            barangay_id=third_brgy.id,
        )
        db.session.add_all([
            province,
            home_muni,
            other_muni,
            third_muni,
            home_brgy,
            other_brgy,
            third_brgy,
            resident,
            other_creator,
            third_creator,
        ])
        db.session.flush()

        now = datetime.now(timezone.utc)
        ann_province = Announcement(
            title='Province Update',
            content='Zambales-wide notice',
            scope='PROVINCE',
            municipality_id=None,
            created_by=resident.id,
            priority='medium',
            status='PUBLISHED',
            publish_at=now,
            pinned=True,
            pinned_until=now + timedelta(days=2),
            is_active=True,
        )
        ann_home_muni = Announcement(
            title='Home Municipality',
            content='Iba notice',
            scope='MUNICIPALITY',
            municipality_id=home_muni.id,
            created_by=resident.id,
            priority='low',
            status='PUBLISHED',
            publish_at=now,
            is_active=True,
        )
        ann_other_muni = Announcement(
            title='Other Municipality',
            content='Cabangan notice',
            scope='MUNICIPALITY',
            municipality_id=other_muni.id,
            created_by=other_creator.id,
            priority='low',
            status='PUBLISHED',
            publish_at=now,
            is_active=True,
        )
        ann_shared_to_home = Announcement(
            title='Shared To Home',
            content='Cabangan announcement shared to Iba',
            scope='MUNICIPALITY',
            municipality_id=other_muni.id,
            created_by=other_creator.id,
            priority='medium',
            status='PUBLISHED',
            publish_at=now,
            shared_with_municipalities=[home_muni.id],
            is_active=True,
        )
        ann_shared_to_other = Announcement(
            title='Shared To Other',
            content='Iba announcement shared to Cabangan',
            scope='MUNICIPALITY',
            municipality_id=home_muni.id,
            created_by=resident.id,
            priority='medium',
            status='PUBLISHED',
            publish_at=now,
            shared_with_municipalities=[other_muni.id],
            is_active=True,
        )
        ann_third_muni = Announcement(
            title='Third Municipality',
            content='Candelaria notice',
            scope='MUNICIPALITY',
            municipality_id=third_muni.id,
            created_by=third_creator.id,
            priority='low',
            status='PUBLISHED',
            publish_at=now,
            is_active=True,
        )
        ann_home_brgy = Announcement(
            title='Home Barangay',
            content='Barangay specific',
            scope='BARANGAY',
            municipality_id=home_muni.id,
            barangay_id=home_brgy.id,
            created_by=resident.id,
            priority='high',
            status='PUBLISHED',
            publish_at=now,
            is_active=True,
        )
        ann_other_brgy = Announcement(
            title='Other Barangay',
            content='Not yours',
            scope='BARANGAY',
            municipality_id=other_muni.id,
            barangay_id=other_brgy.id,
            created_by=other_creator.id,
            priority='medium',
            status='PUBLISHED',
            publish_at=now,
            is_active=True,
        )
        ann_shared_barangay = Announcement(
            title='Shared Barangay Metadata',
            content='Shared metadata should not widen barangay visibility',
            scope='BARANGAY',
            municipality_id=other_muni.id,
            barangay_id=other_brgy.id,
            created_by=other_creator.id,
            priority='medium',
            status='PUBLISHED',
            publish_at=now,
            shared_with_municipalities=[home_muni.id],
            is_active=True,
        )
        db.session.add_all([
            ann_province,
            ann_home_muni,
            ann_other_muni,
            ann_shared_to_home,
            ann_shared_to_other,
            ann_third_muni,
            ann_home_brgy,
            ann_other_brgy,
            ann_shared_barangay,
        ])
        db.session.commit()
        return app, resident.id, {
            'province': ann_province.id,
            'home_municipality': ann_home_muni.id,
            'other_municipality': ann_other_muni.id,
            'shared_to_home': ann_shared_to_home.id,
            'shared_to_other': ann_shared_to_other.id,
            'third_municipality': ann_third_muni.id,
            'home_barangay': ann_home_brgy.id,
            'other_barangay': ann_other_brgy.id,
            'shared_barangay': ann_shared_barangay.id,
            'home_municipality_id': home_muni.id,
            'other_municipality_id': other_muni.id,
            'third_municipality_id': third_muni.id,
            'home_barangay_id': home_brgy.id,
            'other_barangay_id': other_brgy.id,
        }


def _resident_headers(app, user_id):
    with app.app_context():
        token = create_access_token(identity=str(user_id), additional_claims={'role': 'resident'})
    return {'Authorization': f'Bearer {token}'}


def test_verified_resident_default_feed_includes_home_and_shared_announcements():
    app, user_id, ids = build_app_with_announcements()
    client = app.test_client()

    resp = client.get('/api/announcements', headers=_resident_headers(app, user_id))
    assert resp.status_code == 200
    data = resp.get_json()
    returned_ids = [a['id'] for a in data.get('announcements', [])]

    assert ids['province'] in returned_ids
    assert ids['home_municipality'] in returned_ids
    assert ids['shared_to_home'] in returned_ids
    assert ids['shared_to_other'] in returned_ids
    assert ids['home_barangay'] in returned_ids
    assert ids['other_municipality'] not in returned_ids
    assert ids['third_municipality'] not in returned_ids
    assert ids['other_barangay'] not in returned_ids
    assert ids['shared_barangay'] not in returned_ids
    assert data.get('announcements', [])[0].get('pinned') is True


def test_verified_resident_browse_selected_municipality_includes_direct_and_shared_targets():
    app, user_id, ids = build_app_with_announcements()
    client = app.test_client()

    resp = client.get(
        '/api/announcements',
        headers=_resident_headers(app, user_id),
        query_string={'browse': 'true', 'municipality_id': ids['other_municipality_id']},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    returned_ids = {a['id'] for a in data.get('announcements', [])}

    assert ids['province'] in returned_ids
    assert ids['other_municipality'] in returned_ids
    assert ids['shared_to_home'] in returned_ids
    assert ids['shared_to_other'] in returned_ids
    assert ids['home_municipality'] not in returned_ids
    assert ids['home_barangay'] not in returned_ids
    assert ids['third_municipality'] not in returned_ids
    assert ids['other_barangay'] not in returned_ids
    assert ids['shared_barangay'] not in returned_ids


def test_verified_resident_browse_unrelated_municipality_excludes_unrelated_shared_announcements():
    app, user_id, ids = build_app_with_announcements()
    client = app.test_client()

    resp = client.get(
        '/api/announcements',
        headers=_resident_headers(app, user_id),
        query_string={'browse': 'true', 'municipality_id': ids['third_municipality_id']},
    )
    assert resp.status_code == 200
    data = resp.get_json()
    returned_ids = {a['id'] for a in data.get('announcements', [])}

    assert returned_ids == {ids['province'], ids['third_municipality']}


def test_verified_resident_can_open_shared_municipality_detail_from_home_scope():
    app, user_id, ids = build_app_with_announcements()
    client = app.test_client()

    resp = client.get(
        f"/api/announcements/{ids['shared_to_home']}",
        headers=_resident_headers(app, user_id),
    )
    assert resp.status_code == 200


def test_verified_resident_can_open_shared_municipality_detail_when_browsing_target_scope():
    app, user_id, ids = build_app_with_announcements()
    client = app.test_client()

    resp = client.get(
        f"/api/announcements/{ids['shared_to_other']}",
        headers=_resident_headers(app, user_id),
        query_string={'browse': 'true', 'municipality_id': ids['other_municipality_id']},
    )
    assert resp.status_code == 200


def test_verified_resident_can_open_other_barangay_detail_with_exact_browse_filters():
    app, user_id, ids = build_app_with_announcements()
    client = app.test_client()

    resp = client.get(
        f"/api/announcements/{ids['other_barangay']}",
        headers=_resident_headers(app, user_id),
        query_string={
            'browse': 'true',
            'municipality_id': ids['other_municipality_id'],
            'barangay_id': ids['other_barangay_id'],
        },
    )
    assert resp.status_code == 200


def test_guest_feed_stays_province_only_even_with_browse_params():
    app, _user_id, ids = build_app_with_announcements()
    client = app.test_client()

    default_resp = client.get('/api/announcements')
    assert default_resp.status_code == 200
    default_ids = [a['id'] for a in (default_resp.get_json() or {}).get('announcements', [])]
    assert default_ids == [ids['province']]

    browse_resp = client.get(
        '/api/announcements',
        query_string={'browse': 'true', 'municipality_id': ids['other_municipality_id']},
    )
    assert browse_resp.status_code == 200
    browse_ids = [a['id'] for a in (browse_resp.get_json() or {}).get('announcements', [])]
    assert browse_ids == [ids['province']]


def test_guests_cannot_open_municipality_or_barangay_details():
    app, _user_id, ids = build_app_with_announcements()
    client = app.test_client()

    muni_resp = client.get(f"/api/announcements/{ids['shared_to_home']}")
    assert muni_resp.status_code == 404

    barangay_resp = client.get(
        f"/api/announcements/{ids['other_barangay']}",
        query_string={
            'browse': 'true',
            'municipality_id': ids['other_municipality_id'],
            'barangay_id': ids['other_barangay_id'],
        },
    )
    assert barangay_resp.status_code == 404
