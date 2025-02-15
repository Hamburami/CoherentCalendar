from flask import Blueprint, request, jsonify
from typing import Dict, Any, Optional
import logging
import asyncio
import re
from scrapers.base_scraper import BaseScraper

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