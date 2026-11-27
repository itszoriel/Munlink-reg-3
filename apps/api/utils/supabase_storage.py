"""
Supabase Storage client utilities for MunLink Region 3.

This module provides a centralized interface for all file storage operations
using Supabase Storage REST API directly (no supabase package needed).

Features:
- Upload files directly to Supabase Storage via REST API
- Route sensitive categories (IDs, document requests, generated documents,
  benefit and special-status files, payment proofs, claim QRs) to the private
  bucket; only public-safe media gets a public URL
- Download objects server-side with the service key for authorized streaming
- Municipality-scoped storage paths
- MIME type validation
- File size limits

Usage:
    from apps.api.utils.supabase_storage import (
        upload_file,
        upload_bytes,
        get_public_url,
        delete_file,
        is_supabase_url,
        is_legacy_path,
    )
"""
from __future__ import annotations

from apps.api.utils.time import utc_now
import json
import os
import re
import uuid
import logging
from datetime import datetime
from urllib.parse import urlparse, unquote, quote
from io import BytesIO
from typing import Iterator, Optional, Tuple, Union, BinaryIO
from pathlib import Path

import requests
from flask import current_app
from werkzeug.utils import secure_filename

logger = logging.getLogger(__name__)

# Storage bucket name - configurable via env
STORAGE_BUCKET = os.getenv('SUPABASE_STORAGE_BUCKET', 'munlink-files')
DEFAULT_PRIVATE_BUCKET = 'munlinkprivate-files'

# Upload categories that hold personal or transactional records. They are
# stored in the private bucket, referenced in the database by storage path (never
# by URL), and served only through authorized API routes.
PRIVATE_CATEGORIES = frozenset({
    'verification',
    'document_requests',
    'generated_docs',
    'benefits',
    'claims',
    'qr_codes',
    'manual-payments',
    'special_status',
})

MAX_DOWNLOAD_BYTES = 25 * 1024 * 1024
STORAGE_TIMEOUT_SECONDS = 15

# MIME types
ALLOWED_IMAGE_MIMES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
}

ALLOWED_DOCUMENT_MIMES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
}


class SupabaseStorageError(Exception):
    """Custom exception for Supabase Storage operations."""
    pass


def _get_supabase_config() -> Tuple[str, str]:
    """Get Supabase URL and service key."""
    supabase_url = current_app.config.get('SUPABASE_URL') or os.getenv('SUPABASE_URL')
    supabase_key = (
        current_app.config.get('SUPABASE_SERVICE_KEY') or 
        os.getenv('SUPABASE_SERVICE_KEY') or
        current_app.config.get('SUPABASE_KEY') or 
        os.getenv('SUPABASE_KEY')
    )
    
    if not supabase_url or not supabase_key:
        raise SupabaseStorageError(
            "Supabase credentials not configured. "
            "Set SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables."
        )
    
    return supabase_url, supabase_key


def _get_storage_bucket(bucket_override: Optional[str] = None) -> str:
    """Get the storage bucket name (optionally overridden)."""
    if bucket_override:
        return bucket_override
    return current_app.config.get('SUPABASE_STORAGE_BUCKET') or os.getenv('SUPABASE_STORAGE_BUCKET') or STORAGE_BUCKET


def get_public_bucket() -> str:
    """Bucket for public-safe media (profile photos, listings, announcements)."""
    return _get_storage_bucket(None)


def get_private_bucket() -> str:
    """Bucket for sensitive records; never exposed through public URLs."""
    return (
        current_app.config.get('SUPABASE_PRIVATE_BUCKET')
        or os.getenv('SUPABASE_PRIVATE_BUCKET')
        or DEFAULT_PRIVATE_BUCKET
    )


def _path_segments(storage_path: str) -> list:
    return [segment for segment in str(storage_path or '').replace('\\', '/').split('/') if segment]


def path_category(storage_path: str) -> str:
    """First segment of a relative storage path ('' when there is none)."""
    segments = _path_segments(storage_path)
    return segments[0] if segments else ''


def is_private_category(category: Optional[str]) -> bool:
    return (category or '') in PRIVATE_CATEGORIES


def is_private_path(storage_path: str) -> bool:
    return is_private_category(path_category(storage_path))


def bucket_for_category(category: Optional[str]) -> str:
    return get_private_bucket() if is_private_category(category) else get_public_bucket()


