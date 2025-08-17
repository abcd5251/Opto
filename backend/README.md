# AI Backend
API for the latest news and a RAG DeFi knowledge base on DeFi strategies, allowing users to easily access blockchain information.

## Execution
Put your API key into .env file
```bash
OPENAI_MODEL=""
OPENAI_API_KEY=""
SERPER_API=""
QDRANT_DB_URL=""
QDRANT_APIKEY=""
```
Install Package
```
pip install -r requirements.txt
```

Server
```
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```