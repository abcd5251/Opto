import requests

def get_top_10_by_followers():
    url = "https://foxhole.bot/api/v1/tweets"
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()

    # Sort posts by followersCount in descending order
    sorted_posts = sorted(
        data,
        key=lambda x: x["user"]["followersCount"],
        reverse=True
    )

    # Get top 10 posts
    top_10 = sorted_posts[:10]
    result = []
    for post in top_10:
        result.append({
            "user": post["user"]["name"],
            "followersCount": post["user"]["followersCount"],
            "text": post["text"],
            "token": post.get("token", {})
        })
    return result

def fetch_and_save_token_data(token_ca, idx):
    url = f"https://foxhole.bot/api/v1/tweets?contractAddress={token_ca}&limit=100&onlyKol=false"
    response = requests.get(url)
    response.raise_for_status()
    data = response.json()

    texts = [item.get("text", "") for item in data]
    data_str = "\n".join(texts)

    with open(f"./data/top_{idx+1}.txt", "w", encoding="utf-8") as f:
        f.write(data_str)

def get_top_10_data():
    tokens_information = []
    top_posts = get_top_10_by_followers()
    for idx, post in enumerate(top_posts):
        print(f"User: {post['user']} ({post['followersCount']} followers)")
        print(f"Text: {post['text']}")
        print(f"Token: {post['token']}\n")
        ca = post["token"].get("ca")
        if ca:
            fetch_and_save_token_data(ca, idx)
        
        tokens_information.append(post['token'])
        
    return tokens_information