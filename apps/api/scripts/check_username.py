"""Check if a username exists in the database (securely, without exposing password)."""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))

from apps.api.app import create_app, db
from apps.api.models.user import User

# Change this to the username you want to check
USERNAME_TO_CHECK = 'princhprays'

app = create_app()
with app.app_context():
    user = User.query.filter_by(username=USERNAME_TO_CHECK.lower()).first()
    if user:
        print(f'\nUsername "{USERNAME_TO_CHECK}" EXISTS in Supabase')
        print(f'  - Email: {user.email}')
        print(f'  - Role: {user.role}')
        print(f'  - Created: {user.created_at}')
        print(f'  - Email Verified: {user.email_verified}')
        print(f'  - Admin Verified: {user.admin_verified}')
    else:
        print(f'\nUsername "{USERNAME_TO_CHECK}" does NOT exist in Supabase')
        print('You can safely register with this username.\n')

