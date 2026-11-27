"""pg_cron shared secret can come from Vault; the scheduling script is guarded."""
from __future__ import annotations

import importlib.util
from pathlib import Path

import pytest
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from apps.api import db
from apps.api.app import create_app
from apps.api.config import Config
from apps.api.routes import internal
from apps.api.utils import notification_delivery

VAULT_VALUE = 'v' * 64
SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'schedule_db_cron.py'


class CronConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = False
    INTERNAL_CRON_SECRET = ''


@pytest.fixture
def client(monkeypatch):
    monkeypatch.setattr(notification_delivery, 'process_batch', lambda **kw: 2)
    app = create_app(CronConfig)
    with app.app_context():
        db.create_all()
    return app.test_client()


def test_vault_secret_authorizes_when_env_is_unset(client, monkeypatch):
    monkeypatch.setattr(internal, '_vault_secret', lambda: VAULT_VALUE)
    assert client.post('/internal/notifications/run', headers={'X-Cron-Secret': 'nope'}).status_code == 401
    ok = client.post('/internal/notifications/run', headers={'X-Cron-Secret': VAULT_VALUE})
    assert ok.status_code == 200 and ok.get_json() == {'processed': 2}


def test_disabled_without_env_or_vault(client, monkeypatch):
    monkeypatch.setattr(internal, '_vault_secret', lambda: '')
    assert client.post('/internal/notifications/run', headers={'X-Cron-Secret': ''}).status_code == 404


def test_sqlite_has_no_vault(client):
    internal._vault_cache.update(value='', expires=0.0)
    with client.application.app_context():
        assert internal._vault_secret() == ''


def _load_migration():
    spec = importlib.util.spec_from_file_location('schedule_db_cron', SCRIPT)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


@pytest.mark.parametrize('flag, base, expected', [
    ('', 'https://munlink-api-5s9w.onrender.com', None),            # not opted in (local dev)
    ('true', 'http://localhost:5000', None),                          # never repoint prod at localhost
    ('true', 'https://evil.example/x', None),                         # path or odd URLs rejected
    ('true', 'https://munlink-api-5s9w.onrender.com/', 'https://munlink-api-5s9w.onrender.com/internal/notifications/run'),
])
def test_setup_only_runs_on_the_api_service(monkeypatch, flag, base, expected):
    migration = _load_migration()
    monkeypatch.setenv('SCHEDULE_DB_CRON_JOBS', flag)
    monkeypatch.setenv('BASE_URL', base)
    assert migration._target_url() == expected


def test_setup_sql_has_no_bind_params_and_never_embeds_a_secret():
    migration = _load_migration()
    sql = migration.setup_sql('https://munlink-api-5s9w.onrender.com/internal/notifications/run')
    compiled = sa.text(sql).compile(dialect=postgresql.dialect())
    assert compiled.params == {}
    assert 'gen_random_uuid()' in sql and 'vault.create_secret' in sql
    assert "'{}'::jsonb" in sql


def test_setup_is_a_noop_without_postgres(monkeypatch, capsys):
    script = _load_migration()
    monkeypatch.setenv('SCHEDULE_DB_CRON_JOBS', 'true')
    monkeypatch.setenv('BASE_URL', 'https://munlink-api-5s9w.onrender.com')
    monkeypatch.setenv('DATABASE_URL', 'sqlite:///:memory:')
    assert script.main() == 0
    assert 'skipping' in capsys.readouterr().out
