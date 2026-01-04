"""
MunLink Region III - Flask API Application
Main application entry point
"""
import sys
import os
from pathlib import Path
from dotenv import load_dotenv

# Determine project root (2 levels up from this file)
API_DIR = Path(__file__).parent.resolve()
PROJECT_ROOT = API_DIR.parent.parent.resolve()

# Load environment variables from .env file at project root
env_path = PROJECT_ROOT / '.env'
if env_path.exists():
    load_dotenv(env_path)

# Add project root to path for absolute imports
sys.path.insert(0, str(PROJECT_ROOT))

from flask import Flask, jsonify, send_from_directory, request
from flask_cors import CORS

# Import config - try absolute first, then relative
try:
    from apps.api.config import Config
    from apps.api import db, migrate, jwt
except ImportError:
    from config import Config
    from __init__ import db, migrate, jwt


def create_app(config_class=Config):
    """Application factory pattern"""
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Log database URL for debugging (masked)
    db_url = app.config.get('SQLALCHEMY_DATABASE_URI', '')
    if 'postgresql' in db_url:
        app.logger.info("Database: PostgreSQL (Supabase)")
    elif 'sqlite' in db_url:
        app.logger.info("Database: SQLite (local)")
    
    # Ensure directories and other config-dependent setup are initialized
    try:
        config_class.init_app(app)
    except Exception:
        pass
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # CORS configuration - supports Vercel preview deployments
    cors_origins = [
        app.config.get('WEB_URL', 'http://localhost:5173'),
        app.config.get('ADMIN_URL', 'http://localhost:3001'),
        # Local development
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:5173",
    ]
    
    # Add Vercel preview URLs from environment (comma-separated)
    vercel_previews = os.getenv('VERCEL_PREVIEW_ORIGINS', '')
    if vercel_previews:
        cors_origins.extend([url.strip() for url in vercel_previews.split(',') if url.strip()])
    
    # Remove duplicates while preserving order
    cors_origins = list(dict.fromkeys(cors_origins))
    
    # Apply CORS globally with Flask-CORS
    CORS(app, 
         origins=cors_origins,
         methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
         allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
         supports_credentials=True,
         expose_headers=["Content-Type", "Authorization"])
    
    # JWT token blacklist check
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        try:
            from apps.api.models.token_blacklist import TokenBlacklist
        except ImportError:
            from models.token_blacklist import TokenBlacklist
        jti = jwt_payload['jti']
        return TokenBlacklist.is_token_revoked(jti)
    
    # Register blueprints
    try:
        from apps.api.routes import auth_bp, provinces_bp, municipalities_bp, marketplace_bp, announcements_bp, documents_bp, issues_bp, benefits_bp
        from apps.api.routes.admin import admin_bp
    except ImportError:
        from routes import auth_bp, provinces_bp, municipalities_bp, marketplace_bp, announcements_bp, documents_bp, issues_bp, benefits_bp
        from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(provinces_bp)
    app.register_blueprint(municipalities_bp)
    app.register_blueprint(marketplace_bp)
    app.register_blueprint(announcements_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(issues_bp)
    app.register_blueprint(benefits_bp)
    app.register_blueprint(admin_bp)
    
    # Health check endpoint
    @app.route('/health', methods=['GET'])
    def health_check():
        """Health check endpoint for monitoring"""
        return jsonify({
            'status': 'healthy',
            'service': 'MunLink Region III API',
            'version': '1.0.0'
        }), 200
    
    # Database health check endpoint
    @app.route('/health/db', methods=['GET'])
    def db_health_check():
        """Health check endpoint that tests database connectivity"""
        import time
        start = time.time()
        try:
            # Test database connection with a simple query
            from sqlalchemy import text
            result = db.session.execute(text('SELECT 1'))
            result.fetchone()
            db.session.rollback()  # Don't leave transaction open
            elapsed = time.time() - start
            return jsonify({
                'status': 'healthy',
                'database': 'connected',
                'latency_ms': round(elapsed * 1000, 2),
                'service': 'MunLink Region III API'
            }), 200
        except Exception as e:
            elapsed = time.time() - start
            app.logger.error(f"Database health check failed: {e}")
            return jsonify({
                'status': 'unhealthy',
                'database': 'disconnected',
                'latency_ms': round(elapsed * 1000, 2),
                'error': str(e)[:200]
            }), 503
    
    # Root endpoint
    @app.route('/', methods=['GET'])
    def root():
        """API root endpoint"""
        return jsonify({
            'message': 'MunLink Region III API',
            'version': '1.0.0',
            'region': 'Central Luzon (Region III)',
            'provinces': 7,
            'municipalities': 129,
            'docs': '/api/docs'
        }), 200
    
    # Public verify route (for QR codes)
    @app.route('/verify/<string:request_number>', methods=['GET'])
    def public_verify_direct(request_number: str):
        """Handle verify requests directly (for QR codes pointing to backend)."""
        try:
            from apps.api.models.document import DocumentRequest
            r = DocumentRequest.query.filter_by(request_number=request_number).first()
            if not r:
                return jsonify({'valid': False, 'reason': 'not_found'}), 200
            if (r.delivery_method or '').lower() != 'digital':
                return jsonify({'valid': False, 'reason': 'not_digital'}), 200
            if not r.document_file:
                return jsonify({'valid': False, 'reason': 'no_file'}), 200
            status = (r.status or '').lower()
            if status not in ('ready', 'completed'):
                return jsonify({'valid': False, 'reason': f'status_{status}'}), 200
            muni_name = getattr(getattr(r, 'municipality', None), 'name', None)
            doc_name = getattr(getattr(r, 'document_type', None), 'name', None)
            issued_at = r.ready_at.isoformat() if getattr(r, 'ready_at', None) else None
            return jsonify({
                'valid': True,
                'request_number': r.request_number,
                'status': r.status,
                'muni_name': muni_name,
                'doc_name': doc_name,
                'issued_at': issued_at,
                'url': f"/uploads/{str(r.document_file).replace(chr(92), '/')}"
            }), 200
        except Exception as e:
            return jsonify({'valid': False, 'error': str(e)}), 500
    
    # Serve uploaded files
    @app.route('/uploads/<path:filename>')
    def serve_uploaded_file(filename):
        """Serve uploaded files from the uploads directory"""
        try:
            upload_dir = app.config.get('UPLOAD_FOLDER', 'uploads')
            directory = str(upload_dir)
            return send_from_directory(directory, filename)
        except FileNotFoundError:
            return jsonify({'error': 'File not found'}), 404
    
    # Error handlers
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Resource not found'}), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Internal server error'}), 500
    
    @app.errorhandler(401)
    def unauthorized(error):
        return jsonify({'error': 'Unauthorized'}), 401
    
    @app.errorhandler(403)
    def forbidden(error):
        return jsonify({'error': 'Forbidden'}), 403
    
    return app


# Create app instance
app = create_app()

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=app.config['DEBUG']
    )
