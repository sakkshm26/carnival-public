from pydantic import BaseModel
from typing import List, Dict, Annotated, Sequence
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage
import operator
from typing_extensions import TypedDict

class Document(BaseModel):
    id: str
    title: str
    content: str | None
    url: str
    metadata: dict
    app_type: str
    
class Connector(BaseModel):
    app_type: str
    credentials_data: dict


class ToolCall(BaseModel):
    name: str
    args: dict
    result: List[Document]


class PreviousMessage(BaseModel):
    sent_by_bot: bool
    text: str


class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], add_messages]
    documents: Annotated[List[Document], operator.add]
    unique_documents: Dict[str, bool]
    iterations: int
    max_iterations: int