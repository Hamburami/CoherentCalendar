# dairy_scraper.py
from typing import Dict, List, Optional
import logging
import re
from datetime import datetime
from .base_scraper import BaseScraper

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DairyScraper(BaseScraper):
    def __init__(self):
        super().__init__("Dairy Arts Center")
        self.base_url = "https://thedairy.org/events/"

    async def scrape(self) -> List[Dict]:
        """Scrape events from The Dairy Arts Center."""
        events = []
        
        try:
            # We need to use the browser for this site due to dynamic content
            soup = await self.get_page_content(self.base_url, use_browser=True)
            if not soup:
                logger.error("Failed to fetch Dairy Arts Center events page")
                return events

            # The events are loaded into cards with class 'eventCard'
            event_cards = soup.find_all('div', {'class': 'eventCard'})
            logger.info(f"Found {len(event_cards)} event cards")

            for card in event_cards:
                try:
                    # Extract event details
                    title_elem = card.find('h2', {'class': 'event-title'})
                    date_elem = card.find('span', {'class': 'event-date'})
                    time_elem = card.find('span', {'class': 'event-time'})
                    desc_elem = card.find('div', {'class': 'event-description'})
                    url_elem = card.find('a', {'class': 'event-link'})

                    if not title_elem or not date_elem:
                        logger.warning("Skipping event card - missing required elements")
                        continue

                    # Some events might have multiple dates
                    dates = self._extract_dates(date_elem.text.strip())
                    
                    for date in dates:
                        event = {
                            'title': title_elem.text.strip(),
                            'date': date,
                            'time': time_elem.text.strip() if time_elem else '',
                            'description': desc_elem.text.strip() if desc_elem else '',
                            'location': 'Dairy Arts Center, 2590 Walnut Street, Boulder, CO 80302',
                            'url': url_elem['href'] if url_elem else self.base_url,
                            'source_id': self._generate_source_id(url_elem['href'] if url_elem else '', date)
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
                    logger.error(f"Error parsing event card: {str(e)}")
                    continue

            logger.info(f"Successfully scraped {len(events)} events from Dairy Arts Center")
            
        except Exception as e:
            logger.error(f"Error during Dairy Arts Center scraping: {str(e)}")
            
        return events

    def _extract_dates(self, date_text: str) -> List[str]:
        """Extract multiple dates from date text."""
        dates = []
        
        # Common date patterns at The Dairy
        patterns = [
            r'(\w+ \d{1,2}(?:st|nd|rd|th)?,? \d{4})',  # March 15th, 2024
            r'(\d{1,2}/\d{1,2}/\d{4})',                 # 3/15/2024
            r'(\w+ \d{1,2}(?:st|nd|rd|th)?)',          # March 15th (current year)
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, date_text)
            if matches:
                for match in matches:
                    # If year is not in the date, add current year
                    if not re.search(r'\d{4}', match):
                        match = f"{match}, {datetime.now().year}"
                    
                    parsed_date = self.parse_date(match)
                    if parsed_date:
                        dates.append(parsed_date)
                break  # Stop after first successful pattern match
        
        # If no dates found, log the problematic text
        if not dates:
            logger.warning(f"Could not extract dates from: {date_text}")
        
        return dates

    def _generate_source_id(self, url: str, date: str) -> str:
        """Generate a unique source ID for the event."""
        # Extract event ID from URL if possible
        event_id = re.search(r'/event/(\d+)', url)
        if event_id:
            return f"{event_id.group(1)}_{date}"
        
        # Fallback to URL hash
        return f"{hash(url)}_{date}"

    async def __aenter__(self):
        """Async context manager entry."""
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close_browser()