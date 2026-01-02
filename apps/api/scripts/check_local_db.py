"""Check local SQLite database for any accounts."""
import sqlite3
import os
from pathlib import Path

project_root = Path(__file__).parent.parent.parent.parent
db_path = project_root / 'munlink_region3.db'

if db_path.exists():
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()
    
    # Check if users table exists
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='users'")
    if cursor.fetchone():
        cursor.execute('SELECT COUNT(*) FROM users')
        total = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role='municipal_admin'")
        admins = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role='resident'")
        residents = cursor.fetchone()[0]
        
        print('=== LOCAL SQLITE DATABASE ===')
        print(f'Total users: {total}')
        print(f'Municipal admins: {admins}')
        print(f'Residents: {residents}')
        print()
        
        # Show all users
        cursor.execute("SELECT username, email, role, first_name, last_name FROM users")
        rows = cursor.fetchall()
        if rows:
            print('All accounts in LOCAL database:')
            for r in rows:
                print(f'  - Username: {r[0]}, Email: {r[1]}, Role: {r[2]}, Name: {r[3]} {r[4]}')
        else:
            print('No accounts in local database.')
    else:
        print('No users table in local database.')
    conn.close()
else:
    print(f'Local SQLite database not found at: {db_path}')

