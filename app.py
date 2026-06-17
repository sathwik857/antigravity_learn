import os
import logging
import xml.etree.ElementTree as ET
from flask import Flask, jsonify, render_template, send_from_directory
import requests

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__, static_folder='static', template_folder='templates')

FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_atom_feed(xml_content):
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        logger.error(f"XML parse error: {e}")
        return []

    # Atom namespace is typically 'http://www.w3.org/2005/Atom'
    # But let's retrieve it from the root tag just in case, or default to standard Atom namespace.
    ns = ""
    if root.tag.startswith("{"):
        ns = root.tag.split("}")[0] + "}"

    entries = []
    
    # Elements in Atom feed
    entry_tag = f"{ns}entry"
    title_tag = f"{ns}title"
    link_tag = f"{ns}link"
    updated_tag = f"{ns}updated"
    published_tag = f"{ns}published"
    content_tag = f"{ns}content"
    id_tag = f"{ns}id"

    for entry_el in root.findall(entry_tag):
        title_el = entry_el.find(title_tag)
        link_el = entry_el.find(link_tag)
        updated_el = entry_el.find(updated_tag)
        published_el = entry_el.find(published_tag)
        content_el = entry_el.find(content_tag)
        id_el = entry_el.find(id_tag)

        # Get link href
        link_href = ""
        if link_el is not None:
            link_href = link_el.attrib.get('href', '')
            # If link is self-closing and contains nothing, try alternative links
            if not link_href:
                for l in entry_el.findall(link_tag):
                    if l.attrib.get('rel') == 'alternate':
                        link_href = l.attrib.get('href', '')
                        break
                if not link_href:
                    link_href = entry_el.find(link_tag).attrib.get('href', '')

        # Get publication or update date
        date_str = ""
        if published_el is not None and published_el.text:
            date_str = published_el.text
        elif updated_el is not None and updated_el.text:
            date_str = updated_el.text

        title_text = title_el.text if title_el is not None else "No Title"
        content_text = content_el.text if content_el is not None else ""
        id_text = id_el.text if id_el is not None else ""

        entries.append({
            'id': id_text,
            'title': title_text,
            'link': link_href,
            'date': date_str,
            'content': content_text
        })
    
    return entries

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/notes')
def get_notes():
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        logger.info(f"Fetching release notes from {FEED_URL}")
        response = requests.get(FEED_URL, headers=headers, timeout=15)
        response.raise_for_status()
        
        entries = parse_atom_feed(response.content)
        return jsonify({
            'success': True,
            'notes': entries
        })
    except requests.RequestException as e:
        logger.error(f"Error fetching feed: {e}")
        return jsonify({
            'success': False,
            'error': f"Failed to fetch release notes: {str(e)}"
        }), 500
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return jsonify({
            'success': False,
            'error': f"An unexpected error occurred: {str(e)}"
        }), 500

if __name__ == '__main__':
    # Run Flask application on port 5000
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
