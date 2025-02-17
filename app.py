from flask import Flask, render_template, jsonify, send_from_directory, request
import sqlite3
from datetime import datetime
import os
import sys
import bcrypt
import jwt
from scrapers.scraper_manager import ScraperManager


# Add the current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def create_app(test_config=None):
    app = Flask(__name__, static_url_path='', static_folder='static')
    
    if test_config is None:
        app.config.from_mapping(
            SECRET_KEY=os.environ.get('SECRET_KEY', 'dev'),
            DATABASE=os.path.join(app.instance_path, 'database.db'),
        )
    else:
        app.config.update(test_config)

    # Ensure instance folder exists
    try:
        os.makedirs(app.instance_path)
    except OSError:
        pass

    # Initialize database
    with app.app_context():
        init_db()
    
    # Register blueprints
    from scraper_routes import scraper_bp
    from user_routes import user_bp
    from tag_routes import tag_bp
    app.register_blueprint(user_bp)
    app.register_blueprint(scraper_bp)
    app.register_blueprint(tag_bp)

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
        
        is_admin = request.args.get('admin', 'false').lower() == 'true'
        
        if is_admin:
            cursor.execute(
                "SELECT * FROM events WHERE date >= ? AND date < ?",
                (start_date, end_date)
            )
        else:
            cursor.execute(
                "SELECT * FROM events WHERE date >= ? AND date < ? AND needs_review = 0",
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
                'url': row['url'],
                'needs_review': bool(row['needs_review']),
                'source': row['source'],
                'source_id': row['source_id']
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
                INSERT INTO events (title, date, time, location, description, url, needs_review, source, source_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                data['title'],
                data['date'],
                data.get('time', ''),
                data.get('location', ''),
                data.get('description', ''),
                data.get('url', ''),
                1,
                'manual',
                None
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
                'description': event['description'],
                'url': event['url'],
                'needs_review': bool(event['needs_review']),
                'source': event['source'],
                'source_id': event['source_id']
            }), 201
            
        except Exception as e:
            conn.close()
            print('Error adding event:', str(e))  
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
            # Get the current event to preserve its needs_review status
            cursor.execute('SELECT * FROM events WHERE id = ?', (event_id,))
            event = cursor.fetchone()
            
            if not event:
                conn.close()
                return jsonify({'error': 'Event not found'}), 404
            
            cursor.execute('''
                UPDATE events 
                SET title = ?, date = ?, time = ?, location = ?, description = ?, url = ?
                WHERE id = ?
            ''', (
                data['title'],
                data['date'],
                data.get('time'),
                data.get('location'),
                data.get('description'),
                data.get('url'),
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
                'description': updated_event['description'],
                'url': updated_event['url'],
                'needs_review': bool(updated_event['needs_review']),
                'source': updated_event['source'],
                'source_id': updated_event['source_id']
            })
            
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/events/<int:event_id>/approve', methods=['POST'])
    def approve_event(event_id):
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            cursor.execute('UPDATE events SET needs_review = 0 WHERE id = ?', (event_id,))
            conn.commit()
            conn.close()
            return '', 204
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/events/<int:event_id>/flag', methods=['POST'])
    def flag_event(event_id):
        conn = get_db()
        cursor = conn.cursor()
        
        try:
            cursor.execute('UPDATE events SET needs_review = 1 WHERE id = ?', (event_id,))
            conn.commit()
            conn.close()
            return '', 204
        except Exception as e:
            conn.close()
            return jsonify({'error': str(e)}), 500

    @app.route('/api/scrape', methods=['POST'])
    def trigger_scrape():
        """Manually trigger scraping of Trident events."""
        try:
            db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
            scraper_manager = ScraperManager(db_path)
            event_count = scraper_manager.run_scrapers()
            return jsonify({
                'message': f'Successfully scraped {event_count} events',
                'event_count': event_count
            })
        except Exception as e:
            app.logger.error(f'Error during scraping: {str(e)}')
            return jsonify({
                'error': 'Failed to scrape events',
                'details': str(e)
            }), 500

    return app

def init_db():
    try:
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
        schema_path = os.path.join(os.path.dirname(__file__), 'database', 'schema.sql')
        
        print(f"Database path: {db_path}")
        print(f"Schema path: {schema_path}")
        
        # Ensure database directory exists
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        
        # Read schema from file
        print("Reading schema file...")
        with open(schema_path, 'r') as f:
            schema = f.read()
        print("Schema file read successfully")
        
        # Initialize database with schema
        print("Initializing database...")
        conn = sqlite3.connect(db_path)
        conn.executescript(schema)
        conn.commit()
        conn.close()
        print("Database initialized successfully")
        
        return db_path
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        raise

def get_db():
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn






if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=8000, debug=True)
