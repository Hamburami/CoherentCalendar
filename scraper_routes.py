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


@scraper_bp.route('/scrape/interpret', methods=['POST'])
def aiinterpret() -> Dict[str, Any]:
    """Interpret scraped text using AI to extract event information."""
    try:
        data = request.get_json()
        text = data.get('text')
        
        logger.info(f"Received text for interpretation: {text[:100]}...")
        
        if not text:
            return jsonify({'error': 'Text is required', 'events': []})

        # Extract events using regular expressions and text analysis
        events = []
        
        # Look for event patterns in the text
        # Common date formats: YYYY-MM-DD, MM/DD/YYYY, Month DD, YYYY
        date_patterns = [
            (r'(\d{4}-\d{2}-\d{2})', lambda x: x),  # YYYY-MM-DD (keep as is)
            (r'(\d{1,2})/(\d{1,2})/(\d{4})', lambda m: f"{m[2]}-{m[0]:02d}-{m[1]:02d}"),  # MM/DD/YYYY to YYYY-MM-DD
            (r'(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})', 
             lambda m: f"{m[2]}-{month_to_num[m[0]]}-{int(m[1]):02d}")  # Month DD, YYYY to YYYY-MM-DD
        ]
        
        # Month name to number mapping
        month_to_num = {
            'January': '01', 'February': '02', 'March': '03', 'April': '04',
            'May': '05', 'June': '06', 'July': '07', 'August': '08',
            'September': '09', 'October': '10', 'November': '11', 'December': '12'
        }
        
        # Time patterns: HH:MM AM/PM or military time
        time_pattern = r'(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?'
        
        # Split text into potential event blocks
        blocks = text.split('\n\n')
        for block in blocks:
            # Skip empty blocks
            if not block.strip():
                continue
            
            # Try to find a date
            date = None
            for pattern, formatter in date_patterns:
                matches = re.search(pattern, block)
                if matches:
                    try:
                        if len(matches.groups()) == 1:
                            date = formatter(matches.group(1))
                        else:
                            date = formatter(matches.groups())
                        break
                    except Exception as e:
                        logger.error(f"Error formatting date: {e}")
                        continue
            
            # Skip if no date found
            if not date:
                logger.debug(f"No date found in block: {block[:50]}...")
                continue
            
            # Find time
            time_match = re.search(time_pattern, block)
            time = None
            if time_match:
                hour, minute, meridian = time_match.groups()
                hour = int(hour)
                if meridian and meridian.lower() == 'pm' and hour < 12:
                    hour += 12
                elif meridian and meridian.lower() == 'am' and hour == 12:
                    hour = 0
                time = f"{hour:02d}:{minute}"
            
            # Get title (first non-empty line)
            lines = block.split('\n')
            title = next((line.strip() for line in lines if line.strip()), 'Untitled Event')
            
            # Get description (remaining text)
            description = '\n'.join(line.strip() for line in lines[1:] if line.strip())
            
            # Create event object
            event = {
                'title': title,
                'date': date,
                'time': time,
                'location': 'Trident Cafe',  # Default for Trident events
                'description': description,
                'url': None,
                'source': 'trident',
                'source_id': None,
                'needs_review': True
            }
            
            logger.info(f"Found event: {event}")
            events.append(event)
        
        logger.info(f"Found {len(events)} events")
        return jsonify({
            'events': events,
            'error': None
        })
        
    except Exception as e:
        logger.error(f"Error in AI interpretation: {str(e)}")
        return jsonify({'error': str(e), 'events': []})


