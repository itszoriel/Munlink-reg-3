"""
Database initialization script for production deployment.
Creates all tables from models, stamps with latest migration, and seeds initial data.
"""
import sys
import os

# Ensure project root is importable
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)


def seed_if_empty():
    """
    Seed database with initial data if tables are empty.
    This ensures provinces, municipalities, document types, etc. exist in production.
    """
    from apps.api.models.province import Province
    from apps.api.models.municipality import Municipality
    from apps.api.models.document import DocumentType
    from apps.api.models.issue import IssueCategory
    from apps.api.models.benefit import BenefitProgram
    
    # Check if data already exists
    province_count = Province.query.count()
    if province_count > 0:
        print(f"  Data already exists ({province_count} provinces found), skipping seed.")
        return
    
    print("  No data found, seeding database...")
    
    # Import seed functions from seed_data.py
    from apps.api.scripts.seed_data import (
        seed_provinces,
        seed_municipalities,
        seed_document_types,
        seed_issue_categories,
        ISSUE_CATEGORIES,
        DOCUMENT_TYPES
    )
    from apps.api import db
    
    try:
        seed_provinces()
        seed_municipalities()
        seed_document_types()
        seed_issue_categories()
        
        # Seed benefit programs if empty
        if BenefitProgram.query.count() == 0:
            print("  Seeding benefit programs...")
            samples = [
                BenefitProgram(
                    name='Educational Assistance',
                    code='EDU_ASSIST',
                    description='Financial aid for qualified students',
                    program_type='educational',
                    municipality_id=None,
                    eligibility_criteria={'resident': True},
                    required_documents=['Valid ID', 'Enrollment certificate'],
                    is_active=True,
                    is_accepting_applications=True
                ),
                BenefitProgram(
                    name='Senior Citizen Subsidy',
                    code='SENIOR_SUBSIDY',
                    description='Monthly subsidy for seniors',
                    program_type='financial',
                    municipality_id=None,
                    eligibility_criteria={'age': '>=60'},
                    required_documents=['Senior citizen ID'],
                    is_active=True,
                    is_accepting_applications=True
                ),
                BenefitProgram(
                    name='Livelihood Starter Kit',
                    code='LIVELIHOOD_KIT',
                    description='Starter kits and training',
                    program_type='livelihood',
                    municipality_id=None,
                    eligibility_criteria={'training': True},
                    required_documents=['Valid ID', 'Intent letter'],
                    is_active=True,
                    is_accepting_applications=True
                ),
            ]
            for p in samples:
                db.session.add(p)
            db.session.commit()
            print("  Benefit programs seeded successfully!")
        
        print("  Database seeding complete!")
    except Exception as e:
        print(f"  WARNING: Seeding failed: {e}")
        # Don't raise - allow app to start even if seeding fails


def init_database():
    """Initialize database - create tables if they don't exist and seed data"""
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
        
        tables_created = False
        # Check if tables exist by trying to query
        try:
            User.query.first()
            print("  Tables already exist, skipping creation.")
        except Exception as e:
            print(f"  Tables don't exist, creating all tables...")
            db.create_all()
            print("  All tables created successfully!")
            tables_created = True
            
            # Stamp with latest migration so future migrations work correctly
            from flask_migrate import stamp
            stamp(revision='head')
            print("  Database stamped with latest migration.")
        
        # Always check if we need to seed data (even if tables existed but are empty)
        print("Checking if database needs seeding...")
        seed_if_empty()
        
        print("Database initialization complete!")

if __name__ == '__main__':
    init_database()

