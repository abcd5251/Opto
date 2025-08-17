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