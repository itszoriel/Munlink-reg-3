"""Simple email sending utility for verification and notification emails.

Supports both SMTP (for local dev) and Resend API (for production on Render free tier).
"""
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from flask import current_app
import ssl
import requests
import json


def _send_via_resend(to_email: str, subject: str, body: str) -> None:
    """Send email via Resend API (works on Render free tier)."""
    app = current_app
    api_key = app.config.get('RESEND_API_KEY')
    from_email = app.config.get('FROM_EMAIL')
    app_name = app.config.get('APP_NAME', 'MunLink Region III')
    
    if not api_key:
        raise RuntimeError("RESEND_API_KEY is not configured")
    
    if not from_email:
        raise RuntimeError("FROM_EMAIL is not configured")
    
    url = "https://api.resend.com/emails"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "from": f"{app_name} <{from_email}>",
        "to": [to_email],
        "subject": subject,
        "text": body
    }
    
    current_app.logger.info(f"Attempting to send email to {to_email} via Resend API")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        current_app.logger.info(f"Email sent successfully to {to_email} via Resend")
    except requests.exceptions.RequestException as e:
        error_msg = f"Resend API error: {e}"
        if hasattr(e, 'response') and e.response is not None:
            try:
                error_detail = e.response.json()
                error_msg += f" - {json.dumps(error_detail)}"
            except:
                error_msg += f" - Status: {e.response.status_code}"
        current_app.logger.error(error_msg)
        raise RuntimeError(error_msg) from e


def _send_via_smtp(to_email: str, subject: str, body: str) -> None:
    """Send email via SMTP (for local development)."""
    app = current_app
    smtp_server = app.config.get('SMTP_SERVER')
    smtp_port = int(app.config.get('SMTP_PORT', 587))
    smtp_username = app.config.get('SMTP_USERNAME')
    smtp_password = app.config.get('SMTP_PASSWORD')
    from_email = app.config.get('FROM_EMAIL', smtp_username)
    app_name = app.config.get('APP_NAME', 'MunLink Region III')

    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = formataddr((app_name, from_email))
    msg['To'] = to_email

    if not smtp_server:
        raise RuntimeError("SMTP_SERVER is not configured")
    if not smtp_username:
        raise RuntimeError("SMTP_USERNAME is not configured")
    if not smtp_password:
        raise RuntimeError("SMTP_PASSWORD is not configured")
    
    current_app.logger.info(f"Attempting to send email to {to_email} via {smtp_server}:{smtp_port}")

    # Use SSL for 465, STARTTLS for others (e.g., 587)
    # Increased timeout from 10 to 30 seconds
    if smtp_port == 465:
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(smtp_server, smtp_port, context=context, timeout=30) as server:
            server.ehlo()
            server.login(smtp_username, smtp_password)
            server.sendmail(from_email, [to_email], msg.as_string())
    else:
        with smtplib.SMTP(smtp_server, smtp_port, timeout=30) as server:
            server.ehlo()
            try:
                server.starttls(context=ssl.create_default_context())
                server.ehlo()
            except Exception:
                # STARTTLS may be unsupported on some servers
                pass
            server.login(smtp_username, smtp_password)
            server.sendmail(from_email, [to_email], msg.as_string())
    current_app.logger.info(f"Email sent successfully to {to_email} via SMTP")


def send_verification_email(to_email: str, verify_link: str) -> None:
    """Send an email verification message with a verification link.

    Automatically uses Resend API if RESEND_API_KEY is configured, otherwise falls back to SMTP.
    """
    app = current_app
    app_name = app.config.get('APP_NAME', 'MunLink Region III')

    subject = f"Verify your email for {app_name}"
    body = (
        f"Hello,\n\n"
        f"Please verify your email to complete your registration to {app_name}.\n\n"
        f"Click the link below (valid for 24 hours):\n"
        f"{verify_link}\n\n"
        f"If you did not sign up, you can ignore this email.\n\n"
        f"Thank you,\n{app_name} Team"
    )

    # Auto-detect: Use Resend if API key is set, otherwise use SMTP
    try:
        if app.config.get('RESEND_API_KEY'):
            _send_via_resend(to_email, subject, body)
        else:
            _send_via_smtp(to_email, subject, body)
    except smtplib.SMTPAuthenticationError as exc:
        current_app.logger.error(f"SMTP Authentication failed: {exc}. Make sure you're using a Gmail App Password, not your regular password.")
        raise
    except smtplib.SMTPException as exc:
        current_app.logger.error(f"SMTP error sending to {to_email}: {exc}")
        raise
    except Exception as exc:
        current_app.logger.exception("Failed to send verification email to %s: %s", to_email, exc)
        raise


def send_generic_email(to_email: str, subject: str, body: str) -> None:
    """Send a generic email using Resend API if configured, otherwise SMTP, with fallback to logging."""
    app = current_app
    try:
        if app.config.get('RESEND_API_KEY'):
            _send_via_resend(to_email, subject, body)
        else:
            _send_via_smtp(to_email, subject, body)
    except Exception:
        try:
            current_app.logger.info("Email (fallback log): to=%s subject=%s body=%s", to_email, subject, body)
        except Exception:
            pass


def send_user_status_email(to_email: str, approved: bool, reason: str | None = None) -> None:
    app = current_app
    app_name = app.config.get('APP_NAME', 'MunLink Region III')
    if approved:
        subject = f"{app_name}: Registration Approved"
        body = (
            "Your registration has been approved.\n"
            "You can now log in to your account.\n"
        )
    else:
        subject = f"{app_name}: Registration Rejected"
        body = (
            "Your registration has been rejected.\n"
            f"Reason: {reason or 'Not specified.'}\n"
        )
    send_generic_email(to_email, subject, body)


def send_document_request_status_email(to_email: str, doc_name: str, requested_at: str, approved: bool, reason: str | None = None) -> None:
    app = current_app
    app_name = app.config.get('APP_NAME', 'MunLink Region III')
    if approved:
        subject = f"{app_name}: Document Request Approved"
        body = (
            f"Your document request has been approved.\n"
            f"Document: {doc_name}\n"
            f"Date of request: {requested_at}\n"
            "You can now log in to your account.\n"
        )
    else:
        subject = f"{app_name}: Document Request Rejected"
        body = (
            f"Your document request has been rejected.\n"
            f"Document: {doc_name}\n"
            f"Date of request: {requested_at}\n"
            f"Reason: {reason or 'Not specified.'}\n"
        )
    send_generic_email(to_email, subject, body)
