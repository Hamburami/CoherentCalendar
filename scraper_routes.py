from flask import Blueprint, request, jsonify
from typing import Dict, Any, Optional
import logging
import asyncio
import re
import json
from scrapers.base_scraper import BaseScraper
import requests
import sqlite3
import os

# Set up logging
logger = logging.getLogger(__name__)

scraper_bp = Blueprint('scraper', __name__)

@scraper_bp.route('/scrape', methods=['POST'])
def scrape() -> Dict[str, Any]:
    """Scrape content from a provided URL, focusing on extracting potentially relevant text."""
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required', 'text': None})

        class URLScraper(BaseScraper):
            def __init__(self, url):
                super().__init__("URL Scraper")
                self.base_url = url

            async def scrape(self):
                """Extract text content that might contain event information."""
                # Try with regular HTTP request first
                soup = await self.get_page_content(self.base_url)
                if not soup:
                    logger.warning("Regular HTTP request failed, trying with headless browser")
                    soup = await self.get_page_content(self.base_url, use_browser=True)
                
                if not soup:
                    logger.error(f"Failed to fetch content from {self.base_url}")
                    return {"error": "Failed to fetch content", "text": None}

                # Look for common event container patterns
                relevant_content = []
                
                # Common class/id patterns for event-related content
                patterns = [
                    r'event',
                    r'calendar',
                    r'schedule',
                    r'program',
                    r'listing',
                    r'upcoming',
                    r'what\'s-on',
                    r'whats-on',
                ]
                
                # First try to find specific event containers
                event_elements = []
                for pattern in patterns:
                    elements = soup.find_all(class_=lambda x: x and re.search(pattern, x, re.I))
                    event_elements.extend(elements)
                    
                    # Also check IDs
                    elements = soup.find_all(id=lambda x: x and re.search(pattern, x, re.I))
                    event_elements.extend(elements)

                if event_elements:
                    # If we found event-specific elements, extract their text
                    for element in event_elements:
                        # Clean up the text
                        text = self.clean_text(element.get_text(separator=' ', strip=True))
                        if text and len(text) > 50:  # Ignore very short snippets
                            relevant_content.append(text)
                else:
                    # If no event-specific elements found, fall back to main content areas
                    main_content = soup.find(['main', 'article']) or soup.find(class_=['content', 'main'])
                    if main_content:
                        text = self.clean_text(main_content.get_text(separator=' ', strip=True))
                        relevant_content.append(text)
                    else:
                        # Last resort: get body text but try to exclude navigation, footer, etc.
                        for element in soup.find_all(['p', 'div', 'section']):
                            if not element.find_parent(['nav', 'footer', 'header']):
                                text = self.clean_text(element.get_text(separator=' ', strip=True))
                                if text and len(text) > 50:
                                    relevant_content.append(text)

                # Join the content, but keep some separation for readability
                combined_text = "\n\n".join(relevant_content)
                
                return {
                    "text": combined_text,
                    "url": self.base_url,
                    "error": None
                }

        async def run_scraper():
            async with URLScraper(url) as scraper:
                return await scraper.scrape()

        # Run the scraper
        result = asyncio.run(run_scraper())
        
        if result["error"]:
            return jsonify({
                "error": result["error"],
                "text": None,
                "url": url
            })
            
        return jsonify({
            "error": None,
            "text": result["text"],
            "url": url
        })
        
    except Exception as e:
        logger.error(f"Error in scrape endpoint: {str(e)}")
        return jsonify({
            "error": str(e),
            "text": None,
            "url": url
        })


@scraper_bp.route('/aiinterpret', methods=['POST'])
def aiinterpret() -> Dict[str, Any]:
    """Interpret scraped text using AI to extract event information."""
    try:
        data = request.get_json()
        text = data.get('text')
        
        if not text:
            return jsonify({'error': 'Text is required', 'text': None})

        # Gemini API configuration
        api_key = "AIzaSyAAbOmW8AmDJiP6CEIGNGcQbONKm9pc1vY"
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
        
        # Define the prompt directly
        prompt = '''Extract events from the provided text and output VALID JSON that exactly matches this format:
{
    "events": [
        {
            "title": "Event Title",
            "date": "2025-02-17",  # REQUIRED! Format: YYYY-MM-DD. If no date found, skip the event
            "time": "14:00",       # Optional, format: HH:MM in 24-hour time
            "location": "Location", # Optional
            "description": "Description",  # Optional
            "url": null,           # Optional
            "status": "pending"    # Always "pending"
        }
    ]
}

IMPORTANT:
1. The date field is REQUIRED. Skip any events without a clear date.
2. Format dates as YYYY-MM-DD (e.g., 2025-02-17)
3. Format times as HH:MM in 24-hour format (e.g., 14:00)
4. Remove any duplicate events
5. Use null for missing optional values
6. Ensure proper JSON formatting:
   - Double quotes around property names and string values
   - No trailing commas
   - No comments in the actual output'''
        
        # Make the API request
        response = requests.post(
            url,
            headers={'Content-Type': 'application/json'},
            json={
                "contents": [{
                    "parts": [{
                        "text": f"{prompt}\n\nText to analyze:\n{text}"
                    }]
                }]
            }
        )
        
        if response.status_code != 200:
            return jsonify({'error': f'Gemini API error: {response.status_code}', 'text': None})
            
        # Return exactly what the AI gave us
        generated_text = response.json()['candidates'][0]['content']['parts'][0]['text']
        return jsonify({'text': generated_text, 'error': None})
            
    except Exception as e:
        return jsonify({'error': str(e), 'text': None})

