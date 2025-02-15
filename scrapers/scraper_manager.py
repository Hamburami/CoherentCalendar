import sqlite3
import sys
import os
import logging
from typing import List, Dict
from .eventbrite_scraper import EventbriteScraper  # Corrected relative import

class ScraperManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)
        self.eventbrite_scraper = EventbriteScraper()

    def run_scrapers(self) -> int:
        """Run the scraper and store events in the database."""
        total_events = 0
        
        # Scrape Eventbrite events
        eventbrite_events = self.eventbrite_scraper.scrape()
        if eventbrite_events:
            self._store_events(eventbrite_events)
            total_events += len(eventbrite_events)
        
        return total_events

    def _store_events(self, events: List[Dict]) -> None:
        """Store events in the database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            for event in events:
                # Check if event already exists
                cursor.execute("""
                    SELECT id FROM events 
                    WHERE title = ? AND date = ? AND source = ?
                """, (event['title'], event['date'], event['source']))
                
                if not cursor.fetchone():
                    cursor.execute("""
                        INSERT INTO events (
                            title, date, time, location, description,
                            url, needs_review, source, source_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        event['title'], event['date'], event['time'],
                        event['location'], event['description'], event['url'],
                        event.get('needs_review', False), event['source'], event['source_id']
                    ))
            
            conn.commit()
        except Exception as e:
            self.logger.error(f"Error storing events: {e}")
            conn.rollback()
        finally:
            conn.close()