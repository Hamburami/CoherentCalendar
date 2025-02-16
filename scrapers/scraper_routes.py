import json
from bs4 import BeautifulSoup
import re

def extract_events(html_content):
    """
    Extracts event information from HTML content and returns it as a JSON string.

    Args:
        html_content: The HTML content of the webpage as a string.

    Returns:
        A JSON string containing a list of event dictionaries, or an empty JSON string if no events are found.  Returns an error message string if there's a parsing issue.
    """

    try:
        soup = BeautifulSoup(html_content, 'html.parser')
        events = []

        # This is a VERY basic example and will likely need to be customized
        # based on the specific website's HTML structure.  Websites vary *wildly*.
        #  Inspect the target website's HTML source to find the patterns that
        #  identify event elements and their associated data.

        # Example 1:  Finding events within elements with a specific class
        for event_element in soup.find_all(class_=re.compile(r'event|event-item', re.IGNORECASE)): # Flexible class name matching
            event = {}
            event['name'] = event_element.find(class_=re.compile(r'title|name', re.IGNORECASE)).text.strip() if event_element.find(class_=re.compile(r'title|name', re.IGNORECASE)) else "N/A"
            event['location'] = event_element.find(class_=re.compile(r'location|venue', re.IGNORECASE)).text.strip() if event_element.find(class_=re.compile(r'location|venue', re.IGNORECASE)) else "N/A"
            event['time'] = event_element.find(class_=re.compile(r'time|date', re.IGNORECASE)).text.strip() if event_element.find(class_=re.compile(r'time|date', re.IGNORECASE)) else "N/A"
            event['description'] = event_element.find(class_=re.compile(r'description|details', re.IGNORECASE)).text.strip() if event_element.find(class_=re.compile(r'description|details', re.IGNORECASE)) else "N/A"
            events.append(event)


        # Example 2 (if the above doesn't work well):  Less structured approach -  find likely event containers and then extract info
        if not events: # Only try this if the first method didn't find anything
            for potential_event in soup.find_all(re.compile(r'div|section|article', re.IGNORECASE)): # Look in common container elements
                if potential_event.text.lower().count("event") > 0: # A very rough heuristic - looks for the word "event"
                   event = {}
                   # ... (Extract name, location, etc. - this will be highly site-specific) ...
                   # You'll likely need more sophisticated logic here, perhaps using regular expressions.
                   events.append(event)  # Add event if you manage to extract data


        return json.dumps(events, indent=4, ensure_ascii=False) # indent for readability

    except Exception as e:
        return f"Error parsing HTML: {str(e)}"



# Example usage (replace with your HTML content)
html_content = """
<html>
<body>
  <div class="event">
    <h2 class="title">Summer Festival</h2>
    <p class="location">Central Park</p>
    <p class="time">July 15th, 7 PM</p>
    <p class="description">A fun event for all ages!</p>
  </div>
    <div class="event-item">
        <h3 class="name">Art Show</h3>
        <p class="venue">Art Gallery</p>
        <p class="date">August 1st, 10 AM</p>
        <p class="details">Local artists displaying their work</p>
    </div>
</body>
</html>
"""

json_output = extract_events(html_content)
print(json_output)


html_content_2 = """
<html>
<body>
    <div> This is not an event </div>
    <section>
        <h2>Potential Event</h2>
        <p>Some text</p>
        <p>Event details here</p>
    </section>
</body>
</html>
"""

json_output_2 = extract_events(html_content_2)
print(json_output_2)


html_content_3 = """<html><body></body></html>""" # Example of no events
json_output_3 = extract_events(html_content_3)
print(json_output_3)


html_content_4 = """<html><body><div class="event"></div></body></html>""" # Example of event with no data
json_output_4 = extract_events(html_content_4)
print(json_output_4)