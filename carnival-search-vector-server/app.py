from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
from openai import OpenAI
from dotenv import load_dotenv
import os
import uvicorn
from contextlib import asynccontextmanager
from query_agent import get_answer
from database import initialize_db_pool, close_db_pool
from database import get_db_cursor
from tools.jira import get_jira_issues_by_jql
from fastapi.responses import StreamingResponse
from starlette.requests import Request

load_dotenv(override=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_initialized = initialize_db_pool()
    if db_initialized:
        print("Database pool initialized")
    else:
        print("Failed to initialize database pool")

    # await initialize_workers()
    # print("workers initialized")
    yield
    # await shutdown_workers()
    close_db_pool()


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

openai_client = OpenAI()


@app.get("/health")
def health():
    return "OK"


class EmbeddingData(BaseModel):
    org_id: str
    document_id: str
    connector_id: str
    chunk: str
    chunk_index: int


class SearchRequest(BaseModel):
    query: str
    org_id: str
    connector_ids: List[str]


""" @app.post("/search")
async def search(data: SearchRequest):
    res = get_search_results(data.query, data.org_id, data.connector_ids)
    return res """


class ChatRequest(BaseModel):
    query: str
    org_id: str
    user_id: str
    previous_messages: Optional[List[Dict[str, Any]]] = None


@app.post("/chat")
async def query(request: Request):
    data = await request.json()
    return StreamingResponse(
        get_answer(
            data["query"], data["org_id"], data["user_id"], data["previous_messages"]
        ),
        media_type="application/x-ndjson",
    )


if __name__ == "__main__":
    if os.environ.get("NODE_ENV") == "dev":
        uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT")))
    else:
        print("Starting production server")
        uvicorn.run("app:app", host="0.0.0.0", port=int(os.environ.get("PORT")))
