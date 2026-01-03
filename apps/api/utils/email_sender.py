"""Simple email sending utility for verification and notification emails.

Adds generic helpers with SMTP-if-configured behavior and logger fallback.
"""
import smtplib
from email.mime.text import MIMEText
from email.utils import formataddr
from flask import current_app
import ssl


def send_verification_email(to_email: str, verify_link: str) -> None:
    """Send an email verification message with a verification link.

    Uses SMTP settings from Flask app config.
    """
    app = current_app
    smtp_server = app.config.get('SMTP_SERVER')
    smtp_port = int(app.config.get('SMTP_PORT', 587))
    smtp_username = app.config.get('SMTP_USERNAME')
    smtp_password = app.config.get('SMTP_PASSWORD')
    from_email = app.config.get('FROM_EMAIL', smtp_username)
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

    msg = MIMEText(body, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = formataddr((app_name, from_email))
    msg['To'] = to_email

    # Best effort send; raise with detailed logs so caller can surface in DEBUG
    try:
        if not smtp_server:
            current_app.logger.error("Email send failed: SMTP_SERVER is not configured")
            raise RuntimeError("SMTP_SERVER is not configured")
        if not smtp_username:
            current_app.logger.error("Email send failed: SMTP_USERNAME is not configured")
            raise RuntimeError("SMTP_USERNAME is not configured")
        if not smtp_password:
            current_app.logger.error("Email send failed: SMTP_PASSWORD is not configured")
            raise RuntimeError("SMTP_PASSWORD is not configured")
        
        current_app.logger.info(f"Attempting to send email to {to_email} via {smtp_server}:{smtp_port}")

        # Use SSL for 465, STARTTLS for others (e.g., 587)
        if smtp_port == 465:
            context = ssl.create_default_context()
            with smtplib.SMTP_SSL(smtp_server, smtp_port, context=context, timeout=10) as server:
                server.ehlo()
                server.login(smtp_username, smtp_password)
                server.sendmail(from_email, [to_email], msg.as_string())
        else:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.ehlo()
                try:
                    server.starttls(context=ssl.create_default_context())
                    server.ehlo()
                except Exception:
                    # STARTTLS may be unsupported on some servers
                    pass
                server.login(smtp_username, smtp_password)
                server.sendmail(from_email, [to_email], msg.as_string())
        current_app.logger.info(f"Email sent successfully to {to_email}")
    except smtplib.SMTPAuthenticationError as exc:
        current_app.logger.error(f"SMTP Authentication failed for {smtp_username}: {exc}. Make sure you're using a Gmail App Password, not your regular password.")
        raise
    except smtplib.SMTPException as exc:
        current_app.logger.error(f"SMTP error sending to {to_email}: {exc}")
        raise
    except Exception as exc:
        current_app.logger.exception("Failed to send verification email to %s: %s", to_email, exc)
        raise


def send_generic_email(to_email: str, subject: str, body: str) -> None:
    """Send a generic email using SMTP config if available; fallback to logging."""
    app = current_app
    try:
        smtp_server = app.config.get('SMTP_SERVER')
        smtp_port = int(app.config.get('SMTP_PORT', 587))
        smtp_username = app.config.get('SMTP_USERNAME')
        smtp_password = app.config.get('SMTP_PASSWORD')
        from_email = app.config.get('FROM_EMAIL', smtp_username or 'noreply@example.com')
        app_name = app.config.get('APP_NAME', 'MunLink Region III')

        msg = MIMEText(body, 'plain', 'utf-8')
        msg['Subject'] = subject
        msg['From'] = formataddr((app_name, from_email))
        msg['To'] = to_email

        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.ehlo()
            try:
                server.starttls()
                server.ehlo()
            except Exception:
                pass
            if smtp_username and smtp_password:
                try:
                    server.login(smtp_username, smtp_password)
                except Exception:
                    pass
            server.sendmail(from_email, [to_email], msg.as_string())
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


