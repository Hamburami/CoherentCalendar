from flask import Blueprint, request, jsonify, session
import sqlite3
from datetime import datetime
import bcrypt
import re
import jwt
import os
from functools import wraps

user_bp = Blueprint('users', __name__)

# JWT secret key - in production, this should be an environment variable
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')

def get_db():
    conn = sqlite3.connect('database/database.db')
    conn.row_factory = sqlite3.Row
    return conn

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        
        if not token:
            return jsonify({'error': 'Token is required'}), 401
            
        try:
            token = token.split('Bearer ')[1]
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            user_id = data['user_id']
            
            # Verify user exists
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('SELECT id FROM users WHERE id = ?', (user_id,))
            user = cursor.fetchone()
            conn.close()
            
            if not user:
                return jsonify({'error': 'Invalid user'}), 401
                
            # Add user_id to kwargs
            kwargs['user_id'] = user_id
            return f(*args, **kwargs)
            
        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401
            
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

@user_bp.route('/api/users/register', methods=['POST'])
def register():
    """Register a new user."""
    data = request.json
    
    if not all(k in data for k in ('email', 'password', 'username')):
        return jsonify({'error': 'Email, password, and username are required'}), 400
        
    email = data['email'].lower()
    password = data['password']
    username = data['username']
    
    # Validate input
    if not validate_email(email):
        return jsonify({'error': 'Invalid email format'}), 400
        
    if not validate_password(password):
        return jsonify({'error': 'Password must be at least 8 characters and contain uppercase, lowercase, and numbers'}), 400
        
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if email or username already exists
        cursor.execute('SELECT id FROM users WHERE email = ? OR username = ?', (email, username))
        if cursor.fetchone():
            return jsonify({'error': 'Email or username already exists'}), 409
            
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Create user
        cursor.execute(
            'INSERT INTO users (email, password_hash, username) VALUES (?, ?, ?)',
            (email, password_hash, username)
        )
        conn.commit()
        user_id = cursor.lastrowid
        
        # Generate token
        token = jwt.encode(
            {'user_id': user_id, 'email': email},
            JWT_SECRET,
            algorithm='HS256'
        )
        
        return jsonify({
            'token': token,
            'user': {
                'id': user_id,
                'email': email,
                'username': username
            }
        }), 201
        
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@user_bp.route('/api/users/login', methods=['POST'])
def login():
    """Log in a user."""
    data = request.json
    
    if not all(k in data for k in ('email', 'password')):
        return jsonify({'error': 'Email and password are required'}), 400
        
    email = data['email'].lower()
    password = data['password']
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM users WHERE email = ?', (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({'error': 'Invalid email or password'}), 401
            
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash']):
            return jsonify({'error': 'Invalid email or password'}), 401
            
        # Update last login
        cursor.execute(
            'UPDATE users SET last_login = ? WHERE id = ?',
            (datetime.utcnow(), user['id'])
        )
        conn.commit()
        
        # Generate token
        token = jwt.encode(
            {'user_id': user['id'], 'email': user['email']},
            JWT_SECRET,
            algorithm='HS256'
        )
        
        return jsonify({
            'token': token,
            'user': {
                'id': user['id'],
                'email': user['email'],
                'username': user['username']
            }
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@user_bp.route('/api/users/profile', methods=['GET'])
@token_required
def get_profile(user_id):
    """Get user profile."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get user info
        cursor.execute('''
            SELECT id, email, username, created_at, last_login
            FROM users WHERE id = ?
        ''', (user_id,))
        user = dict(cursor.fetchone())
        
        # Get tag preferences
        cursor.execute('''
            SELECT t.name, t.category, utp.weight
            FROM user_tag_preferences utp
            JOIN tags t ON utp.tag_id = t.id
            WHERE utp.user_id = ?
        ''', (user_id,))
        preferences = [dict(row) for row in cursor.fetchall()]
        
        # Get interaction counts
        cursor.execute('''
            SELECT interaction_type, COUNT(*) as count
            FROM user_event_interactions
            WHERE user_id = ?
            GROUP BY interaction_type
        ''', (user_id,))
        interactions = {row['interaction_type']: row['count'] for row in cursor.fetchall()}
        
        return jsonify({
            'user': user,
            'preferences': preferences,
            'interactions': interactions
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@user_bp.route('/api/users/preferences', methods=['POST'])
@token_required
def update_preferences(user_id):
    """Update user tag preferences."""
    data = request.json
    
    if not isinstance(data.get('preferences'), list):
        return jsonify({'error': 'Preferences must be a list'}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('BEGIN TRANSACTION')
        
        for pref in data['preferences']:
            if not all(k in pref for k in ('tag_id', 'weight')):
                cursor.execute('ROLLBACK')
                return jsonify({'error': 'Each preference must have tag_id and weight'}), 400
                
            cursor.execute('''
                INSERT OR REPLACE INTO user_tag_preferences (user_id, tag_id, weight, updated_at)
                VALUES (?, ?, ?, ?)
            ''', (user_id, pref['tag_id'], pref['weight'], datetime.utcnow()))
            
        cursor.execute('COMMIT')
        
        return jsonify({'message': 'Preferences updated successfully'})
        
    except Exception as e:
        cursor.execute('ROLLBACK')
        return jsonify({'error': str(e)}), 500
    finally:
        conn.close()

@user_bp.route('/api/users/events/<int:event_id>/interact', methods=['POST'])
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