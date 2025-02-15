from typing import Dict, List, Optional
from bs4 import BeautifulSoup
import logging
from scrapers.base_scraper import BaseScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class EventbriteScraper(BaseScraper):
    def __init__(self):
        super().__init__("Eventbrite")
        self.base_url = "https://www.eventbrite.com/d/co--boulder/all-events/"

    def scrape(self) -> List[Dict]:
        """Scrape events from Eventbrite."""
        events = []
        soup = self.get_soup(self.base_url)
        if not soup:
            logger.error("Failed to fetch Eventbrite events page")
            return events

        # Find all event cards
        event_cards = soup.find_all('div', {'class': 'eds-event-card-content'})
        logger.info(f"Found {len(event_cards)} event cards")

        for card in event_cards:
            try:
                # Extract event details
                title_elem = card.find('div', {'class': 'eds-event-card__formatted-name--is-clamped'})
                date_elem = card.find('div', {'class': 'eds-event-card-content__sub-title'})
                location_elem = card.find('div', {'data-subcategory': 'location'})
                url_elem = card.find_parent('a')

                # Skip if missing required elements
                if not all([title_elem, date_elem, url_elem]):
                    continue

                # Extract and parse date/time
                date_str = date_elem.text.strip()
                date_time = self._parse_eventbrite_datetime(date_str)
                
                if not date_time:
                    logger.warning(f"Could not parse date from: {date_str}")
                    continue

                # Create event dictionary
                event = {
                    'title': title_elem.text.strip(),
                    'date': date_time['date'],
                    'time': date_time['time'],
                    'location': location_elem.text.strip() if location_elem else 'Boulder, CO',
                    'description': self._extract_description(card),
                    'url': url_elem['href'] if url_elem else '',
                    'source_id': url_elem['href'].split('/')[-1] if url_elem else ''
                }
                
                # Format and validate the event
                formatted_event = self.format_event(event)
                if formatted_event['date']:  # Only add events with valid dates
                    events.append(formatted_event)
                
            except Exception as e:
                logger.error(f"Error parsing event: {str(e)}")
                continue

        logger.info(f"Successfully scraped {len(events)} events from Eventbrite")
        return events