def bucket_for_path(storage_path: str) -> str:
    return bucket_for_category(path_category(storage_path))


def is_supabase_configured() -> bool:
    try:
        _get_supabase_config()
        return True
    except SupabaseStorageError:
        return False


_URL_OBJECT_PREFIXES = ('public/', 'sign/', 'authenticated/')


def parse_storage_url(url: str, supabase_url: Optional[str] = None) -> Optional[Tuple[str, str]]:
    """Split a Storage URL on the configured Supabase project into (bucket, path).

    Returns None for URLs on any other host or outside the object API, so a
    foreign URL is never treated as one of our objects.
    """
    raw = str(url or '').strip()
    if not raw.startswith(('http://', 'https://')):
        return None
    if supabase_url is None:
        supabase_url = current_app.config.get('SUPABASE_URL') or os.getenv('SUPABASE_URL') or ''
    expected_host = (urlparse(supabase_url).hostname or '').lower()
    parsed = urlparse(raw)
    if not expected_host or (parsed.hostname or '').lower() != expected_host:
        return None

    path = unquote(parsed.path).lstrip('/')
    marker = 'storage/v1/object/'
    if not path.startswith(marker):
        return None
    path = path[len(marker):]
    for prefix in _URL_OBJECT_PREFIXES:
        if path.startswith(prefix):
            path = path[len(prefix):]
            break

    bucket, _, object_path = path.partition('/')
    segments = _path_segments(object_path)
    if not bucket or not segments or '..' in segments:
        return None
    return bucket, '/'.join(segments)


def _path_segment(value: str, fallback: str = 'general') -> str:
    """One storage path segment: letters, digits, dot, dash, underscore only."""
    cleaned = re.sub(r'[^A-Za-z0-9._-]+', '-', str(value or '')).strip('.-')
    return cleaned or fallback


def public_file_label(ref) -> str:
    """File name of a stored reference, safe to show to clients."""
    raw = str(ref or '').split('?', 1)[0].replace('\\', '/').rstrip('/')
    return raw.rsplit('/', 1)[-1] or 'document'


def redact_file_entries(entries):
    """Replace storage locations in a supporting-documents list with file names.

    Clients address these files by index through authorized download routes,
    so they only need a count, labels, and requirement names.
    """
    if isinstance(entries, str):
        try:
            entries = json.loads(entries)
        except ValueError:
            return []
    if not isinstance(entries, list):
        return entries
    redacted = []
    for entry in entries:
        if isinstance(entry, dict):
            item = dict(entry)
            for key in ('path', 'url', 'file'):
                if item.get(key):
                    item[key] = public_file_label(item[key])
            redacted.append(item)
        elif entry:
            redacted.append(public_file_label(entry))
    return redacted


def _safe_object_path(storage_path: str) -> str:
    segments = _path_segments(storage_path)
    if not segments or '..' in segments:
        raise PermissionError('Invalid storage path')
    return '/'.join(segments)


def _normalize_storage_path(storage_path: str, bucket: str) -> str:
    """Normalize a storage path (strip bucket or public URLs if provided)."""
    if not storage_path:
        return storage_path
    path = storage_path.strip()
    if path.startswith('http://') or path.startswith('https://'):
        path = urlparse(path).path
    path = unquote(path)
    path = path.lstrip('/')

    # Strip known storage prefixes
    for prefix in (
        'storage/v1/object/public/',
        'storage/v1/object/sign/',
        'storage/v1/object/',
        'object/public/',
        'object/sign/',
        'object/',
    ):
        if path.startswith(prefix):
            path = path[len(prefix):]
            break

    # Remove bucket prefix if present
    if path.startswith(f"{bucket}/"):
        path = path[len(bucket) + 1:]

    return path


def _get_headers(service_key: str, content_type: Optional[str] = None) -> dict:
    """Get headers for Supabase REST API requests."""
    headers = {
        'Authorization': f'Bearer {service_key}',
        'apikey': service_key,
    }
    if content_type:
        headers['Content-Type'] = content_type
    return headers


def generate_unique_filename(original_filename: str, prefix: str = '') -> str:
    """
    Generate a unique filename while preserving extension.
    
    Args:
        original_filename: Original file name
        prefix: Optional prefix for the filename
    
    Returns:
        Unique filename string
    """
    # Get file extension
    _, ext = os.path.splitext(original_filename)
    ext = ext.lower()
    
    # Generate unique name with timestamp and UUID
    timestamp = utc_now().strftime('%Y%m%d_%H%M%S')
    unique_id = str(uuid.uuid4())[:8]
    
    if prefix:
        return f"{prefix}_{timestamp}_{unique_id}{ext}"
    return f"{timestamp}_{unique_id}{ext}"


