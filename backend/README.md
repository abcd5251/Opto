# Opto AI Backend
Opto's backend providing AI-powered DeFi insights, news analysis, and token balance management.

## Features
- **DeFi Knowledge Base**: RAG-powered Q&A system for DeFi strategies
- **News Analysis**: Real-time news search and AI summarization
- **Token Balance Management**: User portfolio tracking and management
- **Google Trends Integration**: Market sentiment analysis

## Quick Start
### Prerequisites
- Python 3.8+
- OpenAI API key
- Serper API key (for news search)

### Environment Setup
Create `.env` file:
```bash
OPENAI_MODEL="gpt-4"
OPENAI_API_KEY="your_openai_key"
SERPER_API="your_serper_key"
QDRANT_DB_URL="your_qdrant_url"
QDRANT_APIKEY="your_qdrant_key"
```

### Installation
```bash
pip install -r requirements.txt
```

### Run Server
```bash
uvicorn server:app --reload --host 0.0.0.0 --port 8000
```

### Health Check
- `GET /health` - Server health status
