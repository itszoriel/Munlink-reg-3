"""
Shared database environment configuration for MunLink maintenance scripts.

Credentials are never stored in this file. Set them in your shell or in a
git-ignored ``.env`` file (repo root or ``apps/api``) before running a script:

    DEV_DATABASE_URL          PROD_DATABASE_URL
    DEV_SUPABASE_URL          PROD_SUPABASE_URL
    DEV_SUPABASE_ANON_KEY     PROD_SUPABASE_ANON_KEY
    DEV_SUPABASE_SERVICE_KEY  PROD_SUPABASE_SERVICE_KEY

Usage:
    from db_environments import ENVIRONMENTS, get_database_url, get_supabase_client

    dev_url = get_database_url('dev')
    prod_client = get_supabase_client('prod')
"""
from __future__ import annotations

import os
from pathlib import Path
from typing import Dict
from urllib.parse import urlparse

try:
    from dotenv import load_dotenv

    _API_DIR = Path(__file__).resolve().parent.parent
    for _env_file in (_API_DIR.parent.parent / '.env', _API_DIR / '.env'):
        if _env_file.exists():
            load_dotenv(_env_file, override=False)
except ImportError:  # python-dotenv is optional for these scripts
    pass


# Storage bucket name (same for both environments)
STORAGE_BUCKET = os.getenv('SUPABASE_STORAGE_BUCKET', 'munlink-files')

_ENV_PREFIXES = {
    'dev': ('DEV', 'munlink-dev'),
    'prod': ('PROD', 'munlink-prod'),
}


def _read(name: str) -> str:
    return (os.getenv(name) or '').strip()


def _project_ref(url: str) -> str:
    host = urlparse(url).hostname or ''
    return host.split('.')[0] if host else ''


def _build_environment(prefix: str, name: str) -> Dict[str, str]:
    url = _read(f'{prefix}_SUPABASE_URL')
    return {
        'name': name,
        'url': url,
        'anon_key': _read(f'{prefix}_SUPABASE_ANON_KEY'),
        'service_key': _read(f'{prefix}_SUPABASE_SERVICE_KEY'),
        'database_url': _read(f'{prefix}_DATABASE_URL'),
        'project_ref': _project_ref(url),
    }


ENVIRONMENTS: Dict[str, Dict[str, str]] = {
    key: _build_environment(prefix, name) for key, (prefix, name) in _ENV_PREFIXES.items()
}

_FIELD_TO_VAR = {
    'url': 'SUPABASE_URL',
    'anon_key': 'SUPABASE_ANON_KEY',
    'service_key': 'SUPABASE_SERVICE_KEY',
    'database_url': 'DATABASE_URL',
}


def get_environment(env_key: str) -> Dict[str, str]:
    """Get configuration for a specific environment."""
    if env_key not in ENVIRONMENTS:
        raise ValueError(f"Unknown environment: {env_key}. Use 'dev' or 'prod'.")
    return ENVIRONMENTS[env_key]


def require(env_key: str, field: str) -> str:
    """Return a configured value or fail with the variable name to set."""
    value = get_environment(env_key).get(field) or ''
    if not value:
        prefix = _ENV_PREFIXES[env_key][0]
        raise RuntimeError(
            f"{prefix}_{_FIELD_TO_VAR[field]} is not set. "
            "Export it or add it to your git-ignored .env file."
        )
    return value


def get_database_url(env_key: str) -> str:
    """Get database URL for a specific environment."""
    return require(env_key, 'database_url')


def get_supabase_url(env_key: str) -> str:
    """Get Supabase project URL for a specific environment."""
    return require(env_key, 'url')


def get_service_key(env_key: str) -> str:
    """Get Supabase service key for a specific environment."""
    return require(env_key, 'service_key')


def get_supabase_client(env_key: str):
    """Get Supabase client for a specific environment."""
    try:
        from supabase import create_client
    except ImportError:
        raise ImportError("supabase package not installed. Run: pip install supabase")

    return create_client(get_supabase_url(env_key), get_service_key(env_key))


def get_sqlalchemy_engine(env_key: str):
    """Get SQLAlchemy engine for a specific environment."""
    from sqlalchemy import create_engine

    db_url = get_database_url(env_key)

    # Add SSL mode for Supabase
    if '?' not in db_url:
        db_url += '?sslmode=require'
    elif 'sslmode' not in db_url:
        db_url += '&sslmode=require'

    return create_engine(db_url)


def list_environments() -> list:
    """List all available environment keys."""
    return list(ENVIRONMENTS.keys())


def mask_database_url(db_url: str) -> str:
    """Hide the password in a database URL for display."""
    parsed = urlparse(db_url or '')
    if not parsed.password:
        return db_url or ''
    return (db_url or '').replace(f":{parsed.password}@", ":****@", 1)


def print_environment_info(env_key: str):
    """Print information about an environment without revealing secrets."""
    env = get_environment(env_key)
    print(f"Environment: {env['name']}")
    print(f"  URL: {env['url'] or '(not set)'}")
    print(f"  Database: {mask_database_url(env['database_url']) or '(not set)'}")
    print(f"  Project Ref: {env['project_ref'] or '(not set)'}")