def build_storage_path(
    category: str,
    municipality_slug: str,
    subcategory: Optional[str] = None,
    filename: Optional[str] = None,
    user_type: str = 'residents'
) -> str:
    """
    Build a structured storage path for municipality-scoped files.
    
    Structure: {category}/{user_type}/{municipality_slug}/{subcategory}/{filename}
    
    Args:
        category: Category of upload (profiles, marketplace, issues, etc.)
        municipality_slug: Municipality slug for scoping
        subcategory: Optional subcategory (e.g., user_123, item_456)
        filename: Optional filename to append
        user_type: Type of user (residents, admins)
    
    Returns:
        Storage path string
    """
    parts = [_path_segment(category), _path_segment(user_type), _path_segment(municipality_slug)]
    
    if subcategory:
        parts.extend(_path_segment(part) for part in str(subcategory).split('/') if part)
    
    if filename:
        parts.append(_path_segment(filename))
    
    return '/'.join(parts)


def upload_file(
    file: BinaryIO,
    category: str,
    municipality_slug: str,
    original_filename: str,
    subcategory: Optional[str] = None,
    user_type: str = 'residents',
    content_type: Optional[str] = None,
    max_size_mb: int = 10,
    bucket: Optional[str] = None,
    public: bool = True,
) -> Tuple[str, Optional[str]]:
    """
    Upload a file to Supabase Storage using REST API.
    
    Args:
        file: File-like object (BytesIO, FileStorage, etc.)
        category: Category of upload (profiles, marketplace, etc.)
        municipality_slug: Municipality slug for scoping
        original_filename: Original filename for extension extraction
        subcategory: Optional subcategory
        user_type: Type of user (residents, admins)
        content_type: MIME type (auto-detected if not provided)
        max_size_mb: Maximum file size in MB
    
    Returns:
        Tuple of (storage_path, public_url). public_url is None for objects in
        the private bucket (chosen automatically for PRIVATE_CATEGORIES).

    Raises:
        SupabaseStorageError: If upload fails
    """
    try:
        # Ensure file pointer is at start
        file.seek(0)
        
        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)
        
        max_size_bytes = max_size_mb * 1024 * 1024
        if file_size > max_size_bytes:
            raise SupabaseStorageError(f"File size exceeds {max_size_mb}MB limit")
        
        # Read file content
        content = file.read()
        file.seek(0)
        
        # Generate unique filename
        safe_filename = secure_filename(original_filename)
        unique_filename = generate_unique_filename(safe_filename)
        
        # Build storage path
        storage_path = build_storage_path(
            category=category,
            municipality_slug=municipality_slug,
            subcategory=subcategory,
            filename=unique_filename,
            user_type=user_type
        )
        
        # Get Supabase config
        supabase_url, service_key = _get_supabase_config()
        bucket = bucket or bucket_for_category(category)
        is_private_bucket = bucket == get_private_bucket()

        # Determine content type
        if not content_type:
            # Try to guess from extension
            ext = os.path.splitext(original_filename)[1].lower()
            content_type_map = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            }
            content_type = content_type_map.get(ext, 'application/octet-stream')
        
        # Upload via REST API
        upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{storage_path}"
        headers = {
            'Authorization': f'Bearer {service_key}',
            'apikey': service_key,
            'Content-Type': content_type,
        }
        
        response = requests.post(upload_url, headers=headers, data=content, timeout=STORAGE_TIMEOUT_SECONDS)

        if response.status_code not in (200, 201):
            raise SupabaseStorageError(f"Upload failed: {response.status_code} - {response.text}")

        # Public URL only for public-safe media; private objects are referenced by path.
        public_url = None
        if public and not is_private_bucket:
            public_url = f"{supabase_url}/storage/v1/object/public/{bucket}/{storage_path}"
        
        logger.info(f"File uploaded to Supabase Storage: {storage_path}")
        
        return storage_path, public_url
    
    except SupabaseStorageError:
        raise
    except Exception as e:
        logger.error(f"Supabase Storage upload failed: {e}")
        raise SupabaseStorageError(f"Upload failed: {e}")


