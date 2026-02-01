"""
Shared database environment configurations for MunLink Region 3.

This module provides centralized configuration for both dev and prod
Supabase environments, used by various scripts.

Usage:
    from db_environments import ENVIRONMENTS, get_database_url, get_supabase_client
    
    # Get specific environment
    dev_url = get_database_url('dev')
    prod_client = get_supabase_client('prod')
"""
from __future__ import annotations

from typing import Dict, Any, Optional

# =============================================================================
# SUPABASE CONFIGURATIONS
# =============================================================================

ENVIRONMENTS: Dict[str, Dict[str, str]] = {
    'dev': {
        'name': 'munlink-dev',
        'url': 'https://lapooogulvdbhbvvycbe.supabase.co',
        'anon_key': '***REMOVED***',
        'service_key': '***REMOVED***',
        'database_url': 'postgresql://postgres.lapooogulvdbhbvvycbe:***REMOVED***@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
        'project_ref': 'lapooogulvdbhbvvycbe',
    },
    'prod': {
        'name': 'munlink-prod',
        'url': 'https://xzkhavrjfaxsqxyptbgm.supabase.co',
        'anon_key': '***REMOVED***',
        'service_key': '***REMOVED***',
        'database_url': 'postgresql://postgres.xzkhavrjfaxsqxyptbgm:***REMOVED***@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres',
        'project_ref': 'xzkhavrjfaxsqxyptbgm',
    }
}

# Storage bucket name (same for both environments)
STORAGE_BUCKET = 'munlink-files'


def get_environment(env_key: str) -> Dict[str, str]:
    """Get configuration for a specific environment."""
    if env_key not in ENVIRONMENTS:
        raise ValueError(f"Unknown environment: {env_key}. Use 'dev' or 'prod'.")
    return ENVIRONMENTS[env_key]


def get_database_url(env_key: str) -> str:
    """Get database URL for a specific environment."""
    return get_environment(env_key)['database_url']


def get_supabase_url(env_key: str) -> str:
    """Get Supabase project URL for a specific environment."""
    return get_environment(env_key)['url']


def get_service_key(env_key: str) -> str:
    """Get Supabase service key for a specific environment."""
    return get_environment(env_key)['service_key']


def get_supabase_client(env_key: str):
    """Get Supabase client for a specific environment."""
    try:
        from supabase import create_client
    except ImportError:
        raise ImportError("supabase package not installed. Run: pip install supabase")
    
    env = get_environment(env_key)
    return create_client(env['url'], env['service_key'])


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


def print_environment_info(env_key: str):
    """Print information about an environment."""
    env = get_environment(env_key)
    print(f"Environment: {env['name']}")
    print(f"  URL: {env['url']}")
    print(f"  Database: {env['database_url'][:50]}...")
    print(f"  Project Ref: {env['project_ref']}")

