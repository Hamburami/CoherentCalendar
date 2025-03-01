from flask import Blueprint, request, jsonify, session
import sqlite3
from datetime import datetime
import bcrypt
import re
import jwt
import os
from functools import wraps

user_bp = Blueprint('users', __name__, url_prefix='/users')

# JWT secret key - in production, this should be an environment variable
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')

def get_db():
    conn = sqlite3.connect('database/events.db')
    conn.row_factory = sqlite3.Row
    return conn

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header is missing'}), 401
            
        try:
            # Handle both "Bearer <token>" and plain token formats
            token = auth_header.split('Bearer ')[-1].strip()
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Your session has expired. Please log in again.'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token. Please log in again.'}), 401
        except Exception as e:
            return jsonify({'error': str(e)}), 401
        
        return f(user_id, *args, **kwargs)
    return decorated

def validate_email(email):
    """Validate email format."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength."""
    if len(password) < 8:
        return False
    if not re.search(r'[A-Z]', password):
        return False
    if not re.search(r'[a-z]', password):
        return False
    if not re.search(r'\d', password):
        return False
    return True

@user_bp.route('/register', methods=['POST'])
def register():
    print("Received registration request")
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    required_fields = ['email', 'password', 'username']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'All fields are required'}), 400
    
    # Validate email format
    if not validate_email(data['email']):
        return jsonify({'error': 'Invalid email format'}), 400
        
    # Validate password strength
    if not validate_password(data['password']):
        return jsonify({
            'error': 'Password must be at least 8 characters long and contain at least one uppercase letter'
        }), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if email already exists
        cursor.execute('SELECT id FROM users WHERE email = ?', (data['email'],))
        if cursor.fetchone() is not None:
            return jsonify({'error': 'Email already registered'}), 409
            
        # Check if username already exists
        cursor.execute('SELECT id FROM users WHERE username = ?', (data['username'],))
        if cursor.fetchone() is not None:
            return jsonify({'error': 'Username already taken'}), 409
        
        # Hash password
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(data['password'].encode('utf-8'), salt)
        
        # Insert new user
        cursor.execute(
            'INSERT INTO users (email, password_hash, username, created_at) VALUES (?, ?, ?, ?)',
            (data['email'], hashed.decode('utf-8'), data['username'], datetime.utcnow())
        )
        conn.commit()
        
        # Get the new user's ID
        user_id = cursor.lastrowid
        
        # Generate JWT token
        token = jwt.encode(
            {'user_id': user_id},
            JWT_SECRET,
            algorithm='HS256'
        )
        
        print(f"Successfully registered user: {data['email']}")
        
        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'email': data['email'],
                'username': data['username']
            }
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@user_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    print("Login attempt with data:", data)  # Debug log
    
    if not data:
        return jsonify({'error': 'No data provided'}), 400
        
    if 'email' not in data or 'password' not in data:
        return jsonify({'error': 'Email and password are required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM users WHERE email = ?', (data['email'],))
        user = cursor.fetchone()
        
        if not user:
            print(f"No user found with email: {data['email']}")  # Debug log
            return jsonify({'error': 'Invalid email or password'}), 401
            
        stored_hash = user['password_hash'].encode('utf-8')  # Encode the stored hash
        if not bcrypt.checkpw(data['password'].encode('utf-8'), stored_hash):
            print("Password verification failed")  # Debug log
            return jsonify({'error': 'Invalid email or password'}), 401
        
        token = jwt.encode(
            {'user_id': user['id']},
            JWT_SECRET,
            algorithm='HS256'
        )
        
        print(f"Login successful for user: {user['email']}")  # Debug log
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'username': user['username']
            }
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")  # Debug log
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@user_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(user_id):
    """Get user profile."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get user info
        cursor.execute('SELECT id, email, username, created_at FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
            
        # Get user's tag preferences
        cursor.execute('SELECT tag_id FROM user_tag_preferences WHERE user_id = ?', (user_id,))
        tag_preferences = [row['tag_id'] for row in cursor.fetchall()]
        
        # Get user's event interactions
        cursor.execute('''
            SELECT ei.event_id, ei.interaction_type, ei.created_at,
                   e.title, e.date, e.time
            FROM event_interactions ei
            JOIN events e ON ei.event_id = e.id
            WHERE ei.user_id = ?
            ORDER BY ei.created_at DESC
            LIMIT 10
        ''', (user_id,))
        interactions = []
        for row in cursor.fetchall():
            interactions.append({
                'event_id': row['event_id'],
                'type': row['interaction_type'],
                'date': row['created_at'],
                'event_title': row['title'],
                'event_date': row['date'],
                'event_time': row['time']
            })
        
        return jsonify({
            'user': dict(user),
            'tag_preferences': tag_preferences,
            'recent_interactions': interactions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@user_bp.route('/preferences', methods=['POST'])
@token_required
def update_preferences(user_id):
    """Update user tag preferences."""
    data = request.get_json()
    
    if not data or 'tags' not in data:
        return jsonify({'error': 'No tag preferences provided'}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # First delete all existing preferences
        cursor.execute('DELETE FROM user_tag_preferences WHERE user_id = ?', (user_id,))
        
        # Then insert new preferences
        for tag_id in data['tags']:
            cursor.execute(
                'INSERT INTO user_tag_preferences (user_id, tag_id) VALUES (?, ?)',
                (user_id, tag_id)
            )
            
        conn.commit()
        return jsonify({'message': 'Preferences updated successfully'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 400
    finally:
        conn.close()

@user_bp.route('/events/<int:event_id>/interact', methods=['POST'])
@token_required
def interact_with_event(user_id, event_id):
    """Record a user's interaction with an event."""
    data = request.json
    
    if 'interaction_type' not in data:
        return jsonify({'error': 'Interaction type is required'}), 400
        
    interaction_type = data['interaction_type']
    if interaction_type not in ('like', 'dislike', 'maybe'):
        return jsonify({'error': 'Invalid interaction type'}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Record interaction
        cursor.execute('''
            INSERT OR REPLACE INTO user_event_interactions
            (user_id, event_id, interaction_type)
            VALUES (?, ?, ?)
        ''', (user_id, event_id, interaction_type))
        
        # Update tag preferences based on interaction
        if interaction_type in ('like', 'dislike'):
            weight_modifier = 0.1 if interaction_type == 'like' else -0.1
            
            # Get event tags
            cursor.execute('''
                SELECT tag_id, confidence
                FROM event_tags
                WHERE event_id = ?
            ''', (event_id,))
            event_tags = cursor.fetchall()
            
            # Update preferences for each tag
            for tag in event_tags:
                cursor.execute('''
                    INSERT INTO user_tag_preferences (user_id, tag_id, weight, updated_at)
                    VALUES (?, ?, ?, ?)
                    ON CONFLICT (user_id, tag_id) DO UPDATE SET
                    weight = weight + ?,
                    updated_at = ?
                ''', (
                    user_id, tag['tag_id'], weight_modifier * tag['confidence'],
                    datetime.utcnow(), weight_modifier * tag['confidence'],
                    datetime.utcnow()
                ))
        
        conn.commit()
        return jsonify({'message': 'Interaction recorded successfully'})
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()