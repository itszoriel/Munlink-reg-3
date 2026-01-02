"""Quick script to check admin counts in the database."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from apps.api.app import create_app, db
from apps.api.models.user import User
from apps.api.models.province import Province
from apps.api.models.municipality import Municipality

app = create_app()

with app.app_context():
    admins = User.query.filter_by(role='municipal_admin').all()
    print(f"\nTotal municipal admins found: {len(admins)}")
    
    provinces = Province.query.order_by(Province.name).all()
    print("\nAdmins by province:")
    
    for p in provinces:
        count = User.query.filter_by(role='municipal_admin').join(
            Municipality, User.admin_municipality_id == Municipality.id
        ).filter(Municipality.province_id == p.id).count()
        
        total_mun = Municipality.query.filter_by(province_id=p.id, is_active=True).count()
        print(f"  {p.name}: {count}/{total_mun} municipalities have admins")
    
    print()

