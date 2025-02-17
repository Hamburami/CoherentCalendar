from flask import Blueprint, request, jsonify
import sqlite3
from datetime import datetime

tag_bp = Blueprint('tags', __name__)

def get_db():
    conn = sqlite3.connect('database/database.db')
    conn.row_factory = sqlite3.Row
    return conn

@tag_bp.route('/api/tags', methods=['GET'])
def get_tags():
    """Get all tags, optionally filtered by category."""
    category = request.args.get('category')
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        if category:
            cursor.execute('SELECT * FROM tags WHERE category = ?', (category,))
        else:
            cursor.execute('SELECT * FROM tags ORDER BY category, name')
        
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
            'INSERT INTO tags (name, category) VALUES (?, ?)',
            (data['name'].lower(), data.get('category'))
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
            SELECT t.*, et.confidence
            FROM tags t
            JOIN event_tags et ON t.id = et.tag_id
            WHERE et.event_id = ?
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
        
        for tag_data in data['tags']:
            tag_id = tag_data.get('id')
            confidence = tag_data.get('confidence', 1.0)
            
            # Check if tag exists
            cursor.execute('SELECT id FROM tags WHERE id = ?', (tag_id,))
            if not cursor.fetchone():
                cursor.execute('ROLLBACK')
                conn.close()
                return jsonify({'error': f'Tag {tag_id} does not exist'}), 404
            
            # Add tag to event
            cursor.execute('''
                INSERT OR REPLACE INTO event_tags (event_id, tag_id, confidence)
                VALUES (?, ?, ?)
            ''', (event_id, tag_id, confidence))
        
        cursor.execute('COMMIT')
        
        # Get updated tags
        cursor.execute('''
            SELECT t.*, et.confidence
            FROM tags t
            JOIN event_tags et ON t.id = et.tag_id
            WHERE et.event_id = ?
        ''', (event_id,))
        
        tags = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(tags)
        
    except Exception as e:
        cursor.execute('ROLLBACK')
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