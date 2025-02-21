from flask import Blueprint, request, jsonify
import sqlite3
from datetime import datetime

tag_bp = Blueprint('tags', __name__)

def get_db():
    conn = sqlite3.connect('database/events.db')
    conn.row_factory = sqlite3.Row
    return conn

@tag_bp.route('/api/tags', methods=['GET'])
def get_tags():
    """Get all tags."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM tags ORDER BY name')
        tags = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(tags)
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@tag_bp.route('/api/tags', methods=['POST'])
def create_tag():
    """Create a new tag."""
    data = request.json
    
    if not data.get('name'):
        return jsonify({'error': 'Tag name is required'}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            'INSERT INTO tags (name, color, created_at) VALUES (?, ?, ?)',
            (data['name'].lower(), data.get('color', '#808080'), datetime.now())
        )
        conn.commit()
        tag_id = cursor.lastrowid
        
        cursor.execute('SELECT * FROM tags WHERE id = ?', (tag_id,))
        tag = dict(cursor.fetchone())
        
        conn.close()
        return jsonify(tag), 201
        
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'error': 'Tag already exists'}), 409
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@tag_bp.route('/api/events/<int:event_id>/tags', methods=['GET'])
def get_event_tags(event_id):
    """Get all tags for an event."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            SELECT t.*
            FROM tags t
            JOIN event_tags et ON t.id = et.tag_id
            WHERE et.event_id = ?
            ORDER BY t.name
        ''', (event_id,))
        
        tags = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(tags)
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@tag_bp.route('/api/events/<int:event_id>/tags', methods=['POST'])
def add_event_tags(event_id):
    """Add tags to an event."""
    data = request.json
    if not data.get('tags'):
        return jsonify({'error': 'Tags are required'}), 400
        
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Start transaction
        cursor.execute('BEGIN TRANSACTION')
        
        # Get existing tags for this event
        cursor.execute('SELECT tag_id FROM event_tags WHERE event_id = ?', (event_id,))
        existing_tag_ids = {row['tag_id'] for row in cursor.fetchall()}
        
        # Add new tags
        added_tags = []
        for tag_name in data['tags']:
            # Get or create the tag
            cursor.execute('SELECT id FROM tags WHERE name = ?', (tag_name.lower(),))
            result = cursor.fetchone()
            
            if result:
                tag_id = result['id']
            else:
                # Create new tag if it doesn't exist
                cursor.execute(
                    'INSERT INTO tags (name, created_at) VALUES (?, ?)',
                    (tag_name.lower(), datetime.now())
                )
                tag_id = cursor.lastrowid
            
            # Add tag to event if not already tagged
            if tag_id not in existing_tag_ids:
                cursor.execute(
                    'INSERT INTO event_tags (event_id, tag_id) VALUES (?, ?)',
                    (event_id, tag_id)
                )
                added_tags.append(tag_name.lower())
        
        conn.commit()
        conn.close()
        return jsonify({'message': f'Added tags: {", ".join(added_tags)}'}), 201
        
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'error': str(e)}), 500

@tag_bp.route('/api/events/<int:event_id>/tags/<int:tag_id>', methods=['DELETE'])
def remove_event_tag(event_id, tag_id):
    """Remove a tag from an event."""
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute(
            'DELETE FROM event_tags WHERE event_id = ? AND tag_id = ?',
            (event_id, tag_id)
        )
        conn.commit()
        conn.close()
        return '', 204
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500