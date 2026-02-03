import sqlite3
import os

db_path = r'd:\veg_shop\backend\prisma\dev.db'

if not os.path.exists(db_path):
    print(f"Database file not found at {db_path}")
    exit(1)

try:
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # List tables
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = cursor.fetchall()
    print("Tables:", [t[0] for t in tables])
    
    # Check for User table
    user_table = None
    for t in tables:
        if t[0].lower() == 'user':
            user_table = t[0]
            break
        if t[0].lower() == 'users':
            user_table = t[0]
            break
            
    if user_table:
        print(f"Found user table: {user_table}")
        cursor.execute(f"SELECT COUNT(*) FROM {user_table}")
        count = cursor.fetchone()[0]
        print(f"User count: {count}")
        
        if count > 0:
            cursor.execute(f"SELECT * FROM {user_table} LIMIT 3")
            rows = cursor.fetchall()
            print("Sample users:", rows)
            
            # Get column names
            cursor.execute(f"PRAGMA table_info({user_table})")
            columns = [col[1] for col in cursor.fetchall()]
            print("Columns:", columns)
            
    else:
        print("No User/users table found.")
        
    conn.close()
    
except Exception as e:
    print(f"Error: {e}")
