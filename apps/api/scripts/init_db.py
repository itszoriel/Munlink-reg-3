"""
Database initialization script for production deployment.
Creates all tables from models and stamps with latest migration.
"""
import sys
import os

# Ensure project root is importable
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

def init_database():
    """Initialize database - create tables if they don't exist"""
    from apps.api.app import create_app
    from apps.api import db
    
    app = create_app()
    
    with app.app_context():
        # Import all models to ensure they're registered with SQLAlchemy
        from apps.api.models.user import User
        from apps.api.models.province import Province
        from apps.api.models.municipality import Municipality, Barangay
        from apps.api.models.document import DocumentType, DocumentRequest
        from apps.api.models.issue import IssueCategory, Issue, IssueUpdate
        from apps.api.models.benefit import BenefitProgram, BenefitApplication
        from apps.api.models.marketplace import Item, Transaction, TransactionAuditLog, Message
        from apps.api.models.announcement import Announcement
        from apps.api.models.token_blacklist import TokenBlacklist
        from apps.api.models.audit import AuditLog
        from apps.api.models.transfer import TransferRequest
        
        print("Checking database tables...")
        
        # Check if tables exist by trying to query
        try:
            User.query.first()
            print("  Tables already exist, skipping creation.")
        except Exception as e:
            print(f"  Tables don't exist, creating all tables...")
            db.create_all()
            print("  All tables created successfully!")
            
            # Stamp with latest migration so future migrations work correctly
            from flask_migrate import stamp
            stamp(revision='head')
            print("  Database stamped with latest migration.")
        
        print("Database initialization complete!")

if __name__ == '__main__':
    init_database()

