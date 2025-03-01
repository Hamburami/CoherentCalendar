from flask import Blueprint, request, jsonify
from functools import wraps
import sqlite3
import os
from datetime import datetime

preference_bp = Blueprint('preferences', __name__)

def get_db():
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@preference_bp.route('/tags', methods=['GET'])
def get_all_tags():
    """Get all available tags with their categories."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT t.id, t.name, t.color, tc.name as category
            FROM tags t
            LEFT JOIN tag_categories tc ON t.category_id = tc.id
            ORDER BY tc.name, t.name
        ''')
        
        tags = []
        for row in cursor.fetchall():
            tags.append({
                'id': row['id'],
                'name': row['name'],
                'color': row['color'],
                'category': row['category']
            })
            
        return jsonify({
            'tags': tags,
            'error': None
        })
        
    except Exception as e:
        return jsonify({
            'tags': [],
            'error': str(e)
        }), 400
    finally:
        conn.close()

@preference_bp.route('/user/<int:user_id>/tags', methods=['GET'])
def get_user_preferences(user_id):
    """Get a user's tag preferences."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT t.id, t.name, t.color, tc.name as category, utp.preference
            FROM tags t
            LEFT JOIN tag_categories tc ON t.category_id = tc.id
            LEFT JOIN user_tag_preferences utp ON t.id = utp.tag_id AND utp.user_id = ?
            ORDER BY tc.name, t.name
        ''', (user_id,))
        
        preferences = []
        for row in cursor.fetchall():
            preferences.append({
                'tag_id': row['id'],
                'name': row['name'],
                'color': row['color'],
                'category': row['category'],
                'preference': row['preference'] if row['preference'] is not None else 0
            })
            
        return jsonify({
            'preferences': preferences,
            'error': None
        })
        
    except Exception as e:
        return jsonify({
            'preferences': [],
            'error': str(e)
        }), 400
    finally:
        conn.close()

@preference_bp.route('/user/<int:user_id>/tags', methods=['POST'])
def update_user_preferences(user_id):
    """Update a user's tag preferences."""
    data = request.get_json()
    
    if not data or not isinstance(data.get('preferences'), list):
        return jsonify({
            'error': 'Invalid preferences data'
        }), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Start transaction
        cursor.execute('BEGIN')
        
        # Clear existing preferences
        cursor.execute('DELETE FROM user_tag_preferences WHERE user_id = ?', (user_id,))
        
        # Insert new preferences
        for pref in data['preferences']:
            if not isinstance(pref, dict) or 'tag_id' not in pref or 'preference' not in pref:
                continue
                
            cursor.execute('''
                INSERT INTO user_tag_preferences (user_id, tag_id, preference)
                VALUES (?, ?, ?)
            ''', (user_id, pref['tag_id'], pref['preference']))
            
        # Commit transaction
        cursor.execute('COMMIT')
        
        return jsonify({
            'message': 'Preferences updated successfully',
            'error': None
        })
        
    except Exception as e:
        cursor.execute('ROLLBACK')
        return jsonify({
            'error': str(e)
        }), 400
    finally:
        conn.close()
