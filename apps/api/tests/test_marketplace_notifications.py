from __future__ import annotations

from datetime import datetime, timedelta

from apps.api import db
from apps.api.app import create_app
from apps.api.config import Config
from apps.api.models.marketplace import Item, Transaction
from apps.api.models.municipality import Barangay, Municipality
from apps.api.models.notification import NotificationOutbox
from apps.api.models.province import Province
from apps.api.models.user import User
from apps.api.utils.notifications import queue_marketplace_pickup_details_ready


class MarketplaceNotificationTestConfig(Config):
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    JWT_SECRET_KEY = "test-secret"
    RATELIMIT_ENABLED = False


def _seed_marketplace_fixture():
    province = Province(id=6, name="Zambales", slug="zambales", psgc_code="037100000")
    muni = Municipality(id=112, name="Iba", slug="iba", province_id=province.id, psgc_code="037112000")
    brgy = Barangay(id=5001, name="Zone 1", slug="zone-1", municipality_id=muni.id, psgc_code="037112001")

    seller = User(
        username="seller_user",
        email="seller@example.com",
        password_hash="x",
        first_name="Seller",
        last_name="One",
        role="resident",
        municipality_id=muni.id,
        barangay_id=brgy.id,
        notify_email_enabled=True,
        notify_sms_enabled=True,
        mobile_number="09171234567",
    )
    buyer = User(
        username="buyer_user",
        email="buyer@example.com",
        password_hash="x",
        first_name="Buyer",
        last_name="One",
        role="resident",
        municipality_id=muni.id,
        barangay_id=brgy.id,
        notify_email_enabled=True,
        notify_sms_enabled=True,
        mobile_number="09179876543",
    )

    db.session.add_all([province, muni, brgy, seller, buyer])
    db.session.flush()

    item = Item(
        user_id=seller.id,
        title="Rice Cooker",
        description="Working unit",
        category="Home & Garden",
        condition="good",
        transaction_type="sell",
        municipality_id=muni.id,
        barangay_id=brgy.id,
        status="available",
        images=[],
    )
    db.session.add(item)
    db.session.flush()

    tx = Transaction(
        item_id=item.id,
        buyer_id=buyer.id,
        seller_id=seller.id,
        transaction_type="sell",
        status="awaiting_buyer",
        pickup_at=datetime.now() + timedelta(days=1),
        pickup_location="Municipal Hall Lobby",
    )
    db.session.add(tx)
    db.session.commit()

    return buyer, seller, item, tx


def test_pickup_ready_queues_notifications_for_buyer_and_seller():
    app = create_app(MarketplaceNotificationTestConfig)

    with app.app_context():
        db.create_all()
        buyer, seller, item, tx = _seed_marketplace_fixture()

        results = queue_marketplace_pickup_details_ready(buyer=buyer, seller=seller, tx=tx, item=item)
        db.session.commit()

        assert results["queued"] == 4
        rows = NotificationOutbox.query.filter_by(event_type="marketplace_pickup_ready").all()
        assert len(rows) == 4
        assert {r.channel for r in rows} == {"email", "sms"}
        assert {r.resident_id for r in rows} == {buyer.id, seller.id}

        # Same pickup details should dedupe and not add new rows.
        queue_marketplace_pickup_details_ready(buyer=buyer, seller=seller, tx=tx, item=item)
        db.session.commit()
        assert NotificationOutbox.query.filter_by(event_type="marketplace_pickup_ready").count() == 4

        # Updating pickup details should queue a new set.
        tx.pickup_location = "Barangay Hall Entrance"
        db.session.flush()
        queue_marketplace_pickup_details_ready(buyer=buyer, seller=seller, tx=tx, item=item)
        db.session.commit()
        assert NotificationOutbox.query.filter_by(event_type="marketplace_pickup_ready").count() == 8
