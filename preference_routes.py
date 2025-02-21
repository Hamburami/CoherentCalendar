from flask import Blueprint, request, jsonify
import sqlite3
from datetime import datetime
from functools import wraps
import jwt
import os

preference_bp = Blueprint('preferences', __name__)

# Use the same secret key as user_routes.py
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

@preference_bp.route('/api/preferences/tags/next', methods=['GET'])
@token_required
def get_next_tag(user_id):
    """Get the next unrated tag for the user."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get a tag that the user hasn't rated yet
        cursor.execute('''
            SELECT t.*
            FROM tags t
            LEFT JOIN user_tag_preferences p ON t.id = p.tag_id AND p.user_id = ?
            WHERE p.user_id IS NULL
            ORDER BY RANDOM()
            LIMIT 1
        ''', (user_id,))
        
        tag = cursor.fetchone()
        conn.close()
        
        if not tag:
            return jsonify({'message': 'No more tags to rate'}), 404
            
        return jsonify(dict(tag))
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@preference_bp.route('/api/preferences/tags/<int:tag_id>', methods=['POST'])
@token_required
def set_tag_preference(user_id, tag_id):
    """Set user's preference for a tag."""
    data = request.json
    if 'preference' not in data:
        return jsonify({'error': 'Preference is required'}), 400
        
    preference = data['preference']
    if preference not in [-1, 0, 1]:
        return jsonify({'error': 'Preference must be -1, 0, or 1'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO user_tag_preferences (user_id, tag_id, preference)
            VALUES (?, ?, ?)
            ON CONFLICT(user_id, tag_id) DO UPDATE SET
                preference = excluded.preference,
                created_at = CURRENT_TIMESTAMP
        ''', (user_id, tag_id, preference))
        
        conn.commit()
        conn.close()
        return jsonify({'message': 'Preference saved successfully'})
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@preference_bp.route('/api/preferences/recommended-events', methods=['GET'])
@token_required
def get_recommended_events(user_id):
    """Get events based on user's tag preferences."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get events that match user's preferred tags
        cursor.execute('''
            WITH user_likes AS (
                SELECT tag_id, preference
                FROM user_tag_preferences
                WHERE user_id = ? AND preference >= 0
            )
            SELECT DISTINCT e.*, 
                   COUNT(CASE WHEN p.preference = 1 THEN 1 END) as matching_tags
            FROM events e
            JOIN event_tags et ON e.id = et.event_id
            JOIN user_likes p ON et.tag_id = p.tag_id
            WHERE e.needs_review = 0
            GROUP BY e.id
            ORDER BY matching_tags DESC, e.date ASC
            LIMIT 10
        ''', (user_id,))
        
        events = []
        for row in cursor.fetchall():
            event_dict = dict(row)
            
            # Get tags for this event
            cursor.execute('''
                SELECT t.*
                FROM tags t
                JOIN event_tags et ON t.id = et.tag_id
                WHERE et.event_id = ?
            ''', (row['id'],))
            
            event_dict['tags'] = [dict(tag) for tag in cursor.fetchall()]
            events.append(event_dict)
        
        conn.close()
        return jsonify(events)
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@preference_bp.route('/api/events', methods=['GET'])
@token_required
def get_events_by_tag(user_id):
    """Get sample events for a specific tag."""
    tag_id = request.args.get('tag_id')
    limit = request.args.get('limit', 3, type=int)
    
    if not tag_id:
        return jsonify({'error': 'tag_id is required'}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Get events with this tag, ordered by date
        cursor.execute('''
            SELECT e.*
            FROM events e
            JOIN event_tags et ON e.id = et.event_id
            WHERE et.tag_id = ? AND e.needs_review = 0
            AND e.date >= date('now')
            ORDER BY e.date ASC
            LIMIT ?
        ''', (tag_id, limit))
        
        events = [dict(row) for row in cursor.fetchall()]
        conn.close()
        
        return jsonify(events)
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500
