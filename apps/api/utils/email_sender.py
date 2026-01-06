"""Email sending utility for verification and notification emails.

Supports both:
- SMTP (for development with Gmail)
- SendGrid API (for production on Render free tier where SMTP is blocked)

The system automatically chooses:
- SendGrid if SENDGRID_API_KEY is configured
- SMTP if SMTP_SERVER is configured (fallback for development)
"""
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import requests
import json
from flask import current_app


def _send_via_smtp(to_email: str, subject: str, body: str) -> None:
    """Send email via SMTP (for development with Gmail)."""
    app = current_app
    smtp_server = app.config.get('SMTP_SERVER')
    smtp_port = app.config.get('SMTP_PORT', 587)
    smtp_username = app.config.get('SMTP_USERNAME')
    smtp_password = app.config.get('SMTP_PASSWORD')
    from_email = app.config.get('FROM_EMAIL') or smtp_username
    app_name = app.config.get('APP_NAME', 'MunLink Region III')
    
    if not smtp_server:
        raise RuntimeError("SMTP_SERVER is not configured")
    if not smtp_username or not smtp_password:
        raise RuntimeError("SMTP_USERNAME and SMTP_PASSWORD are required for SMTP")
    if not from_email:
        raise RuntimeError("FROM_EMAIL is not configured")
    
    current_app.logger.info(f"Attempting to send email to {to_email} via SMTP ({smtp_server}:{smtp_port})")
    
    try:
        # Create message
        msg = MIMEMultipart()
        msg['From'] = f"{app_name} <{from_email}>"
        msg['To'] = to_email
        msg['Subject'] = subject
        msg.attach(MIMEText(body, 'plain'))
        
        # Connect and send
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(from_email, to_email, msg.as_string())
        
        current_app.logger.info(f"Email sent successfully to {to_email} via SMTP")
    except smtplib.SMTPAuthenticationError as e:
        error_msg = f"SMTP authentication failed: {e}"
        current_app.logger.error(error_msg)
        raise RuntimeError(error_msg) from e
    except smtplib.SMTPException as e:
        error_msg = f"SMTP error: {e}"
        current_app.logger.error(error_msg)
        raise RuntimeError(error_msg) from e
    except Exception as e:
        error_msg = f"Failed to send email via SMTP: {e}"
        current_app.logger.error(error_msg)
        raise RuntimeError(error_msg) from e


def _send_via_sendgrid(to_email: str, subject: str, body: str) -> None:
    """Send email via SendGrid API (works on Render free tier)."""
    app = current_app
    api_key = app.config.get('SENDGRID_API_KEY')
    from_email = app.config.get('FROM_EMAIL')
    app_name = app.config.get('APP_NAME', 'MunLink Region III')
    
    if not api_key:
        raise RuntimeError("SENDGRID_API_KEY is not configured")
    
    if not from_email:
        raise RuntimeError("FROM_EMAIL is not configured")
    
    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": from_email, "name": app_name},
        "subject": subject,
        "content": [{"type": "text/plain", "value": body}]
    }
    
    current_app.logger.info(f"Attempting to send email to {to_email} via SendGrid API")
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)
        # SendGrid returns 202 Accepted on success
        if response.status_code not in [200, 201, 202]:
            error_msg = f"SendGrid API error: {response.status_code}"
            try:
                error_detail = response.json()
                error_msg += f" - {json.dumps(error_detail)}"
            except:
                error_msg += f" - {response.text[:200]}"
            current_app.logger.error(error_msg)
            raise RuntimeError(error_msg)
        current_app.logger.info(f"Email sent successfully to {to_email} via SendGrid")
    except requests.exceptions.RequestException as e:
        error_msg = f"SendGrid API request failed: {e}"
        current_app.logger.error(error_msg)
        raise RuntimeError(error_msg) from e


def _send_email(to_email: str, subject: str, body: str) -> None:
    """
    Send email using the best available method.
    
    Priority:
    1. SendGrid API (if SENDGRID_API_KEY is set) - preferred for production
    2. SMTP (if SMTP_SERVER is set) - for development with Gmail
    """
    app = current_app
    
    # Check for SendGrid first (production)
    if app.config.get('SENDGRID_API_KEY'):
        current_app.logger.debug("Using SendGrid for email delivery")
        _send_via_sendgrid(to_email, subject, body)
        return
    
    # Fall back to SMTP (development)
    if app.config.get('SMTP_SERVER'):
        current_app.logger.debug("Using SMTP for email delivery")
        _send_via_smtp(to_email, subject, body)
        return
    
    # No email provider configured
    raise RuntimeError(
        "No email provider configured. "
        "Set SENDGRID_API_KEY for production or SMTP_SERVER/SMTP_USERNAME/SMTP_PASSWORD for development."
    )


def send_verification_email(to_email: str, verify_link: str) -> None:
    """Send an email verification message with a verification link."""
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

    try:
        _send_email(to_email, subject, body)
    except Exception as exc:
        current_app.logger.exception("Failed to send verification email to %s: %s", to_email, exc)
        raise


def send_generic_email(to_email: str, subject: str, body: str) -> None:
    """Send a generic email, with fallback to logging if sending fails."""
    try:
        _send_email(to_email, subject, body)
    except Exception:
        try:
            current_app.logger.info("Email (fallback log): to=%s subject=%s body=%s", to_email, subject, body)
        except Exception:
            pass


def send_user_status_email(to_email: str, approved: bool, reason: str | None = None) -> None:
    """Send user registration status email."""
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
    """Send document request status email."""
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
