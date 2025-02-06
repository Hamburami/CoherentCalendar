from flask import Flask, render_template, jsonify, send_from_directory, request
import sqlite3
from datetime import datetime
import os

app = Flask(__name__, static_url_path='', static_folder='static')

def init_db():
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    conn = sqlite3.connect(db_path)
    c = conn.cursor()
    c.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            date DATE NOT NULL,
            time TIME,
            location TEXT,
            description TEXT,
            url TEXT
        )
    ''')
    conn.commit()
    conn.close()

def get_db():
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    app.logger.info('Serving index.html')
    return render_template('index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    app.logger.info(f'Serving static file: {path}')
    return send_from_directory('static', path)

@app.route('/api/events/<int:year>/<int:month>')
def get_events(year, month):
    start_date = f"{year}-{month:02d}-01"
    if month == 12:
        end_date = f"{year + 1}-01-01"
    else:
        end_date = f"{year}-{month + 1:02d}-01"
    
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute(
        "SELECT * FROM events WHERE date >= ? AND date < ?",
        (start_date, end_date)
    )
    
    events = []
    for row in cursor.fetchall():
        events.append({
            'id': row['id'],
            'title': row['title'],
            'date': row['date'],
            'time': row['time'],
            'location': row['location'],
            'description': row['description'],
            'url': row['url']
        })
    
    conn.close()
    return jsonify(events)

@app.route('/api/events', methods=['POST'])
def add_event():
    data = request.json
    
    # Validate required fields
    if not data.get('title') or not data.get('date'):
        return jsonify({'error': 'Title and date are required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO events (title, date, time, location, description)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            data['title'],
            data['date'],
            data.get('time'),
            data.get('location'),
            data.get('description')
        ))
        
        conn.commit()
        new_event_id = cursor.lastrowid
        
        # Fetch the newly created event
        cursor.execute('SELECT * FROM events WHERE id = ?', (new_event_id,))
        event = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            'id': event['id'],
            'title': event['title'],
            'date': event['date'],
            'time': event['time'],
            'location': event['location'],
            'description': event['description']
        }), 201
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
def delete_event(event_id):
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        # Check if event exists
        cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        
        if not event:
            conn.close()
            return jsonify({'error': 'Event not found'}), 404
        
        # Delete the event
        cursor.execute('DELETE FROM events WHERE id = ?', (event_id,))
        conn.commit()
        conn.close()
        
        return '', 204
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

@app.route('/api/events/<int:event_id>', methods=['PUT'])
def update_event(event_id):
    data = request.json
    
    if not data.get('title') or not data.get('date'):
        return jsonify({'error': 'Title and date are required'}), 400
    
    conn = get_db()
    cursor = conn.cursor()
    
    try:
        cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,))
        event = cursor.fetchone()
        
        if not event:
            conn.close()
            return jsonify({'error': 'Event not found'}), 404
        
        cursor.execute('''
            UPDATE events 
            SET title = ?, date = ?, time = ?, location = ?, description = ?
            WHERE id = ?
        ''', (
            data['title'],
            data['date'],
            data.get('time'),
            data.get('location'),
            data.get('description'),
            event_id
        ))
        
        conn.commit()
        
        cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,))
        updated_event = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            'id': updated_event['id'],
            'title': updated_event['title'],
            'date': updated_event['date'],
            'time': updated_event['time'],
            'location': updated_event['location'],
            'description': updated_event['description']
        })
        
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=8000)
