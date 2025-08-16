import tiktoken 
import requests
import os
from dotenv import load_dotenv
load_dotenv()

COMPLETIONS_MODEL = "gpt-4o-mini"

def num_tokens_from_string(string: str, encoding_name = COMPLETIONS_MODEL) -> int:
    """Returns the number of tokens in a text string."""
    encoding = tiktoken.encoding_for_model(encoding_name)
    num_tokens = len(encoding.encode(string))
    return num_tokens

def get_token_balances(wallet_address):
    endpoint = f'https://api.1inch.dev/balance/v1.2/1/balances/{wallet_address}'
    response = requests.get(endpoint, headers={'Authorization': os.getenv("INCH_API_KEY")})

    if response.status_code == 200:
        return response.json()
    else:
        print(f"Failed to fetch token balances. Error code: {response.status_code}")
        return None

def extract_data(results):
    """
    Extract title, snippet, and link from each result.
    Combine title and snippet into one text and collect links into a list.
    
    Parameters:
        results (list): List of dictionaries with keys "title", "snippet", and "link".
    
    Returns:
        tuple: (combined_texts, links)
            combined_texts (list): List of combined title and snippet strings.
            links (list): List of links.
    """
    combined_texts = []
    links = []
    for item in results:
        title = item.get("title", "")
        snippet = item.get("snippet", "")
        link = item.get("link", "")
        
        # Combine title and snippet into one string.
        combined_text = f"{title} {snippet}".strip()
        combined_texts.append(combined_text)
        
        links.append(link)
    
    return combined_texts, links