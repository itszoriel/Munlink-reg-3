"""Keep-alive health check and the pg_cron notification endpoint."""
from __future__ import annotations

import pytest

from apps.api import db
from apps.api.app import create_app
from apps.api.config import Config
from apps.api.utils import notification_delivery

SECRET = 'x' * 40


class AlwaysOnConfig(Config):
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {}
    TESTING = True
    SECRET_KEY = 'test-secret-key'
    JWT_SECRET_KEY = 'test-secret'
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URI = 'memory://'
    RATELIMIT_DEFAULT = '2 per minute'
    INTERNAL_CRON_SECRET = SECRET


@pytest.fixture
def client():
    app = create_app(AlwaysOnConfig)
    with app.app_context():
        db.create_all()
    return app.test_client()


def test_health_checks_are_minimal_and_never_rate_limited(client):
    for _ in range(5):
        response = client.get('/health/db')
        assert response.status_code == 200
        assert response.get_json() == {'status': 'ok'}
        assert client.get('/health').status_code == 200


def test_notification_run_requires_the_shared_secret(client, monkeypatch):
    calls = []
    monkeypatch.setattr(notification_delivery, 'process_batch', lambda **kw: calls.append(kw) or 3)

    assert client.post('/internal/notifications/run').status_code == 401
    assert client.post('/internal/notifications/run', headers={'X-Cron-Secret': 'wrong'}).status_code == 401
    ok = client.post('/internal/notifications/run', headers={'X-Cron-Secret': SECRET})
    assert ok.status_code == 200 and ok.get_json() == {'processed': 3}
    assert calls == [{'max_items': 100}]


def test_notification_run_is_disabled_without_a_secret():
    config = type('Cfg', (AlwaysOnConfig,), {'INTERNAL_CRON_SECRET': ''})
    app = create_app(config)
    response = app.test_client().post('/internal/notifications/run', headers={'X-Cron-Secret': ''})
    assert response.status_code == 404
