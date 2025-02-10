from typing import Dict, List, Optional
from bs4 import BeautifulSoup
import logging
from .base_scraper import BaseScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TridentScraper(BaseScraper):
    def __init__(self):
        super().__init__("Trident")
        self.base_url = "https://tridentcafe.com/events/"

    def scrape(self) -> List[Dict]:
        """Scrape events from Trident Café."""
        events = []
        soup = self.get_soup(self.base_url)
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

                # Create event dictionary
                event = {
                    'title': title_elem.text.strip() if title_elem else '',
                    'date': date_elem.text.strip() if date_elem else '',
                    'time': '',  # Time is included in description for Trident events
                    'description': article.find('div', {'class': 'eventlist-description'}).text.strip() if article.find('div', {'class': 'eventlist-description'}) else '',
                    'location': 'Trident Café, Boulder',  # Default location
                    'url': 'https://tridentcafe.com' + url_elem['href'] if url_elem else '',
                    'source_id': url_elem['href'].split('/')[-1] if url_elem else 'events'
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
