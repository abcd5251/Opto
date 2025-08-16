import requests
import os
import json
import re
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from typing import List, Dict, Tuple, Union

load_dotenv()

def format_results(organic_results: List[Dict[str, Union[str, None]]]) -> List[Dict[str, str]]:
    """
    Format organic search results.

    Parameters:
    organic_results (List[Dict[str, Union[str, None]]]): List of organic search results.

    Returns:
    List[Dict[str, str]]: Formatted results containing title, link, and snippet.
    """
    result_strings = []
    for result in organic_results:
        formatted_result = {
            "title": result.get('title', 'No Title'),
            "link": result.get('link', '#'),
            "snippet": result.get('snippet', 'No snippet available.')
        }
        result_strings.append(formatted_result)
    
    return result_strings

def convert_relative_date(date_str: str) -> str:
    """
    Convert a relative date string (e.g. '1 month ago', '2 weeks ago', '3 days ago', '5 hours ago')
    into a formatted date string (YYYY-MM-DD) based on the current date and time.
    
    For conversion:
      - month(s): each month is considered as 30 days.
      - week(s): each week is 7 days.
      - day(s): days remain as is.
      - hour(s): hours are subtracted; the result is formatted as a date.
    
    If the string doesn't match one of the supported formats, the original string is returned.
    """
    pattern = r'(\d+)\s*(month|months|week|weeks|day|days|hour|hours)\s*ago'
    match = re.match(pattern, date_str.strip().lower())
    if match:
        number = int(match.group(1))
        unit = match.group(2)
        if unit.startswith('month'):
            delta = timedelta(days=number * 30)
        elif unit.startswith('week'):
            delta = timedelta(days=number * 7)
        elif unit.startswith('day'):
            delta = timedelta(days=number)
        elif unit.startswith('hour'):
            delta = timedelta(hours=number)
        new_date = (datetime.now(timezone.utc) - delta).astimezone(timezone(timedelta(hours=8)))
        return new_date.strftime('%Y-%m-%d %H:%M:%S')
    return date_str

def is_recent_news(date_str: str) -> bool:
    date_str = str(date_str).lower()
    excluded_terms = ["month", "months", "year", "years"]
    return all(term not in date_str for term in excluded_terms)

def get_search_result(search_type: str, query: str) -> Tuple[Union[List[Dict[str, str]], Dict[str, str]], List[str]]:
    """
    Get the Google trend results for the given query.

    Parameters:
    search_type (str): The type of Google trend to get (search, news, shopping).
    query (str): The query to get the Google trend for.

    Returns:
    Tuple[Union[List[Dict[str, str]], Dict[str, str]], List[str]]: The Google trend results and related searches.
    """
    url_map = {
        "search": "https://google.serper.dev/search",
        "news": "https://google.serper.dev/news"
    }

    search_url = url_map.get(search_type, "https://google.serper.dev/search")

    payload = json.dumps({
        "q": query,
        "num": 11,
        "gl": "tw"
    })
    headers = {
        'X-API-KEY': os.getenv('SERPER_API_KEY'),
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(search_url, headers=headers, data=payload)
        response.raise_for_status()  
        results = response.json()
        related_searches = ["None"]

        if search_type == "search":
            related_searches = [item['query'] for item in results.get("relatedSearches", [])]
            formatted_results = format_results(results.get('organic', []))
            return formatted_results, related_searches

        if search_type == "news":
            news_items = results.get("news", [])
            filtered_data = []
            
            for item in news_items:
                converted_date = convert_relative_date(item.get('date', 'N/A'))
                
                if is_recent_news(item.get('date', '')):
                    news_data = {
                        'title': item.get('title', 'N/A'),
                        'link': item.get('link', 'N/A'),
                        'snippet': item.get('snippet', 'N/A'),
                        'date': converted_date,
                        'source': item.get('source', 'N/A')
                    }
                    filtered_data.append(news_data)
        
            return filtered_data, related_searches

        return {"Response": "Invalid search type provided."}, related_searches

    except requests.exceptions.HTTPError as http_err:
        return {"Response": f"HTTP error occurred: {http_err}"}, ["None"]
    except requests.exceptions.RequestException as req_err:
        return {"Response": f"Request error occurred: {req_err}"}, ["None"]
    except KeyError as key_err:
        return {"Response": f"Key error occurred: {key_err}"}, ["None"]
    except Exception as err:
        return {"Response": f"An unexpected error occurred: {err}"}, ["None"]