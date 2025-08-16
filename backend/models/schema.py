from pydantic import BaseModel

class InputData(BaseModel):
    input_text: str

class QueryNews(BaseModel):
    query: str = "trump"