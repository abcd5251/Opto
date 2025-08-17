import requests
import os
import json
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

def is_recent_news(date_str: str) -> bool:
    date_str = str(date_str).lower()
    excluded_terms = ['day', 'days', "week", "weeks"]
    return all(term not in date_str for term in excluded_terms)

def get_google_trend(search_type: str, query: str) -> Tuple[Union[List[Dict[str, str]], Dict[str, str]], List[str]]:
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
        "num": 10,
        "gl": "tw"
    })
    headers = {
        'X-API-KEY': os.getenv('SERPER_API_KEY'),
        'Content-Type': 'application/json'
    }

    try:
        response = requests.post(search_url, headers=headers, data=payload)
        response.raise_for_status()  # Raise an HTTPError for bad responses (4XX, 5XX)
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
                if is_recent_news(item.get('date', '')):
                    news_data = {
                        'title': item.get('title', 'N/A'),
                        'link': item.get('link', 'N/A'),
                        'snippet': item.get('snippet', 'N/A'),
                        'date': item.get('date', 'N/A'),
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
