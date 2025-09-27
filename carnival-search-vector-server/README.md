# Carnival Search Vector Server

## Installation

### 1. Create Virtual Environment

```bash
python -m venv venv
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Environment Configuration

Create a `.env` file in the root directory from the example template:

```bash
cp .env.example .env
```

## Running the Server

```bash
python app.py
```

The server will start on `http://0.0.0.0:4001`.

## Project Structure

```
carnival-search-vector-server/
├── app.py                    # Main FastAPI application entry point
├── database.py              # Database connection and configuration
├── milvus.py                # Milvus vector database operations
├── query_agent.py           # Query processing and agent logic
├── custom_connector.py      # Custom connector implementations
├── prompts.py               # LLM prompts and templates
├── type_classes.py          # Type definitions and data classes
├── utils.py                 # Utility functions
└── tools/                   # Integration tools
    ├── tools.py            # Base tool definitions
    ├── confluence.py       # Confluence integration
    ├── jira.py             # Jira integration
    ├── salesforce.py       # Salesforce integration
    └── slack.py            # Slack integration
```