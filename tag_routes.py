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

def validate_event_tags(cursor, tag_ids):
    """Validate that the tag combination follows the defined constraints."""
    errors = []
    
    # Get category info for all tags
    cursor.execute('''
        SELECT t.id, t.name, tc.name as category_name, tc.id as category_id
        FROM tags t
        JOIN tag_categories tc ON t.category_id = tc.id
        WHERE t.id IN ({})
    '''.format(','.join('?' * len(tag_ids))), tag_ids)
    
    tags_by_category = {}
    for row in cursor.fetchall():
        if row['category_id'] not in tags_by_category:
            tags_by_category[row['category_id']] = []
        tags_by_category[row['category_id']].append(row)
    
    # Check constraints for each category
    cursor.execute('SELECT * FROM tag_constraints')
    for constraint in cursor.fetchall():
        category_id = constraint['category_id']
        tags_in_category = tags_by_category.get(category_id, [])
        count = len(tags_in_category)
        
        if constraint['required'] and count == 0:
            cursor.execute('SELECT name FROM tag_categories WHERE id = ?', (category_id,))
            category_name = cursor.fetchone()['name']
            errors.append(f"At least one {category_name} tag is required")
            
        if constraint['min_tags'] and count < constraint['min_tags']:
            cursor.execute('SELECT name FROM tag_categories WHERE id = ?', (category_id,))
            category_name = cursor.fetchone()['name']
            errors.append(f"At least {constraint['min_tags']} {category_name} tag(s) required")
            
        if constraint['max_tags'] and count > constraint['max_tags']:
            cursor.execute('SELECT name FROM tag_categories WHERE id = ?', (category_id,))
            category_name = cursor.fetchone()['name']
            errors.append(f"Maximum {constraint['max_tags']} {category_name} tag(s) allowed")
    
    # Check mutually exclusive tags
    cursor.execute('''
        SELECT t1.name as tag1_name, t2.name as tag2_name
        FROM tag_relationships tr
        JOIN tags t1 ON tr.tag1_id = t1.id
        JOIN tags t2 ON tr.tag2_id = t2.id
        WHERE tr.relationship_type = 'mutually_exclusive'
        AND t1.id IN ({0})
        AND t2.id IN ({0})
    '''.format(','.join('?' * len(tag_ids))), tag_ids * 2)
    
    for row in cursor.fetchall():
        errors.append(f"Tags '{row['tag1_name']}' and '{row['tag2_name']}' cannot be used together")
    
    return errors

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
        
        # Get tag IDs
        tag_ids = []
        for tag_name in data['tags']:
            cursor.execute('SELECT id FROM tags WHERE name = ?', (tag_name.lower(),))
            result = cursor.fetchone()
            if result:
                tag_ids.append(result['id'])
            else:
                return jsonify({'error': f"Tag '{tag_name}' not found"}), 404
        
        # Validate tags
        errors = validate_event_tags(cursor, tag_ids)
        if errors:
            return jsonify({'errors': errors}), 400
        
        # Get existing tags for this event
        cursor.execute('SELECT tag_id FROM event_tags WHERE event_id = ?', (event_id,))
        existing_tag_ids = {row['tag_id'] for row in cursor.fetchall()}
        
        # Add new tags
        added_tags = []
        for tag_id in tag_ids:
            if tag_id not in existing_tag_ids:
                cursor.execute(
                    'INSERT INTO event_tags (event_id, tag_id) VALUES (?, ?)',
                    (event_id, tag_id)
                )
                cursor.execute('SELECT name FROM tags WHERE id = ?', (tag_id,))
                added_tags.append(cursor.fetchone()['name'])
        
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