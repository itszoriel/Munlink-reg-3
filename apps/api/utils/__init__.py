"""Utility functions for the API."""

try:
    from apps.api.utils.validators import (
        validate_email,
        validate_username,
        validate_password,
        validate_phone,
        validate_name,
        validate_date_of_birth,
        validate_municipality,
        validate_file_size,
        validate_file_extension,
        validate_required_fields,
        sanitize_string,
        validate_transaction_type,
        validate_item_condition,
        validate_price,
        ValidationError,
    )
except ImportError:
    from .validators import (
        validate_email,
        validate_username,
        validate_password,
        validate_phone,
        validate_name,
        validate_date_of_birth,
        validate_municipality,
        validate_file_size,
        validate_file_extension,
        validate_required_fields,
        sanitize_string,
        validate_transaction_type,
        validate_item_condition,
        validate_price,
        ValidationError,
    )

from apps.api.utils.auth import (
    get_current_user,
    admin_required,
    verified_resident_required,
    fully_verified_required,
    adult_required,
    check_token_blacklist,
    municipality_admin_required,
    check_user_access_level,
    generate_verification_token,
    verify_token_type,
)

# Storage handler - uses Supabase Storage in production, filesystem in development
from apps.api.utils.storage_handler import (
    save_file as save_uploaded_file,
    save_profile_picture,
    save_verification_document,
    save_marketplace_image,
    save_issue_attachment,
    save_benefit_document,
    save_document_request_file,
    get_file_url,
    is_legacy_path,
    is_file_missing,
    StorageError as FileUploadError,
)

# Keep backward compatibility with file_handler for cleanup functions
from apps.api.utils.file_handler import (
    delete_file,
    cleanup_user_files,
    cleanup_item_files,
)

from apps.api.utils.qr_generator import (
    generate_qr_code_data,
    generate_qr_code_image,
    generate_qr_code_bytes,
    generate_and_upload_qr_code,
    save_qr_code_file,
    validate_qr_data,
    regenerate_qr_code,
)

# Transaction audit helpers
try:
    from apps.api.utils.tx_audit import (
        log_tx_action,
        require_tx_role,
        assert_status,
        TransitionError,
    )
except ImportError:
    from .tx_audit import (
        log_tx_action,
        require_tx_role,
        assert_status,
        TransitionError,
    )

# Security utilities
try:
    from apps.api.utils.security import (
        safe_error_response,
        error_400,
        error_401,
        error_403,
        error_404,
        error_409,
        error_429,
        error_500,
        validate_file_mime_type,
        validate_image_file,
        validate_document_file,
        APIError,
        ALLOWED_IMAGE_MIMES,
        ALLOWED_DOCUMENT_MIMES,
    )
except ImportError:
    from .security import (
        safe_error_response,
        error_400,
        error_401,
        error_403,
        error_404,
        error_409,
        error_429,
        error_500,
        validate_file_mime_type,
        validate_image_file,
        validate_document_file,
        APIError,
        ALLOWED_IMAGE_MIMES,
        ALLOWED_DOCUMENT_MIMES,
    )

__all__ = [
    # Validators
    'validate_email',
    'validate_username',
    'validate_password',
    'validate_phone',
    'validate_name',
    'validate_date_of_birth',
    'validate_municipality',
    'validate_file_size',
    'validate_file_extension',
    'validate_required_fields',
    'sanitize_string',
    'validate_transaction_type',
    'validate_item_condition',
    'validate_price',
    'ValidationError',
    # Auth
    'get_current_user',
    'admin_required',
    'verified_resident_required',
    'fully_verified_required',
    'adult_required',
    'check_token_blacklist',
    'municipality_admin_required',
    'check_user_access_level',
    'generate_verification_token',
    'verify_token_type',
    # Storage Handler (Supabase in production, filesystem in dev)
    'save_uploaded_file',
    'save_profile_picture',
    'save_verification_document',
    'save_marketplace_image',
    'save_issue_attachment',
    'save_benefit_document',
    'save_document_request_file',
    'delete_file',
    'get_file_url',
    'cleanup_user_files',
    'cleanup_item_files',
    'FileUploadError',
    'is_legacy_path',
    'is_file_missing',
    # QR Generator
    'generate_qr_code_data',
    'generate_qr_code_image',
    'generate_qr_code_bytes',
    'generate_and_upload_qr_code',
    'save_qr_code_file',
    'validate_qr_data',
    'regenerate_qr_code',
    # Tx audit
    'log_tx_action',
    'require_tx_role',
    'assert_status',
    'TransitionError',
    # Security utilities
    'safe_error_response',
    'error_400',
    'error_401',
    'error_403',
    'error_404',
    'error_409',
    'error_429',
    'error_500',
    'validate_file_mime_type',
    'validate_image_file',
    'validate_document_file',
    'APIError',
    'ALLOWED_IMAGE_MIMES',
    'ALLOWED_DOCUMENT_MIMES',
]