def upload_file_to_path(
    file: BinaryIO,
    storage_path: str,
    content_type: Optional[str] = None,
    max_size_mb: int = 10,
    bucket: Optional[str] = None,
    upsert: bool = False,
) -> str:
    """
    Upload a file to a specific storage path (no auto path building).

    The bucket defaults to the one the path's category belongs to.

    Returns:
        storage_path
    """
    try:
        if not storage_path:
            raise SupabaseStorageError("Storage path is required")

        # Ensure file pointer is at start
        file.seek(0)

        # Check file size
        file.seek(0, os.SEEK_END)
        file_size = file.tell()
        file.seek(0)

        max_size_bytes = max_size_mb * 1024 * 1024
        if file_size > max_size_bytes:
            raise SupabaseStorageError(f"File size exceeds {max_size_mb}MB limit")

        # Read file content
        content = file.read()
        file.seek(0)

        # Determine content type
        if not content_type:
            # Try to guess from extension
            ext = os.path.splitext(storage_path)[1].lower()
            content_type_map = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.pdf': 'application/pdf',
                '.doc': 'application/msword',
                '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            }
            content_type = content_type_map.get(ext, 'application/octet-stream')

        # Get Supabase config
        supabase_url, service_key = _get_supabase_config()
        storage_path = _safe_object_path(storage_path)
        bucket = bucket or bucket_for_path(storage_path)

        # Upload via REST API
        upload_url = f"{supabase_url}/storage/v1/object/{bucket}/{quote(storage_path, safe='/')}"
        headers = {
            'Authorization': f'Bearer {service_key}',
            'apikey': service_key,
            'Content-Type': content_type,
        }
        if upsert:
            headers['x-upsert'] = 'true'

        response = requests.post(upload_url, headers=headers, data=content, timeout=STORAGE_TIMEOUT_SECONDS)

        if response.status_code not in (200, 201):
            raise SupabaseStorageError(f"Upload failed: {response.status_code} - {response.text}")

        logger.info(f"File uploaded to Supabase Storage: {storage_path}")
        return storage_path

    except SupabaseStorageError:
        raise
    except Exception as e:
        logger.error(f"Supabase Storage upload failed: {e}")
        raise SupabaseStorageError(f"Upload failed: {e}")


def upload_bytes(
    data: bytes,
    category: str,
    municipality_slug: str,
    filename: str,
    subcategory: Optional[str] = None,
    user_type: str = 'residents',
    content_type: str = 'application/octet-stream',
    bucket: Optional[str] = None,
    public: bool = True,
) -> Tuple[str, Optional[str]]:
    """
    Upload raw bytes to Supabase Storage.
    
    Args:
        data: Raw bytes to upload
        category: Category of upload
        municipality_slug: Municipality slug for scoping
        filename: Filename with extension
        subcategory: Optional subcategory
        user_type: Type of user
        content_type: MIME type
    
    Returns:
        Tuple of (storage_path, public_url)
    """
    file_obj = BytesIO(data)
    return upload_file(
        file=file_obj,
        category=category,
        municipality_slug=municipality_slug,
        original_filename=filename,
        subcategory=subcategory,
        user_type=user_type,
        content_type=content_type,
        bucket=bucket,
        public=public,
    )


def get_public_url(storage_path: str, bucket: Optional[str] = None) -> str:
    """
    Get the public URL for a file in Supabase Storage.
    
    Args:
        storage_path: Path to file in storage bucket
    
    Returns:
        Public URL string
    """
    try:
        supabase_url, _ = _get_supabase_config()
        bucket = _get_storage_bucket(bucket)
        storage_path = _normalize_storage_path(storage_path, bucket)
        return f"{supabase_url}/storage/v1/object/public/{bucket}/{storage_path}"
    except Exception as e:
        logger.error(f"Failed to get public URL: {e}")
        raise SupabaseStorageError(f"Failed to get public URL: {e}")