@scraper_bp.route('/scrape/eventsql', methods=['POST'])
def eventsql() -> Dict[str, Any]:
    """Convert interpreted event information to SQL commands."""
    try:
        data = request.get_json()
        events = data.get('events', [])
        
        logger.info(f"Converting {len(events)} events to SQL")
        
        if not events:
            return jsonify({'error': 'No events provided', 'sql': None})

        # Generate SQL for each event
        sql_commands = []
        for event in events:
            if not isinstance(event, dict):
                logger.warning(f"Skipping non-dict event: {event}")
                continue
                
            # Skip events without required fields
            if not event.get('date'):
                logger.warning(f"Skipping event without date: {event}")
                continue

            try:
                # Clean and escape values - ensure all strings are properly quoted
                title = "'{}'".format(event.get('title', 'Untitled Event').replace("'", "''"))
                date = "'{}'".format(event.get('date'))  # We know this exists because we checked above
                time = "'{}'".format(event.get('time')) if event.get('time') else 'NULL'
                location = "'{}'".format(event.get('location', '').replace("'", "''")) if event.get('location') else 'NULL'
                description = "'{}'".format(event.get('description', '').replace("'", "''")) if event.get('description') else 'NULL'
                url = "'{}'".format(event.get('url', '').replace("'", "''")) if event.get('url') else 'NULL'
                needs_review = '1'  # Set to need review by default
                source = "'{}'".format(event.get('source', '').replace("'", "''"))
                source_id = "'{}'".format(event.get('source_id', '').replace("'", "''")) if event.get('source_id') else 'NULL'
                
                # Build the SQL command with all values properly quoted
                sql = """INSERT INTO events (title, date, time, location, description, url, needs_review, source, source_id) VALUES ({}, {}, {}, {}, {}, {}, {}, {}, {});""".format(title, date, time, location, description, url, needs_review, source, source_id)
                logger.info(f"Generated SQL: {sql}")
                sql_commands.append(sql)
            except Exception as e:
                logger.error(f"Error generating SQL for event {event}: {str(e)}")
                continue
            
        if not sql_commands:
            return jsonify({'error': 'No valid events could be converted to SQL', 'sql': None})
            
        # Join all commands with newlines
        final_sql = '\n'.join(sql_commands)
        logger.info(f"Final SQL commands: {final_sql}")
        
        return jsonify({
            'sql': final_sql,
            'error': None
        })
        
    except Exception as e:
        logger.error(f"Error in SQL generation: {str(e)}")
        return jsonify({'error': str(e), 'sql': None})


@scraper_bp.route('/scrape/executesql', methods=['POST'])
def executesql() -> Dict[str, Any]:
    """Execute generated SQL commands on the events database."""
    try:
        data = request.get_json()
        sql = data.get('sql')
        
        logger.info("Executing SQL commands")
        
        if not sql:
            return jsonify({'error': 'SQL is required', 'success': False})
        
        # Get database path and ensure it exists
        db_path = os.path.join(os.path.dirname(__file__), 'database', 'database.db')
        if not os.path.exists(os.path.dirname(db_path)):
            os.makedirs(os.path.dirname(db_path))
        if not os.path.exists(db_path):
            logger.info("Database does not exist, initializing...")
            init_db()
        
        logger.info(f"Using database at: {db_path}")
        
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Execute each command
        success_count = 0
        errors = []
        
        try:
            # Execute the SQL directly
            logger.info(f"Executing SQL: {sql}")
            cursor.executescript(sql)
            conn.commit()
            
            # Check if any rows were affected
            cursor.execute("SELECT changes()")
            changes = cursor.fetchone()[0]
            logger.info(f"SQL execution affected {changes} rows")
            
            success_count = changes
        except sqlite3.Error as e:
            error_msg = str(e)
            logger.error(f"SQL Error: {error_msg}")
            errors.append(error_msg)
            
        conn.close()
            
        if success_count > 0:
            logger.info("SQL execution successful")
            return jsonify({
                'success': True,
                'message': f'Successfully added {success_count} events',
                'errors': errors if errors else None
            })
        else:
            logger.warning("SQL execution completed but no rows were affected")
            return jsonify({
                'success': False,
                'message': 'No events were added',
                'errors': errors if errors else ['No rows were affected']
            })
            
    except Exception as e:
        logger.error(f"Error in SQL execution: {str(e)}")
        return jsonify({
            'success': False,
            'message': 'Error executing SQL',
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