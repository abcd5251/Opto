from fastapi import FastAPI, Request, HTTPException
import json
import os
from typing import Dict, Optional
from models.model import OpenAIModel
from models.schema import InputData, QueryNews
from utils.constants import *
from prompts.qa import qa_prompt
from models.model import OpenAIModel
from utils.google_trends import get_google_trend
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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

# Data models for token balance management
class TokenBalance(BaseModel):
    token_symbol: str
    balance: float

class BalanceUpdate(BaseModel):
    token_symbol: str
    amount: float

class UserBalances(BaseModel):
    user_id: str
    balances: Dict[str, float]

# Local data storage path
DATA_FILE = "./data/token_balances.json"

# Utility functions for data persistence
def ensure_data_directory():
    """Ensure the data directory exists"""
    os.makedirs("./data", exist_ok=True)

def load_balances() -> Dict[str, Dict[str, float]]:
    """Load token balances from local JSON file"""
    ensure_data_directory()
    if os.path.exists(DATA_FILE):
        try:
            with open(DATA_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            return {}
    return {}

def save_balances(balances: Dict[str, Dict[str, float]]):
    """Save token balances to local JSON file"""
    ensure_data_directory()
    with open(DATA_FILE, 'w') as f:
        json.dump(balances, f, indent=2)

def get_user_balances(user_id: str) -> Dict[str, float]:
    """Get balances for a specific user"""
    all_balances = load_balances()
    return all_balances.get(user_id, {})

def update_user_balance(user_id: str, token_symbol: str, new_balance: float):
    """Update balance for a specific user and token"""
    all_balances = load_balances()
    if user_id not in all_balances:
        all_balances[user_id] = {}
    all_balances[user_id][token_symbol] = new_balance
    save_balances(all_balances)

# Existing endpoints
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

@app.post("/defiInfo")
async def process_simple_input(data: InputData):
        
    qa_model_instance = OpenAIModel(system_prompt=qa_prompt, temperature=0)
    prompt = f"INFORMATION:{CONTENT}\nQUESTION:{data.input_text}\nOUTPUT:"
    output, input_token, output_token = qa_model_instance.generate_string_text(prompt)
    
    return {"result": f"{output}"}

# New Token Balance Management Endpoints

@app.get("/balance/{user_id}")
async def get_balance(user_id: str, token_symbol: Optional[str] = None):
    """
    Get token balance(s) for a user
    
    Args:
        user_id (str): User identifier
        token_symbol (str, optional): Specific token symbol. If not provided, returns all balances.
    
    Returns:
        dict: User's token balance(s)
    """
    try:
        user_balances = get_user_balances(user_id)
        
        if token_symbol:
            balance = user_balances.get(token_symbol, 0.0)
            return {
                "user_id": user_id,
                "token_symbol": token_symbol,
                "balance": balance
            }
        else:
            return {
                "user_id": user_id,
                "balances": user_balances
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving balance: {str(e)}")

@app.post("/balance/{user_id}/set")
async def set_balance(user_id: str, balance_data: TokenBalance):
    """
    Set initial token balance for a user
    
    Args:
        user_id (str): User identifier
        balance_data (TokenBalance): Token symbol and initial balance
    
    Returns:
        dict: Updated balance information
    """
    try:
        update_user_balance(user_id, balance_data.token_symbol, balance_data.balance)
        
        return {
            "user_id": user_id,
            "token_symbol": balance_data.token_symbol,
            "balance": balance_data.balance,
            "message": "Balance set successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error setting balance: {str(e)}")

@app.post("/balance/{user_id}/increment")
async def increment_balance(user_id: str, update_data: BalanceUpdate):
    """
    Increment token balance for a user
    
    Args:
        user_id (str): User identifier
        update_data (BalanceUpdate): Token symbol and amount to add
    
    Returns:
        dict: Updated balance information
    """
    try:
        user_balances = get_user_balances(user_id)
        current_balance = user_balances.get(update_data.token_symbol, 0.0)
        new_balance = current_balance + update_data.amount
        
        update_user_balance(user_id, update_data.token_symbol, new_balance)
        
        return {
            "user_id": user_id,
            "token_symbol": update_data.token_symbol,
            "previous_balance": current_balance,
            "increment_amount": update_data.amount,
            "new_balance": new_balance,
            "message": "Balance incremented successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error incrementing balance: {str(e)}")

@app.post("/balance/{user_id}/decrement")
async def decrement_balance(user_id: str, update_data: BalanceUpdate):
    """
    Decrement token balance for a user
    
    Args:
        user_id (str): User identifier
        update_data (BalanceUpdate): Token symbol and amount to subtract
    
    Returns:
        dict: Updated balance information
    """
    try:
        user_balances = get_user_balances(user_id)
        current_balance = user_balances.get(update_data.token_symbol, 0.0)
        
        if current_balance < update_data.amount:
            raise HTTPException(
                status_code=400, 
                detail=f"Insufficient balance. Current: {current_balance}, Requested: {update_data.amount}"
            )
        
        new_balance = current_balance - update_data.amount
        update_user_balance(user_id, update_data.token_symbol, new_balance)
        
        return {
            "user_id": user_id,
            "token_symbol": update_data.token_symbol,
            "previous_balance": current_balance,
            "decrement_amount": update_data.amount,
            "new_balance": new_balance,
            "message": "Balance decremented successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error decrementing balance: {str(e)}")

@app.get("/balance/{user_id}/history")
async def get_balance_history(user_id: str):
    """
    Get all token balances for a user (for history/overview)
    
    Args:
        user_id (str): User identifier
    
    Returns:
        dict: All user's token balances
    """
    try:
        user_balances = get_user_balances(user_id)
        total_tokens = len(user_balances)
        
        return {
            "user_id": user_id,
            "total_tokens": total_tokens,
            "balances": user_balances,
            "timestamp": json.dumps(user_balances, default=str)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving balance history: {str(e)}")

@app.delete("/balance/{user_id}")
async def clear_user_balances(user_id: str, token_symbol: Optional[str] = None):
    """
    Clear user's token balance(s)
    
    Args:
        user_id (str): User identifier
        token_symbol (str, optional): Specific token to clear. If not provided, clears all balances.
    
    Returns:
        dict: Confirmation message
    """
    try:
        all_balances = load_balances()
        
        if user_id not in all_balances:
            raise HTTPException(status_code=404, detail="User not found")
        
        if token_symbol:
            if token_symbol in all_balances[user_id]:
                del all_balances[user_id][token_symbol]
                save_balances(all_balances)
                return {
                    "user_id": user_id,
                    "token_symbol": token_symbol,
                    "message": f"Balance for {token_symbol} cleared successfully"
                }
            else:
                raise HTTPException(status_code=404, detail=f"Token {token_symbol} not found for user")
        else:
            del all_balances[user_id]
            save_balances(all_balances)
            return {
                "user_id": user_id,
                "message": "All balances cleared successfully"
            }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error clearing balances: {str(e)}")

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "message": "Token balance API is running"}