def get_signed_url(storage_path: str, expires_in: int = 3600, bucket: Optional[str] = None) -> str:
    """
    Get a signed (temporary) URL for a file in Supabase Storage.
    
    Args:
        storage_path: Path to file in storage bucket
        expires_in: URL expiration time in seconds (default: 1 hour)
    
    Returns:
        Signed URL string
    """
    try:
        supabase_url, service_key = _get_supabase_config()
        bucket = _get_storage_bucket(bucket)
        storage_path = _normalize_storage_path(storage_path, bucket)
        
        url = f"{supabase_url}/storage/v1/object/sign/{bucket}/{storage_path}"
        headers = _get_headers(service_key, 'application/json')
        payload = {'expiresIn': expires_in}
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 200:
            data = response.json()
            signed_url = data.get('signedURL') or data.get('signedUrl', '')
            if signed_url:
                if signed_url.startswith('http://') or signed_url.startswith('https://'):
                    return signed_url
                # Supabase sometimes returns /object/sign/...; normalize to /storage/v1/object/sign/...
                if signed_url.startswith('/storage/'):
                    return f"{supabase_url}{signed_url}"
                if signed_url.startswith('/object/'):
                    return f"{supabase_url}/storage/v1{signed_url}"
                if signed_url.startswith('storage/'):
                    return f"{supabase_url}/{signed_url}"
                if signed_url.startswith('object/'):
                    return f"{supabase_url}/storage/v1/{signed_url}"
                return f"{supabase_url}/{signed_url.lstrip('/')}"
        
        raise SupabaseStorageError(f"Failed to create signed URL: {response.text}")
    except SupabaseStorageError:
        raise
    except Exception as e:
        logger.error(f"Failed to get signed URL: {e}")
        raise SupabaseStorageError(f"Failed to get signed URL: {e}")


def delete_file(storage_path: str, bucket: Optional[str] = None) -> bool:
    """
    Delete a file from Supabase Storage.

    Accepts a storage path or a Storage URL on the configured project. The
    bucket defaults to the URL's bucket, else the path category's bucket.
    Deleting an object that is already gone counts as success.

    Returns:
        True if the object no longer exists
    """
    try:
        supabase_url, service_key = _get_supabase_config()
        located = parse_storage_url(storage_path, supabase_url)
        if located is not None:
            url_bucket, path = located
            bucket = bucket or url_bucket
        else:
            path = _safe_object_path(storage_path)
            bucket = bucket or bucket_for_path(path)

        # Bulk-remove endpoint: idempotent, returns the objects it removed.
        response = requests.delete(
            f"{supabase_url}/storage/v1/object/{bucket}",
            headers=_get_headers(service_key, 'application/json'),
            json={'prefixes': [path]},
            timeout=STORAGE_TIMEOUT_SECONDS,
        )

        if response.status_code in (200, 204):
            logger.info("File deleted from Supabase Storage: %s/%s", bucket, path)
            return True
        logger.warning("Delete returned %s for %s/%s", response.status_code, bucket, path)
        return False
    except Exception as e:
        logger.error(f"Failed to delete file: {e}")
        return False


def download_file(storage_path: str, bucket: Optional[str] = None) -> Tuple[bytes, str]:
    """
    Download an object with the service key (works for private buckets).

    Returns:
        (content bytes, content type)

    Raises:
        FileNotFoundError: the object (or bucket) does not exist
        PermissionError: invalid path, or object larger than MAX_DOWNLOAD_BYTES
        requests.RequestException: storage unavailable or unexpected response
    """
    supabase_url, service_key = _get_supabase_config()
    path = _safe_object_path(storage_path)
    bucket = bucket or bucket_for_path(path)
    url = f"{supabase_url}/storage/v1/object/{bucket}/{quote(path, safe='/')}"

    with requests.get(
        url,
        headers=_get_headers(service_key),
        timeout=STORAGE_TIMEOUT_SECONDS,
        allow_redirects=False,
        stream=True,
    ) as response:
        # Supabase reports a missing object as 400 or 404 depending on version.
        if response.status_code in (400, 404):
            raise FileNotFoundError(f"Object not found in {bucket}")
        if response.status_code != 200:
            raise requests.HTTPError(
                f"Storage download failed with status {response.status_code}",
                response=response,
            )
        declared = response.headers.get('Content-Length')
        if declared and declared.isdigit() and int(declared) > MAX_DOWNLOAD_BYTES:
            raise PermissionError('Stored file is too large')
        chunks = []
        total = 0
        for chunk in response.iter_content(chunk_size=64 * 1024):
            total += len(chunk)
            if total > MAX_DOWNLOAD_BYTES:
                raise PermissionError('Stored file is too large')
            chunks.append(chunk)
        return b''.join(chunks), response.headers.get('Content-Type') or ''


