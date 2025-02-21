import sqlite3
import bcrypt

def create_test_user():
    # Test user credentials
    email = "test@example.com"
    username = "testuser"
    password = "TestUser123"  # This will be the password you can use to login
    
    # Hash the password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    conn = sqlite3.connect('database/events.db')
    cursor = conn.cursor()
    
    try:
        # Check if test user already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            print("Test user already exists!")
            return
        
        # Create the test user
        cursor.execute('''
            INSERT INTO users (email, username, password_hash, created_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ''', (email, username, hashed))
        
        conn.commit()
        print(f"Test user created successfully!")
        print(f"Email: {email}")
        print(f"Username: {username}")
        print(f"Password: {password}")
        
    except Exception as e:
        print(f"Error creating test user: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == '__main__':
    create_test_user()
