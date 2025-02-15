from typing import Dict, List, Optional
import logging
import re
from .base_scraper import BaseScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TridentScraper(BaseScraper):
    def __init__(self):
        super().__init__("Trident")
        self.base_url = "https://tridentcafe.com/events/"

    async def scrape(self) -> List[Dict]:
        """Scrape events from Trident Café using headless browser."""
        events = []
        
        # Try with regular HTTP request first
        soup = await self.get_page_content(self.base_url)
        if not soup:
            logger.warning("Regular HTTP request failed, trying with headless browser")
            soup = await self.get_page_content(self.base_url, use_browser=True)
            
        if not soup:
            logger.error("Failed to fetch Trident events page")
            return events

        # Find all event articles
        articles = soup.find_all('article', {'class': 'eventlist-event'})
        logger.info(f"Found {len(articles)} event articles")

        for article in articles:
            try:
                # Extract event details
                title_elem = article.find('h1', {'class': 'eventlist-title'})
                date_elem = article.find('time', {'class': 'event-date'})
                url_elem = article.find('a', {'class': 'eventlist-title-link'})
                desc_elem = article.find('div', {'class': 'eventlist-description'})
                
                # Get time from description if available
                time = ''
                if desc_elem:
                    desc_text = desc_elem.text.strip()
                    # Look for time patterns in description
                    time_pattern = r'\b(?:1[0-2]|0?[1-9])(?::[0-5][0-9])?\s*(?:AM|PM|am|pm)\b'
                    time_match = re.search(time_pattern, desc_text)
                    if time_match:
                        time = time_match.group()

                # Create event dictionary
                event = {
                    'title': title_elem.text.strip() if title_elem else '',
                    'date': date_elem.text.strip() if date_elem else '',
                    'time': time,
                    'description': desc_text if desc_elem else '',
                    'location': 'Trident Café, 940 Pearl St, Boulder, CO 80302',  # Full address
                    'url': 'https://tridentcafe.com' + url_elem['href'] if url_elem else '',
                    'source_id': url_elem['href'].split('/')[-1] if url_elem else None
                }
                
                # Log the raw event data
                logger.info(f"Raw event data: {event}")
                
                # Format and validate the event
                formatted_event = self.format_event(event)
                if formatted_event['date']:  # Only add events with valid dates
                    events.append(formatted_event)
                else:
                    logger.warning(f"Skipping event due to invalid date: {event['title']}")
                    
            except Exception as e:
                logger.error(f"Error parsing event: {str(e)}")
                continue

        logger.info(f"Successfully scraped {len(events)} events from Trident")
        return events

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close_browser()
