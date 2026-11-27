"""Location rows inserted without is_active must still be listed (Zambales only)."""
from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest
import sqlalchemy as sa
from alembic.migration import MigrationContext
from alembic.operations import Operations

from apps.api import db
from apps.api.app import create_app
from apps.api.config import Config

MIGRATION = (
    Path(__file__).resolve().parents[1]
    / 'migrations' / 'versions' / '20261127_location_is_active_defaults.py'
)


class LocationConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False


@pytest.fixture
def app():
    app = create_app(LocationConfig)
    with app.app_context():
        db.create_all()
        yield app


def _seed_without_is_active():
    # Mirrors the raw-SQL seed that left is_active NULL in production.
    db.session.execute(sa.text(
        "INSERT INTO provinces (id, name, slug, psgc_code, region_code, region_name) "
        "VALUES (6, 'Zambales', 'zambales', '037100000', '03', 'Central Luzon')"
    ))
    db.session.execute(sa.text(
        "INSERT INTO municipalities (id, name, slug, province_id, psgc_code) VALUES "
        "(108, 'Iba', 'iba', 6, '037105000'), "
        "(130, 'Olongapo City', 'olongapo-city', 6, '037107000')"
    ))
    db.session.commit()


def test_rows_seeded_without_is_active_are_listed(app):
    _seed_without_is_active()
    client = app.test_client()

    provinces = client.get('/api/provinces').get_json()
    assert [p['name'] for p in provinces['provinces']] == ['Zambales']

    municipalities = client.get('/api/municipalities?province_id=6').get_json()['municipalities']
    names = [m['name'] for m in municipalities]
    assert 'Iba' in names
    assert 'Olongapo City' not in names  # location guard still applies


def test_migration_backfills_null_and_keeps_explicit_false():
    spec = importlib.util.spec_from_file_location('location_active_migration', MIGRATION)
    migration = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(migration)

    engine = sa.create_engine('sqlite:///:memory:')
    with engine.begin() as conn:
        for table in migration.TABLES:
            conn.execute(sa.text(f"CREATE TABLE {table} (id INTEGER PRIMARY KEY, is_active BOOLEAN)"))
            conn.execute(sa.text(f"INSERT INTO {table} (id, is_active) VALUES (1, NULL), (2, 0), (3, 1)"))

        migration.op = Operations(MigrationContext.configure(conn))
        migration.upgrade()

        for table in migration.TABLES:
            rows = dict(conn.execute(sa.text(f"SELECT id, is_active FROM {table} ORDER BY id")).all())
            assert rows == {1: 1, 2: 0, 3: 1}
            conn.execute(sa.text(f"INSERT INTO {table} (id) VALUES (4)"))
            assert conn.execute(sa.text(f"SELECT is_active FROM {table} WHERE id = 4")).scalar() == 1