@scraper_bp.route('/eventsql', methods=['POST'])
def eventsql() -> Dict[str, Any]:
    """Convert interpreted event information to SQL commands."""
    try:
        data = request.get_json()
        text = data.get('text', '')
        
        if not text or not isinstance(text, str):
            return jsonify({'error': 'Text is required and must be a string', 'sql': None})

        # Try to extract valid events even from malformed JSON
        events = []
        try:
            # First try parsing as-is
            data = json.loads(text)
            if isinstance(data, dict) and 'events' in data:
                events = data['events']
        except json.JSONDecodeError:
            # If that fails, try to extract individual event objects
            import re
            # Find all JSON-like objects
            event_pattern = r'{[^{}]*"title"[^{}]*}'
            matches = re.finditer(event_pattern, text)
            for match in matches:
                try:
                    event = json.loads(match.group())
                    if isinstance(event, dict) and 'title' in event:
                        events.append(event)
                except:
                    continue

        if not events:
            return jsonify({'error': 'No valid events found in the text', 'sql': None})

        # Generate SQL for each event
        sql_commands = []
        for event in events:
            if not isinstance(event, dict):
                continue
                
            # Skip events without required fields
            if not event.get('date'):
                continue

            try:
                # Clean and escape values - ensure all strings are properly quoted
                title = f"'{event.get('title', 'Untitled Event').replace('\'', '\'\'')}'"
                date = f"'{event.get('date')}'"  # We know this exists because we checked above
                time = f"'{event.get('time')}'" if event.get('time') else 'NULL'
                location = f"'{event.get('location', '').replace('\'', '\'\'')}'" if event.get('location') else 'NULL'
                description = f"'{event.get('description', '').replace('\'', '\'\'')}'" if event.get('description') else 'NULL'
                url = f"'{event.get('url', '').replace('\'', '\'\'')}'" if event.get('url') else 'NULL'
                needs_review = '0'  # Set to not need review
                source = "'scraper'"
                source_id = 'NULL'
                
                # Build the SQL command with all values properly quoted
                sql = f"""INSERT INTO events (title, date, time, location, description, url, needs_review, source, source_id) VALUES ({title}, {date}, {time}, {location}, {description}, {url}, {needs_review}, {source}, {source_id});"""
                sql_commands.append(sql)
            except:
                # Skip any events that cause errors
                continue
            
        if not sql_commands:
            return jsonify({'error': 'No valid events could be converted to SQL', 'sql': None})
            
        # Join commands and return
        final_sql = '\n'.join(sql_commands)
        print(f"Generated SQL: {final_sql}")  # Debug log
        return jsonify({'sql': final_sql, 'error': None})
            
    except Exception as e:
        import traceback
        print("Error in eventsql:", str(e))
        print("Traceback:", traceback.format_exc())
        return jsonify({'error': str(e), 'sql': None})


@scraper_bp.route('/executesql', methods=['POST'])
def executesql() -> Dict[str, Any]:
    """Execute generated SQL commands on the events database."""
    try:
        data = request.get_json()
        sql = data.get('sql', '')
        
        # Get database path and ensure it exists
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
        if not os.path.exists(db_path):
            init_db()
        
        print(f"Using database at: {db_path}")  # Debug log
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Execute each command
        success_count = 0
        errors = []
        
        try:
            # Execute the SQL directly, just like sqlite3 command line
            cursor.executescript(sql)
            conn.commit()
            success_count = 1  # If we got here, it worked
        except sqlite3.Error as e:
            errors.append(str(e))
            
        conn.close()
            
        if success_count > 0:
            return jsonify({
                'success': True,
                'message': 'Events added successfully',
                'error': None
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Failed to add events',
                'error': '; '.join(errors)
            })
        
    except Exception as e:
        print(f"Error in executesql: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Failed to execute SQL',
            'error': str(e)
        })

def get_db():
    """Get a connection to the SQLite database."""
    # Get the absolute path to the database
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
    
    # Initialize database if it doesn't exist
    if not os.path.exists(db_path):
        init_db()
        
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize the database with schema."""
    db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
    schema_path = os.path.join(os.path.dirname(__file__), 'database', 'schema.sql')
    
    # Ensure database directory exists
    os.makedirs(os.path.dirname(db_path), exist_ok=True)
    
    # Read schema from file
    with open(schema_path, 'r') as f:
        schema = f.read()
    
    # Initialize database with schema
    conn = sqlite3.connect(db_path)
    conn.executescript(schema)
    conn.commit()
    conn.close()