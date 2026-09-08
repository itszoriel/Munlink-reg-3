"""SMS provider availability tests."""

from flask import Flask

from apps.api.utils.sms_provider import get_provider_status, send_sms


def test_sms_maintenance_reports_unavailable_and_skips_delivery(monkeypatch):
    def fail_if_called(*_args, **_kwargs):
        raise AssertionError('Maintenance mode must not contact PhilSMS')

    monkeypatch.setattr('apps.api.utils.sms_provider.requests.post', fail_if_called)

    app = Flask(__name__)
    app.config.update(
        SMS_PROVIDER='philsms',
        SMS_MAINTENANCE_MODE=True,
        PHILSMS_API_KEY='demo-key',
    )

    with app.app_context():
        status = get_provider_status()
        result = send_sms(['639171234567'], 'Document request update')

    assert status == {
        'provider': 'philsms',
        'available': False,
        'reason': 'maintenance_no_credits',
        'credit_balance': 0,
        'status': 'maintenance',
    }
    assert result == {
        'status': 'skipped',
        'reason': 'maintenance_no_credits',
    }