def list_files(prefix: str, bucket: Optional[str] = None, page_size: int = 1000) -> Iterator[dict]:
    """
    Recursively list objects under a prefix.

    Yields dicts with ``path``, ``size``, ``created_at`` and ``updated_at``.
    """
    supabase_url, service_key = _get_supabase_config()
    bucket = _get_storage_bucket(bucket)
    url = f"{supabase_url}/storage/v1/object/list/{bucket}"
    headers = _get_headers(service_key, 'application/json')

    pending = [str(prefix or '').strip('/')]
    while pending:
        folder = pending.pop()
        offset = 0
        while True:
            response = requests.post(
                url,
                headers=headers,
                json={
                    'prefix': folder,
                    'limit': page_size,
                    'offset': offset,
                    'sortBy': {'column': 'name', 'order': 'asc'},
                },
                timeout=STORAGE_TIMEOUT_SECONDS,
            )
            if response.status_code != 200:
                raise SupabaseStorageError(
                    f"List failed for {bucket}/{folder}: {response.status_code}"
                )
            entries = response.json() or []
            for entry in entries:
                name = entry.get('name')
                if not name:
                    continue
                full_path = f"{folder}/{name}" if folder else name
                if entry.get('id') is None:
                    pending.append(full_path)  # folder placeholder
                    continue
                metadata = entry.get('metadata') or {}
                yield {
                    'path': full_path,
                    'size': metadata.get('size'),
                    'created_at': entry.get('created_at'),
                    'updated_at': entry.get('updated_at'),
                }
            if len(entries) < page_size:
                break
            offset += page_size


def file_exists(storage_path: str, bucket: Optional[str] = None) -> bool:
    """
    Check if a file exists in Supabase Storage (private buckets included).

    Args:
        storage_path: Path to file in storage bucket

    Returns:
        True if file exists
    """
    try:
        supabase_url, service_key = _get_supabase_config()
        path = _safe_object_path(storage_path)
        bucket = bucket or bucket_for_path(path)
        folder, _, name = path.rpartition('/')
        response = requests.post(
            f"{supabase_url}/storage/v1/object/list/{bucket}",
            headers=_get_headers(service_key, 'application/json'),
            json={'prefix': folder, 'search': name, 'limit': 100, 'offset': 0},
            timeout=STORAGE_TIMEOUT_SECONDS,
        )
        if response.status_code != 200:
            return False
        return any(
            entry.get('name') == name and entry.get('id')
            for entry in (response.json() or [])
        )
    except Exception:
        return False


def is_supabase_url(url: str) -> bool:
    """
    Check if a URL is a Supabase Storage URL.
    
    Args:
        url: URL string to check
    
    Returns:
        True if URL is from Supabase Storage
    """
    if not url:
        return False
    return 'supabase' in url.lower() and '/storage/' in url.lower()


def is_legacy_path(path: str) -> bool:
    """
    Check if a path is a legacy filesystem path (not Supabase).
    
    Args:
        path: Path string to check
    
    Returns:
        True if path is a legacy filesystem path
    """
    if not path:
        return False
    
    # Check for common legacy patterns
    legacy_patterns = [
        '/uploads/',
        'uploads/',
        '\\uploads\\',
        '/region3/',
        'region3/',
    ]
    
    # If it's already a Supabase URL, it's not legacy
    if is_supabase_url(path):
        return False
    
    # If it starts with http(s) but not Supabase, it might be another external URL
    if path.startswith(('http://', 'https://')):
        return False
    
    # Check for legacy patterns
    for pattern in legacy_patterns:
        if pattern in path.lower():
            return True
    
    # If it looks like a relative path without http, it's likely legacy
    if not path.startswith(('http://', 'https://')):
        return True
    
    return False


def get_supabase_base_url(bucket: Optional[str] = None) -> str:
    """Get the base URL for Supabase storage."""
    supabase_url = current_app.config.get('SUPABASE_URL') or os.getenv('SUPABASE_URL', '')
    bucket = _get_storage_bucket(bucket)
    return f"{supabase_url}/storage/v1/object/public/{bucket}"


# Convenience functions for specific file types

def upload_profile_picture(
    file: BinaryIO,
    user_id: int,
    municipality_slug: str,
    original_filename: str,
    user_type: str = 'residents'
) -> Tuple[str, str]:
    """Upload a user profile picture."""
    return upload_file(
        file=file,
        category='profiles',
        municipality_slug=municipality_slug,
        original_filename=original_filename,
        subcategory=f"user_{user_id}",
        user_type=user_type,
        content_type='image/jpeg',  # Most profile pics are JPEG
        max_size_mb=5
    )


