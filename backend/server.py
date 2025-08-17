from fastapi import FastAPI, Request
import json
from models.model import OpenAIModel
from models.schema import InputData, QueryNews
from utils.constants import *
from prompts.qa import qa_prompt
from models.model import OpenAIModel
from utils.google_trends import get_google_trend
from fastapi.middleware.cors import CORSMiddleware
# Initialize FastAPI app
app = FastAPI()

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process")
async def process_input(data: InputData):
    """
    Process input data using OpenAIModel and return the intent type.
    
    Args:
        data (InputData): Input data containing input_text.
    
    Returns:
        dict: JSON response with intent_type.
    """

    # Initialize the model instance
    planner_model_instance = OpenAIModel(system_prompt=planner_prompt, temperature=0)
    try:
        # Generate text using the model
        prompt = f"INPUT_TEXT: {data.input_text}"
        intent_type, input_token, output_token = planner_model_instance.generate_text(prompt)
        output = json.loads(intent_type)
        
        # Return response
        return output
    
    except Exception as e:
        return {"error": f"Error! {str(e)}"}

def summary_news(news):
    summary_model_instance = OpenAIModel(system_prompt=summarize_prompt, temperature=0)
    prompt = f"INFORMATION: {news}\nOUTPUT:"
    summary_content, input_token, output_token = summary_model_instance.generate_string_text(prompt)
    return summary_content

@app.post("/search")
async def get_news(data: QueryNews):
    search_type = "news"
    query = data.query
    query_2 = "crypto"
    filtered_data, related_searches = get_google_trend(search_type, query)
    filtered_data_2, related_searches = get_google_trend(search_type, query_2)
    
    total_data = filtered_data + filtered_data_2
    print(len(total_data))
    
    total_news = ""
    for item in total_data:
        single_news = item["title"] + "\n" + item['snippet'] 
        total_news += single_news + "\n"
    summary_news_content = summary_news(total_news)
    return {"news": total_data, "summary": summary_news_content}

# async def generate_summary():
#     async with AsyncWebCrawler() as crawler:
#         result = await crawler.arun(
#             url="https://followin.io/en/news",
#         )
#         print(result.markdown)
#         summary_news_content = summary_news(result.markdown)
#         fear_result = get_fear_and_greed_index()
        
#         output_text = f"{summary_news_content}\n\nFear and Greed Index: {fear_result['value']}\nSentiment: {fear_result['sentiment']}"
#         return output_text

# @app.get("/summary")
# async def get_summary():
#     result = await generate_summary()
#     print(result)
#     return {"summary": result}

@app.post("/defiInfo")
async def process_simple_input(data: InputData):
        
    qa_model_instance = OpenAIModel(system_prompt=qa_prompt, temperature=0)
    prompt = f"INFORMATION:{CONTENT}\nQUESTION:{data.input_text}\nOUTPUT:"
    output, input_token, output_token = qa_model_instance.generate_string_text(prompt)
    
    return {"result": f"{output}"}


