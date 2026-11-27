"""
Serve stored files to authorized callers without trusting the stored reference.

Stored references can be a local upload path, a Supabase storage path, or a full
URL. Remote URLs are fetched only from allowlisted hosts (the configured
Supabase host plus ``ALLOWED_FILE_DOMAINS``), redirects are never followed, and
responses are size-capped. Only PDFs and images are rendered inline; anything
else is sent as a download so it cannot run in the API origin.
"""
from __future__ import annotations

import mimetypes
import os
from io import BytesIO
from pathlib import Path
from urllib.parse import urlparse

import requests
from flask import current_app, send_file

MAX_REMOTE_FILE_BYTES = 25 * 1024 * 1024
REMOTE_TIMEOUT_SECONDS = 15
INLINE_MIME_TYPES = {
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
}


def allowed_remote_hosts() -> set[str]:
    """Hosts the API may fetch stored files from."""
    hosts = {
        str(domain).strip().lower()
        for domain in (current_app.config.get('ALLOWED_FILE_DOMAINS') or [])
        if str(domain).strip()
    }
    supabase_url = current_app.config.get('SUPABASE_URL') or os.getenv('SUPABASE_URL') or ''
    supabase_host = (urlparse(supabase_url).hostname or '').lower()
    if supabase_host:
        hosts.add(supabase_host)
    return hosts


def is_remote_url_allowed(url: str) -> bool:
    """True only for http(s) URLs whose host is explicitly allowlisted."""
    parsed = urlparse(str(url or ''))
    if parsed.scheme not in ('http', 'https'):
        return False
    if parsed.scheme == 'http' and not current_app.config.get('DEBUG'):
        return False
    host = (parsed.hostname or '').lower()
    return bool(host) and host in allowed_remote_hosts()


def fetch_remote_file(url: str) -> tuple[bytes, str]:
    """Download an allowlisted remote file. Raises PermissionError when refused."""
    if not is_remote_url_allowed(url):
        raise PermissionError("Untrusted file domain")

    with requests.get(url, timeout=REMOTE_TIMEOUT_SECONDS, allow_redirects=False, stream=True) as resp:
        if 300 <= resp.status_code < 400:
            raise PermissionError("Redirects are not followed for stored files")
        resp.raise_for_status()
        declared = resp.headers.get('Content-Length')
        if declared and declared.isdigit() and int(declared) > MAX_REMOTE_FILE_BYTES:
            raise PermissionError("Stored file is too large")
        chunks = []
        total = 0
        for chunk in resp.iter_content(chunk_size=64 * 1024):
            total += len(chunk)
            if total > MAX_REMOTE_FILE_BYTES:
                raise PermissionError("Stored file is too large")
            chunks.append(chunk)
        return b''.join(chunks), resp.headers.get('Content-Type') or ''


def _mime_type(content_type: str, download_name: str) -> str:
    declared = (content_type or '').split(';', 1)[0].strip().lower()
    if declared and declared != 'application/octet-stream':
        return declared
    return mimetypes.guess_type(download_name)[0] or 'application/octet-stream'


def send_file_bytes(data: bytes, content_type: str, download_name: str):
    """Send bytes inline only for safe document/image types."""
    mime = _mime_type(content_type, download_name)
    inline = mime in INLINE_MIME_TYPES
    return send_file(
        BytesIO(data),
        mimetype=mime if inline else 'application/octet-stream',
        as_attachment=not inline,
        download_name=download_name,
    )


def _local_upload_path(normalized: str) -> Path | None:
    upload_root = Path(current_app.config.get('UPLOAD_FOLDER') or 'uploads').resolve()
    candidate = (upload_root / normalized).resolve()
    try:
        candidate.relative_to(upload_root)
    except ValueError:
        raise PermissionError("Invalid file path")
    return candidate if candidate.is_file() else None


def stream_storage_file(file_ref: str, download_name: str = 'document'):
    """Stream a stored file by allowlisted URL, local upload path, or storage path."""
    if not file_ref:
        raise FileNotFoundError("Missing file reference")

    normalized = str(file_ref).strip().replace('\\', '/')
    if normalized.startswith(('http://', 'https://')):
        data, content_type = fetch_remote_file(normalized)
        return send_file_bytes(data, content_type, download_name)

    local_path = _local_upload_path(normalized.lstrip('/'))
    if local_path is not None:
        with open(local_path, 'rb') as handle:
            data = handle.read()
        return send_file_bytes(data, mimetypes.guess_type(str(local_path))[0] or '', download_name)

    # DB values may hold a storage path instead of a URL: sign it and fetch it.
    try:
        from apps.api.utils.supabase_storage import get_signed_url

        signed = get_signed_url(normalized, expires_in=300)
    except Exception:
        signed = None
    if signed:
        data, content_type = fetch_remote_file(signed)
        return send_file_bytes(data, content_type, download_name)

    raise FileNotFoundError("File not found")


def references_request_upload(file_ref: str, request_id: int) -> bool:
    """True when a stored reference points at this document request's own uploads.

    Uploads are stored as ``document_requests/<user_type>/<municipality>/request_<id>/<file>``
    (locally, as a Supabase storage path, or inside a Supabase URL).
    """
    raw = str(file_ref or '').strip().replace('\\', '/')
    path = urlparse(raw).path if raw.startswith(('http://', 'https://')) else raw
    segments = [segment for segment in path.split('/') if segment]
    if not segments or '..' in segments:
        return False
    try:
        start = segments.index('document_requests')
    except ValueError:
        return False
    return f"request_{int(request_id)}" in segments[start + 1:-1]