def upload_verification_document(
    file: BinaryIO,
    user_id: int,
    municipality_slug: str,
    original_filename: str,
    doc_type: str,
    user_type: str = 'residents'
) -> Tuple[str, str]:
    """Upload a verification document (ID, selfie, etc.)."""
    allowed_doc_types = {'valid_id_front', 'valid_id_back', 'selfie_with_id'}
    if doc_type not in allowed_doc_types:
        raise SupabaseStorageError('Unsupported verification document type')
    
    return upload_file(
        file=file,
        category='verification',
        municipality_slug=municipality_slug,
        original_filename=original_filename,
        subcategory=f"user_{user_id}/{doc_type}",
        user_type=user_type,
        max_size_mb=5
    )


def upload_marketplace_image(
    file: BinaryIO,
    item_id: int,
    municipality_slug: str,
    original_filename: str
) -> Tuple[str, str]:
    """Upload a marketplace item image."""
    return upload_file(
        file=file,
        category='marketplace',
        municipality_slug=municipality_slug,
        original_filename=original_filename,
        subcategory=f"item_{item_id}",
        user_type='residents',
        max_size_mb=5
    )


def upload_issue_attachment(
    file: BinaryIO,
    issue_id: int,
    municipality_slug: str,
    original_filename: str
) -> Tuple[str, str]:
    """Upload an issue report attachment."""
    return upload_file(
        file=file,
        category='issues',
        municipality_slug=municipality_slug,
        original_filename=original_filename,
        subcategory=f"issue_{issue_id}",
        user_type='residents',
        max_size_mb=10
    )


def upload_announcement_image(
    file: BinaryIO,
    announcement_id: int,
    municipality_slug: str,
    original_filename: str
) -> Tuple[str, str]:
    """Upload an announcement image."""
    return upload_file(
        file=file,
        category='announcements',
        municipality_slug=municipality_slug,
        original_filename=original_filename,
        subcategory=f"announcement_{announcement_id}",
        user_type='admins',
        max_size_mb=5
    )


def upload_benefit_document(
    file: BinaryIO,
    application_id: int,
    municipality_slug: str,
    original_filename: str
) -> Tuple[str, str]:
    """Upload a benefit application document."""
    return upload_file(
        file=file,
        category='benefits',
        municipality_slug=municipality_slug,
        original_filename=original_filename,
        subcategory=f"application_{application_id}",
        user_type='residents',
        max_size_mb=10
    )


def upload_benefit_program_image(
    file: BinaryIO,
    program_id: int,
    municipality_slug: str,
    original_filename: str
) -> Tuple[str, str]:
    """Upload a benefit program image."""
    return upload_file(
        file=file,
        category='benefit_programs',
        municipality_slug=municipality_slug,
        original_filename=original_filename,
        subcategory=f"program_{program_id}",
        user_type='admins',
        max_size_mb=5
    )


def upload_qr_code(
    qr_image_bytes: bytes,
    request_id: int,
    municipality_slug: str
) -> Tuple[str, str]:
    """Upload a generated QR code image."""
    filename = f"qr_{request_id}.png"
    return upload_bytes(
        data=qr_image_bytes,
        category='qr_codes',
        municipality_slug=municipality_slug,
        filename=filename,
        subcategory=None,
        user_type='system',
        content_type='image/png'
    )


def upload_generated_document(
    pdf_bytes: bytes,
    request_id: int,
    municipality_slug: str
) -> Tuple[str, str]:
    """Upload a generated document PDF."""
    filename = f"doc_{request_id}.pdf"
    return upload_bytes(
        data=pdf_bytes,
        category='generated_docs',
        municipality_slug=municipality_slug,
        filename=filename,
        subcategory=None,
        user_type='system',
        content_type='application/pdf'
    )


def upload_document_request_file(
    file: BinaryIO,
    request_id: int,
    municipality_slug: str,
    original_filename: str
) -> Tuple[str, str]:
    """Upload a document request supporting file."""
    return upload_file(
        file=file,
        category='document_requests',
        municipality_slug=municipality_slug,
        original_filename=original_filename,
        subcategory=f"request_{request_id}",
        user_type='residents',
        max_size_mb=10
    )
