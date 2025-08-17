import asyncio
import os
from crawl4ai import *

async def main():
    urls = [
        "https://stable.kittypunch.xyz/pools",
        "https://app.bonzo.finance/dashboard", 
        "https://www.staderlabs.com/hedera/defi/",
        "https://defillama.com/chains",
        "https://gho.aave.com/markets/",
    ]
    
    data_dir = "./data"
    if not os.path.exists(data_dir):
        os.makedirs(data_dir)
    
    with open("./data/information.txt", "w", encoding="utf-8") as f:
        async with AsyncWebCrawler() as crawler:
            for i, url in enumerate(urls, 1):
                try:
                    print(f"Crawling {i} Website: {url}")
                    result = await crawler.arun(url=url)
                    

                    f.write(f"\n{'='*80}\n")
                    f.write(f"Website {i}: {url}\n")
                    f.write(f"{'='*80}\n\n")
                    
                    if result.markdown:
                        f.write(result.markdown)
                    else:
                        f.write("Cannot get content")
                    
                    f.write("\n\n")
                    print(f"Successfully crawl: {url}")
                    
                except Exception as e:
                    print(f"Crawl {url} Error: {str(e)}")
                    f.write(f"\n{'='*80}\n")
                    f.write(f"Website {i}: {url}\n")
                    f.write(f"Error: {str(e)}\n")
                    f.write(f"{'='*80}\n\n")
    
    print("Save all the information to ./data/information.txt")

if __name__ == "__main__":
    asyncio.run(main())