import sqlite3
import logging
import asyncio
from typing import List, Dict
from .trident_scraper import TridentScraper
from .dairy_scraper import DairyScraper
class ScraperManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self.logger = logging.getLogger(__name__)

    def run_scrapers(self) -> int:
        """Run scrapers and store events in the database."""
        return asyncio.run(self._run_scrapers_async())

    async def _run_scrapers_async(self) -> int:
        """Asynchronously run scrapers and store events."""
        total_events = 0
        
        # Run Trident scraper
        async with TridentScraper() as trident_scraper:
            try:
                events = await trident_scraper.scrape()
                if events:
                    self._store_events(events)
                    total_events += len(events)
                    self.logger.info(f"Successfully stored {len(events)} events from Trident")
            except Exception as e:
                self.logger.error(f"Error running Trident scraper: {str(e)}")
        
        # Run Dairy Arts Center scraper
        async with DairyScraper() as dairy_scraper:
            try:
                events = await dairy_scraper.scrape()
                if events:
                    self._store_events(events)
                    total_events += len(events)
                    self.logger.info(f"Successfully stored {len(events)} events from Dairy Arts Center")
            except Exception as e:
                self.logger.error(f"Error running Dairy Arts Center scraper: {str(e)}")
        
        return total_events
        
    
    def _store_events(self, events: List[Dict]) -> None:
        """Store events in the database with duplicate detection."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            for event in events:
                # Check if event already exists using multiple criteria
                cursor.execute("""
                    SELECT id FROM events 
                    WHERE (title = ? AND date = ? AND source = ?)
                    OR (source = ? AND source_id = ? AND source_id IS NOT NULL)
                """, (
                    event['title'], 
                    event['date'], 
                    event['source'],
                    event['source'],
                    event['source_id']
                ))
                
                existing_event = cursor.fetchone()
                
                if existing_event:
                    # Update existing event if needed
                    cursor.execute("""
                        UPDATE events 
                        SET time = ?,
                            location = ?,
                            description = ?,
                            url = ?,
                            needs_review = ?,
                            source_id = ?
                        WHERE id = ?
                    """, (
                        event['time'],
                        event['location'],
                        event['description'],
                        event['url'],
                        event['needs_review'],
                        event['source_id'],
                        existing_event[0]
                    ))
                    self.logger.debug(f"Updated existing event: {event['title']}")
                else:
                    # Insert new event
                    cursor.execute("""
                        INSERT INTO events (
                            title, date, time, location, description,
                            url, needs_review, source, source_id
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        event['title'],
                        event['date'],
                        event['time'],
                        event['location'],
                        event['description'],
                        event['url'],
                        event['needs_review'],
                        event['source'],
                        event['source_id']
                    ))
                    self.logger.debug(f"Inserted new event: {event['title']}")
            
            conn.commit()
            
        except Exception as e:
            self.logger.error(f"Error storing events: {str(e)}")
            conn.rollback()
            raise
        finally:
            conn.close()

    async def cleanup(self):
        """Clean up old events from the database."""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Remove events older than 30 days
            cursor.execute("""
                DELETE FROM events 
                WHERE date < date('now', '-30 days')
            """)
            
            removed_count = cursor.rowcount
            conn.commit()
            self.logger.info(f"Removed {removed_count} old events from database")
            
        except Exception as e:
            self.logger.error(f"Error cleaning up old events: {str(e)}")
            conn.rollback()
        finally:
            conn.close()