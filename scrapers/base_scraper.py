from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Union
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import logging
import re
import asyncio
from playwright.async_api import async_playwright, Browser, Page
import aiohttp

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseScraper(ABC):
    def __init__(self, source_name: str):
        self.source_name = source_name
        self.confidence_threshold = 0.7
        self._browser = None
        self._context = None
        
    async def __aenter__(self):
        """Set up async context for headless browser."""
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Clean up browser resources."""
        await self.close_browser()

    @abstractmethod
    async def scrape(self) -> List[Dict]:
        """Scrape events from the source. Must be implemented by each scraper."""
        pass

    def calculate_confidence(self, event: Dict) -> float:
        """Calculate confidence score for an event based on data completeness."""
        score = 0.0
        required_fields = ['title', 'date']
        optional_fields = ['time', 'location', 'description', 'url']
        
        # Check required fields
        for field in required_fields:
            if event.get(field):
                score += 0.4  # 80% of score from required fields
                
        # Check optional fields
        for field in optional_fields:
            if event.get(field):
                score += 0.05  # 20% of score from optional fields
                
        return min(score, 1.0)

    def clean_text(self, text: str) -> str:
        """Clean and normalize text content."""
        if not text:
            return ""
        return " ".join(text.split())

    def parse_date(self, date_str: str) -> Optional[str]:
        """Parse date string into YYYY-MM-DD format."""
        if not date_str:
            return None
            
        logger.info(f"Parsing date string: {date_str}")
        try:
            # Try various date formats
            formats = [
                "%Y-%m-%d",      # 2024-02-10
                "%B %d, %Y",     # February 10, 2024
                "%b %d, %Y",     # Feb 10, 2024
                "%Y/%m/%d",      # 2024/02/10
                "%m/%d/%Y",      # 02/10/2024
                "%d/%m/%Y",      # 10/02/2024
                "%Y.%m.%d",      # 2024.02.10
                "%A, %B %d, %Y", # Monday, February 10, 2024
                "%A, %b %d, %Y"  # Monday, Feb 10, 2024
            ]
            
            # Clean the date string
            date_str = date_str.strip()
            
            # Try each format
            for fmt in formats:
                try:
                    date_obj = datetime.strptime(date_str, fmt)
                    result = date_obj.strftime("%Y-%m-%d")
                    logger.info(f"Successfully parsed date: {result}")
                    return result
                except ValueError:
                    continue
                    
            # If none of the formats work, try to extract date components
            pattern = r'(?:.*,\s*)?(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?,\s*(\d{4})'
            match = re.search(pattern, date_str)
            if match:
                month, day, year = match.groups()
                try:
                    month_num = datetime.strptime(month, '%B').month
                except ValueError:
                    try:
                        month_num = datetime.strptime(month[:3], '%b').month
                    except ValueError:
                        return None
                        
                return f"{year}-{str(month_num).zfill(2)}-{str(int(day)).zfill(2)}"
                
            return None
            
        except Exception as e:
            logger.error(f"Failed to parse date '{date_str}': {str(e)}")
            return None

    async def init_browser(self):
        """Initialize the headless browser if not already initialized."""
        if not self._browser:
            playwright = await async_playwright().start()
            self._browser = await playwright.chromium.launch(headless=True)
            self._context = await self._browser.new_context(
                user_agent='CoherentCalendar/1.0 (Boulder Community Calendar; hello@coherentcalendar.com)'
            )

    async def close_browser(self):
        """Close browser and clean up resources."""
        if self._context:
            await self._context.close()
        if self._browser:
            await self._browser.close()
        self._context = None
        self._browser = None

    async def get_page_content(self, url: str, use_browser: bool = False) -> Optional[Union[str, BeautifulSoup]]:
        """Get page content using either requests or headless browser."""
        try:
            if use_browser:
                await self.init_browser()
                page = await self._context.new_page()
                await page.goto(url, wait_until='networkidle')
                content = await page.content()
                await page.close()
                return BeautifulSoup(content, 'html.parser')
            else:
                async with aiohttp.ClientSession() as session:
                    headers = {
                        'User-Agent': 'CoherentCalendar/1.0 (Boulder Community Calendar; hello@coherentcalendar.com)'
                    }
                    async with session.get(url, headers=headers) as response:
                        if response.status == 200:
                            content = await response.text()
                            return BeautifulSoup(content, 'html.parser')
                        else:
                            logger.warning(f"Failed to fetch {url} with status {response.status}")
                            return None
        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            return None

    def format_event(self, raw_event: Dict) -> Dict:
        """Format raw event data into standardized format."""
        logger.info(f"Formatting raw event: {raw_event}")
        event = {
            'title': self.clean_text(raw_event.get('title', '')),
            'date': self.parse_date(raw_event.get('date', '')),
            'time': raw_event.get('time', ''),
            'location': self.clean_text(raw_event.get('location', '')),
            'description': self.clean_text(raw_event.get('description', '')),
            'url': raw_event.get('url', ''),
            'source': self.source_name,
            'source_id': raw_event.get('source_id', '')
        }
        
        # Calculate confidence score
        confidence = self.calculate_confidence(event)
        event['needs_review'] = confidence < self.confidence_threshold
        
        logger.info(f"Formatted event: {event}")
        return event