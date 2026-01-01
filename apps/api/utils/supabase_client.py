"""
Supabase client utility for MunLink Region 3.
This provides optional Supabase features like auth, storage, and real-time.
For basic database usage, just use the DATABASE_URL connection string.
"""
import os
from typing import Optional

try:
    from supabase import create_client, Client
except ImportError:
    Client = None
    create_client = None


def get_supabase_client() -> Optional[Client]:
    """
    Get Supabase client instance if configured.
    Returns None if Supabase is not configured.
    """
    if create_client is None:
        return None
    
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')
    
    if not supabase_url or not supabase_key:
        return None
    
    try:
        return create_client(supabase_url, supabase_key)
    except Exception as e:
        print(f"Warning: Failed to initialize Supabase client: {e}")
        return None


def is_supabase_configured() -> bool:
    """Check if Supabase is configured."""
    supabase_url = os.getenv('SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_KEY') or os.getenv('SUPABASE_SERVICE_KEY')
    return bool(supabase_url and supabase_key)


def is_supabase_database() -> bool:
    """Check if DATABASE_URL points to Supabase."""
    database_url = os.getenv('DATABASE_URL', '')
    return 'supabase.co' in database_url.lower()


# Example usage functions (can be expanded as needed)

def upload_file_to_supabase_storage(
    bucket: str,
    file_path: str,
    file_data: bytes,
    content_type: str = 'application/octet-stream'
) -> Optional[str]:
    """
    Upload a file to Supabase Storage.
    Returns the public URL if successful, None otherwise.
    """
    client = get_supabase_client()
    if not client:
        return None
    
    try:
        response = client.storage.from_(bucket).upload(
            file_path,
            file_data,
            file_options={"content-type": content_type}
        )
        if response:
            # Get public URL
            public_url = client.storage.from_(bucket).get_public_url(file_path)
            return public_url
    except Exception as e:
        print(f"Error uploading to Supabase Storage: {e}")
    
    return None

