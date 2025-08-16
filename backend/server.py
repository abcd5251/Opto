import os
import time
import sys
import tweepy
import schedule
from utils.get_data import get_top_10_data
from prompts.analyzer import analyze_prompt
from models.model import OpenAIModel

from dotenv import load_dotenv

# Load API keys and tokens from .env file
load_dotenv()
CONSUMER_KEY        = os.getenv('TWITTER_API_KEY')
CONSUMER_SECRET     = os.getenv('TWITTER_API_SECRET_KEY')
ACCESS_TOKEN        = os.getenv('TWITTER_ACCESS_TOKEN')
ACCESS_TOKEN_SECRET = os.getenv('TWITTER_ACCESS_TOKEN_SECRET')
# (Optional) BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN')

# Initialize Tweepy Client for Twitter API v2 with rate‑limit handling
client = tweepy.Client(
    consumer_key=CONSUMER_KEY,
    consumer_secret=CONSUMER_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_TOKEN_SECRET,
    # bearer_token=BEARER_TOKEN,
    wait_on_rate_limit=True
)  # Uses POST /2/tweets under the hood:contentReference[oaicite:1]{index=1}

# List of messages to cycle through
messages = [
    "Hello, world! Automated tweet test.",
]
message_iterator = iter(messages)

def read_txt_file(filename):
    with open(filename, "r", encoding="utf-8") as f:
        content = f.read()
    return content

def post_tweet(custom_text=None):
    """
    Post a tweet with either a custom text or the next message from the iterator.
    
    Args:
        custom_text (str, optional): Custom text to tweet. If None, use the message iterator.
    """
    if custom_text:
        text = custom_text
    else:
        global message_iterator
        try:
            text = next(message_iterator)
        except StopIteration:
            # Restart the iterator when all messages have been posted
            message_iterator = iter(messages)
            text = next(message_iterator)
    
    # Twitter has a 280 character limit, so truncate if necessary
    if len(text) > 280:
        text = text[:277] + "..."
        
    try:
        client.create_tweet(text=text)
        print(f"Tweet posted: {text}")
        return True
    except tweepy.TooManyRequests:
        # Free tier allows up to 17 tweets per 24 hours per user
        print("Rate limit reached. Waiting until next window.")
        return False
    except Exception as error:
        print(f"Error posting tweet: {error}")
        return False

# Schedule the tweet job every 30 minutes
schedule.every(30).minutes.do(post_tweet)

if __name__ == "__main__":
    # Get token data and prepare for analysis
    token_information = get_top_10_data()
    
    # Initialize OpenAI model for analysis
    analyze_instance = OpenAIModel(
        system_prompt=analyze_prompt,
        temperature=0
    )
    
    # Create a list to store analysis results for tweeting
    tweet_contents = []
    
    # Analyze top 3 tokens
    for i in range(min(3, len(token_information))):
        if not token_information[i].get("name") or not token_information[i].get("ca"):
            print(f"Skipping token {i+1} due to missing name or contract address")
            continue
            
        total_texts = "\nToken information:\n"
        file_name = f"./data/top_{i + 1}.txt"
        
        try:
            with open(file_name, 'r', encoding='utf-8') as file:
               file_texts = file.readlines()
               total_texts += "\n".join(file_texts)
               
               # Create search query with token name and contract address
               search_name = token_information[i]["name"] + " " + token_information[i]["ca"]
               search_prompt = f"Web3 Token: {search_name} future trends"
               
               # Generate analysis with web search
               content, annotations, input_tokens_length, output_tokens_length = analyze_instance.generate_with_web_annotations(search_prompt)
               total_texts += f"\n{content}"
               
               # Generate final analysis
               information = total_texts + f"token: {search_name}" 
               response, input_tokens_length, output_tokens_length = analyze_instance.generate_string_text(
                   f"INFORMATION: {information}\n\nCreate a concise tweet (under 280 characters) summarizing the key insights about this token."
               )
               
               # Add the response to tweet contents
               tweet_contents.append({
                   "token_name": token_information[i]["name"],
                   "tweet_text": response
               })
               
               print(f"Analysis for {token_information[i]['name']} completed")
               print(response)
               
        except FileNotFoundError:
            print(f"Error: File not found at {file_name}")
            continue
        except Exception as e:
            print(f"Error processing token {i+1}: {str(e)}")
            continue
    
    # Post the first analysis result immediately if available
    if tweet_contents:
        print("\nPosting first analysis to Twitter...")
        success = post_tweet(tweet_contents[0]["tweet_text"])
        if success:
            print(f"Successfully posted analysis of {tweet_contents[0]['token_name']} to Twitter")
    
    # Schedule tweets for the remaining analyses
    if len(tweet_contents) > 1:
        for i, content in enumerate(tweet_contents[1:], 1):
            # Schedule each remaining tweet with increasing delay (e.g., 2 hours apart)
            delay_hours = i * 2
            schedule.every(delay_hours).hours.do(
                post_tweet, custom_text=content["tweet_text"]
            )
            print(f"Scheduled tweet about {content['token_name']} in {delay_hours} hours")
    
    # Keep the scheduler running
    print("\nStarting scheduler to post remaining tweets...")
    while True:
        schedule.run_pending()
        time.sleep(60)  # Check every minute
