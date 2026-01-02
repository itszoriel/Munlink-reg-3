"""
MunLink Zambales - Configuration
Application configuration management
"""
import os
from datetime import timedelta
from pathlib import Path
from urllib.parse import urlparse, parse_qs, urlencode, urlunparse

# Get project root (2 levels up from this file)
BASE_DIR = Path(__file__).parent.parent.parent.resolve()


def get_database_url():
    """
    Get and process the database URL for proper connection handling.
    - Ensures SSL is enabled for PostgreSQL connections (required by Supabase)
    - Handles URL scheme conversion (postgres:// -> postgresql://)
    """
    url = os.getenv('DATABASE_URL', f'sqlite:///{BASE_DIR}/munlink_region3.db')
    
    # Handle Heroku/Render style postgres:// URLs (SQLAlchemy requires postgresql://)
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    
    # For PostgreSQL connections, ensure SSL is configured
    if url.startswith('postgresql://'):
        parsed = urlparse(url)
        query_params = parse_qs(parsed.query)
        
        # Add sslmode=require if not already set (required for Supabase)
        if 'sslmode' not in query_params:
            query_params['sslmode'] = ['require']
        
        # Rebuild the URL with updated query params
        new_query = urlencode(query_params, doseq=True)
        url = urlunparse((
            parsed.scheme,
            parsed.netloc,
            parsed.path,
            parsed.params,
            new_query,
            parsed.fragment
        ))
    
    return url


def get_engine_options():
    """
    Get SQLAlchemy engine options based on the database type.
    PostgreSQL requires specific connection settings for Supabase pooler.
    """
    db_url = get_database_url()
    
    # Base options for all databases
    options = {
        'pool_pre_ping': True,  # Verify connections before use (handles stale connections)
    }
    
    # PostgreSQL-specific options for Supabase connection
    if db_url.startswith('postgresql://'):
        options.update({
            'pool_recycle': 300,    # Recycle connections every 5 minutes
            'pool_timeout': 60,     # Wait up to 60 seconds for a connection from pool
            'pool_size': 3,         # Keep 3 connections in the pool (fewer for free tier)
            'max_overflow': 5,      # Allow up to 5 additional connections
            'connect_args': {
                'connect_timeout': 60,      # 60 second connection timeout (increased for Supabase)
                'keepalives': 1,            # Enable TCP keepalives
                'keepalives_idle': 30,      # Seconds before sending keepalive
                'keepalives_interval': 10,  # Seconds between keepalives
                'keepalives_count': 5,      # Number of keepalives before giving up
            }
        })
    
    return options


class Config:
    """Base configuration"""
    
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = os.getenv('DEBUG', 'False') == 'True'
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    
    # Database
    SQLALCHEMY_DATABASE_URI = get_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = DEBUG
    
    # SQLAlchemy Engine Options - dynamically configured based on database type
    SQLALCHEMY_ENGINE_OPTIONS = get_engine_options()
    
    # Supabase Configuration (optional - for Supabase features like auth, storage, real-time)
    SUPABASE_URL = os.getenv('SUPABASE_URL', '')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')
    SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY', '')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        seconds=int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
    )
    JWT_ALGORITHM = 'HS256'
    # Enable JWT in headers and cookies; use cookies for refresh token
    JWT_TOKEN_LOCATION = ['headers', 'cookies']
    # Cookie settings for refresh token (and optionally access later)
    JWT_COOKIE_SECURE = (os.getenv('JWT_COOKIE_SECURE', 'False' if DEBUG else 'True') == 'True')
    JWT_COOKIE_SAMESITE = os.getenv('JWT_COOKIE_SAMESITE', 'Lax')
    JWT_COOKIE_DOMAIN = os.getenv('COOKIE_DOMAIN')  # e.g., .munlink.example.com
    JWT_ACCESS_COOKIE_PATH = '/'
    JWT_REFRESH_COOKIE_PATH = '/'
    # CSRF can be enabled later if we migrate access to cookies
    JWT_COOKIE_CSRF_PROTECT = (os.getenv('JWT_COOKIE_CSRF_PROTECT', 'False') == 'True')
    
    # Admin Security
    ADMIN_SECRET_KEY = os.getenv('ADMIN_SECRET_KEY', 'admin-secret-key')
    
    # File Uploads
    MAX_CONTENT_LENGTH = int(os.getenv('MAX_FILE_SIZE', 10 * 1024 * 1024))  # 10MB
    UPLOAD_FOLDER = BASE_DIR / os.getenv('UPLOAD_FOLDER', 'uploads/region3')
    ALLOWED_EXTENSIONS = set(
        os.getenv('ALLOWED_EXTENSIONS', 'pdf,jpg,jpeg,png,doc,docx').split(',')
    )
    
    # Email (SMTP)
    SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
    SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
    SMTP_USERNAME = os.getenv('SMTP_USERNAME', '')
    SMTP_PASSWORD = os.getenv('SMTP_PASSWORD', '')
    FROM_EMAIL = os.getenv('FROM_EMAIL', 'noreply@munlink-region3.gov.ph')
    
    # QR Codes
    QR_BASE_URL = os.getenv('QR_BASE_URL', 'http://localhost:3000/verify')
    QR_EXPIRY_DAYS = int(os.getenv('QR_EXPIRY_DAYS', 30))
    
    # Application
    APP_NAME = os.getenv('APP_NAME', 'MunLink Region 3')
    
    # Frontend URLs (for CORS)
    WEB_URL = os.getenv('WEB_URL', 'http://localhost:3000')
    ADMIN_URL = os.getenv('ADMIN_URL', 'http://localhost:3001')
    
    # Location Data - use API-local data folder (works on Render)
    # API_DIR is where apps/api is located
    API_DIR = Path(__file__).parent.resolve()
    LOCATION_DATA_FILE = API_DIR / 'data' / 'locations' / 'philippines_full_locations.json'
    REGION3_DATA_FILE = API_DIR / 'data' / 'locations' / 'region3_locations.json'
    
    # Asset Paths
    MUNICIPAL_LOGOS_DIR = BASE_DIR / 'public' / 'logos' / 'municipalities'
    PROVINCE_LOGOS_DIR = BASE_DIR / 'public' / 'logos' / 'provinces'
    LANDMARKS_DIR = BASE_DIR / 'public' / 'landmarks'
    
    # Region 3 Provinces (Central Luzon)
    REGION3_PROVINCES = [
        'Aurora', 'Bataan', 'Bulacan', 'Nueva Ecija', 
        'Pampanga', 'Tarlac', 'Zambales'
    ]
    
    @staticmethod
    def init_app(app):
        """Initialize application configuration"""
        # Create upload directories if they don't exist
        upload_dir = Path(Config.UPLOAD_FOLDER)
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Create municipality upload directories will be created dynamically
        # based on seeded municipalities from Region 3 provinces
        
        # Create marketplace upload directory
        (upload_dir / 'marketplace' / 'items').mkdir(parents=True, exist_ok=True)


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_ECHO = False


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    SQLALCHEMY_ENGINE_OPTIONS = {'pool_pre_ping': True}  # SQLite doesn't need PostgreSQL options
    WTF_CSRF_ENABLED = False


# Config dictionary
config_by_name = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}

