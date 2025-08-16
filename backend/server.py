# main.py
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from models.model import OpenAIModel
from prompts.qa import qa_prompt

app = FastAPI(title="OpenAIModel FastAPI Service")

# Define request body
class PromptRequest(BaseModel):
    prompt: str

# Initialize model (system prompt + temperature from env or default)
temperature = float(os.getenv("MODEL_TEMPERATURE", 0.7))
model_instance = OpenAIModel(system_prompt=qa_prompt, temperature=temperature)

@app.post("/generate")
async def generate_text(request: PromptRequest):
    try:
        response, input_tokens, output_tokens = model_instance.generate_string_text(request.prompt)
        
        # If response is dict (error), raise HTTPException
        if isinstance(response, dict) and "error" in response:
            raise HTTPException(status_code=500, detail=response["error"])
        
        return {
            "response": response,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

