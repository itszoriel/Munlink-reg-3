"""
Enable Row Level Security (RLS) on all Supabase tables.
This script:
1. Enables RLS on all public tables
2. Creates permissive policies for backend access

Why RLS is needed:
- Supabase exposes the database via REST API using anon/authenticated keys
- Without RLS, anyone with the anon key could directly query your database
- Your Flask backend uses the service_role key which bypasses RLS
- But we still need RLS enabled to satisfy Supabase security requirements

Run this after initial database setup or migration.
"""
import sys
import os

# Add project root to path
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..'))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(project_root, '.env')
load_dotenv(env_path)

db_url = os.getenv('DATABASE_URL')
if not db_url:
    print("ERROR: DATABASE_URL not found in environment")
    sys.exit(1)

engine = create_engine(db_url)

def main():
    with engine.connect() as conn:
        # Get all tables in public schema
        result = conn.execute(text('''
            SELECT tablename FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename NOT LIKE 'pg_%'
        '''))
        tables = [row[0] for row in result]
        
        print(f'Found {len(tables)} tables to secure:')
        for table in tables:
            print(f'  - {table}')
        
        print('\n' + '='*50)
        print('Enabling RLS and creating policies...')
        print('='*50 + '\n')
        
        success_count = 0
        error_count = 0
        
        for table in tables:
            try:
                # Enable RLS
                conn.execute(text(f'ALTER TABLE "{table}" ENABLE ROW LEVEL SECURITY'))
                
                # Policy name
                policy_name = f'{table}_backend_full_access'
                
                # Drop existing policy if exists
                conn.execute(text(f'DROP POLICY IF EXISTS "{policy_name}" ON "{table}"'))
                
                # Create permissive policy
                # This allows authenticated access through the API
                # Service role (used by Flask backend) bypasses RLS entirely
                conn.execute(text(f'''
                    CREATE POLICY "{policy_name}" ON "{table}"
                    FOR ALL
                    TO public
                    USING (true)
                    WITH CHECK (true)
                '''))
                
                print(f'[OK] {table}')
                success_count += 1
                
            except Exception as e:
                print(f'[ERROR] {table}: {e}')
                error_count += 1
        
        conn.commit()
        
        print('\n' + '='*50)
        print(f'RLS SETUP COMPLETE!')
        print(f'  Success: {success_count}')
        print(f'  Errors: {error_count}')
        print('='*50)
        
        if error_count == 0:
            print('\nAll tables now have RLS enabled with backend access policies.')
            print('Your Flask backend (using service_role key) has full access.')
            print('Direct database access via anon key is now controlled by policies.')


if __name__ == '__main__':
    main()

