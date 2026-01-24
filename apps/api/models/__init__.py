"""
MunLink Region 3 - Database Models
Import all models here for Flask-Migrate to detect them
"""
try:
    from apps.api import db
except ImportError:
    from __init__ import db

# Base model will be imported by other models
Base = db.Model

# Import all models to register them with SQLAlchemy
try:
    from apps.api.models.user import User
    from apps.api.models.province import Province
    from apps.api.models.municipality import Municipality, Barangay
    from apps.api.models.marketplace import Item, Transaction
    from apps.api.models.document import DocumentType, DocumentRequest
    from apps.api.models.issue import IssueCategory, Issue
    from apps.api.models.benefit import BenefitProgram, BenefitApplication
    from apps.api.models.token_blacklist import TokenBlacklist
    from apps.api.models.audit import AuditLog
    from apps.api.models.refresh_token import RefreshTokenFamily, RefreshToken
    from apps.api.models.notification import NotificationOutbox
    from apps.api.models.email_verification_code import EmailVerificationCode
    from apps.api.models.admin_audit_log import AdminAuditLog, AuditAction
except ImportError:
    from .user import User
    from .province import Province
    from .municipality import Municipality, Barangay
    from .marketplace import Item, Transaction
    from .document import DocumentType, DocumentRequest
    from .issue import IssueCategory, Issue
    from .benefit import BenefitProgram, BenefitApplication
    from .token_blacklist import TokenBlacklist
    from .audit import AuditLog
    from .refresh_token import RefreshTokenFamily, RefreshToken
    from .notification import NotificationOutbox
    from .email_verification_code import EmailVerificationCode
    from .admin_audit_log import AdminAuditLog, AuditAction

__all__ = [
    'User',
    'Province',
    'Municipality',
    'Barangay',
    'Item',
    'Transaction',
    'DocumentType',
    'DocumentRequest',
    'IssueCategory',
    'Issue',
    'BenefitProgram',
    'BenefitApplication',
    'TokenBlacklist',
    'AuditLog',
    'RefreshTokenFamily',
    'RefreshToken',
    'NotificationOutbox',
    'EmailVerificationCode',
    'AdminAuditLog',
    'AuditAction',
]
