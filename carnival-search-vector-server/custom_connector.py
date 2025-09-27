import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime
from langgraph.graph import StateGraph, END, START
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.callbacks import BaseCallbackHandler
from prompts import SYNTHESIZE_ANSWER_PROMPT
from dotenv import load_dotenv
from type_classes import Document, PreviousMessage
from pydantic import BaseModel
from database import get_db_cursor
# from milvus import hybrid_search
from langchain_core.tools import BaseTool
from type_classes import AgentState, PreviousMessage, Connector, Document
from prompts import WEB_AGENT_PROMPT
from langchain_core.tools import tool
from utils import formatted_doc

load_dotenv(override=True)


class StreamResponse(BaseModel):
    type: str
    data: Any


class TokenUsageTracker(BaseCallbackHandler):
    """Callback handler to track token usage across all LLM calls."""

    def __init__(self):
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.total_cost = 0.0
        self.llm_calls = 0

    def on_llm_start(
        self, serialized: Dict[str, Any], prompts: List[str], **kwargs
    ) -> None:
        pass

    def on_llm_end(self, response, **kwargs) -> None:
        if hasattr(response, "llm_output") and response.llm_output:
            token_usage = response.llm_output.get("token_usage", {})
            if token_usage:
                self.total_input_tokens += token_usage.get("prompt_tokens", 0)
                self.total_output_tokens += token_usage.get("completion_tokens", 0)
                self.llm_calls += 1
        elif hasattr(response, "response_metadata") and response.response_metadata:
            token_usage = response.response_metadata.get("token_usage", {})
            if token_usage:
                self.total_input_tokens += token_usage.get("prompt_tokens", 0)
                self.total_output_tokens += token_usage.get("completion_tokens", 0)
                self.llm_calls += 1

    def get_usage_stats(self) -> Dict[str, Any]:
        input_cost = (self.total_input_tokens / 1000) * 0.00015
        output_cost = (self.total_output_tokens / 1000) * 0.0006
        total_cost = input_cost + output_cost

        return {
            "total_input_tokens": self.total_input_tokens,
            "total_output_tokens": self.total_output_tokens,
            "total_tokens": self.total_input_tokens + self.total_output_tokens,
            "llm_calls": self.llm_calls,
            "estimated_cost_usd": round(total_cost, 6),
        }
        
def create_tools():
    # @tool
    # def public_docs_search_tool(query: str) -> List[Document]:
    #     """
    #     Search data for the given query
        
    #     Args:
    #         query(str): The query to search for
            
    #     Returns:
    #         List[Document]: The documents that match the query
    #     """
    #     return search_public_docs(query)
    
    @tool
    def generate_final_answer_tool() -> str:
        """
        Call this tool ONLY when you have gathered all necessary information from other tools to comprehensively answer the user's query.
        This tool synthesizes the collected documents into a final answer and ends the process.
        Do not call this tool if you need to perform more searches or if the gathered information is insufficient.
        This is the final step.
        """
        return "Final answer generation has been triggered. The collected documents will now be synthesized."
    
    return [generate_final_answer_tool]

def custom_tool_node_wrapper(tools: List[BaseTool], stream_handler):
    tool_map = {tool.name: tool for tool in tools}

    def _tool_node(state: AgentState) -> dict:
        last_message = state["messages"][-1]

        tool_invocations = []

        documents = []
        unique_documents = state.get("unique_documents", {})

        iterations = state["iterations"]

        for tool_call in last_message.tool_calls:
            tool_name = tool_call.get("name")
            if tool_name in tool_map:
                iterations += 1
                tool_to_call = tool_map[tool_name]
                if tool_name == "generate_final_answer_tool":
                    continue

                tool_start_payload = StreamResponse(
                    type="tool_choice", data={"name": tool_name, "app_type": "web"}
                )
                stream_handler(f"{tool_start_payload.model_dump_json()}\n")

                result = tool_to_call.invoke(tool_call.get("args"))

                if isinstance(result, list):
                    for doc in result:
                        if not isinstance(doc, Document):
                            continue
                        if doc.id not in unique_documents:
                            unique_documents[doc.id] = True
                            documents.append(doc)
                elif isinstance(result, Document):
                    if result.id not in unique_documents:
                        unique_documents[result.id] = True
                        documents.append(result)

                tool_invocations.append(
                    ToolMessage(content=str(result), tool_call_id=tool_call.get("id"))
                )

        return {
            "messages": tool_invocations,
            "documents": documents,
            "unique_documents": unique_documents,
            "iterations": iterations,
        }

    return _tool_node


def custom_create_react_agent(
    model: ChatOpenAI,
    tools: List[BaseTool],
    system_prompt: str,
    stream_handler,
    callbacks: Optional[List[BaseCallbackHandler]] = None,
    user_context_str: str = "",
):
    token_tracker: TokenUsageTracker = callbacks[0]
    custom_tool_node = custom_tool_node_wrapper(tools, stream_handler)
    model_with_tools = model.bind_tools(tools, tool_choice="required")

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="messages"),
        ]
    )

    agent_runnable = prompt | model_with_tools

    def call_model(state: AgentState):
        if token_tracker.get_usage_stats()["total_tokens"] > 170000:
            response = AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "generate_final_answer_tool",
                        "args": {},
                        "id": f"forced_exit_{datetime.now().isoformat()}",
                    }
                ],
            )
            return {"messages": [response]}

        messages = state["messages"]
        iterations = state["iterations"]
        max_iterations = state["max_iterations"]

        if iterations >= max_iterations:
            response = AIMessage(
                content="",
                tool_calls=[
                    {
                        "name": "generate_final_answer_tool",
                        "args": {},
                        "id": f"forced_exit_{datetime.now().isoformat()}",
                    }
                ],
            )
        else:
            config = {"callbacks": callbacks} if callbacks else {}
            response = agent_runnable.invoke({"messages": messages}, config=config)

        return {"messages": [response]}

    def should_continue(state: AgentState):
        last_message = state["messages"][-1]
        if isinstance(last_message, AIMessage) and getattr(
            last_message, "tool_calls", None
        ):
            if any(
                call.get("name") == "generate_final_answer_tool"
                for call in last_message.tool_calls
            ):
                return END
            return "tools"
        return END

    workflow = StateGraph(AgentState)

    workflow.add_node("agent", call_model)
    workflow.add_node("tools", custom_tool_node)

    workflow.set_entry_point("agent")

    workflow.add_conditional_edges(
        "agent",
        should_continue,
        {
            "tools": "tools",
            END: END,
        },
    )

    workflow.add_edge("tools", "agent")

    return workflow.compile()


# def search_public_docs(keyword: str) -> List[Document]:
#     results = hybrid_search(keyword)
#     documents = []
#     for result in results:
#         for hit in result:
#             documents.append(
#                 formatted_doc(Document(
#                     id=str(hit["id"]),
#                     title=hit.get("entity", {}).get("title", ""),
#                     content=hit["entity"]["content"],
#                     url=hit["entity"]["url"] or "",
#                     metadata={},
#                     app_type='web'
#                 ))
#             )
    
#     return documents

async def get_public_docs_answer(
    user_query: str,
    org_id: str,
    user_id: str,
    previous_messages: List[PreviousMessage] = [],
):
    queue = asyncio.Queue()

    def stream_handler(message: str):
        queue.put_nowait(message)

    async def run_agent_graph():
        try:
            token_tracker = TokenUsageTracker()

            with get_db_cursor() as cursor:
                cursor.execute(
                    f"""
                    SELECT description FROM org_user_map WHERE fk_user_org = '{org_id}' AND fk_org_user = '{user_id}'
                    """
                )
                user_context_str = cursor.fetchone()["description"]

            enhanced_prompt = WEB_AGENT_PROMPT.format(
                user_context_str=user_context_str
            )

            agent_graph = custom_create_react_agent(
                model=ChatOpenAI(model="gpt-4o-mini", temperature=0.2),
                system_prompt=enhanced_prompt,
                tools=create_tools(),
                stream_handler=stream_handler,
                callbacks=[token_tracker],
                user_context_str=user_context_str,
            )

            messages = []

            for msg in previous_messages:
                if msg["sent_by_bot"]:
                    messages.append(AIMessage(content=msg["text"]))
                else:
                    messages.append(HumanMessage(content=msg["text"]))

            messages.append(HumanMessage(content=user_query))

            result = await asyncio.to_thread(
                agent_graph.invoke,
                {
                    "messages": messages,
                    "documents": [],
                    "unique_documents": {},
                    "iterations": 0,
                    "max_iterations": 1,
                },
            )

            # for message in result["messages"]:
            #     print(message.pretty_repr())

            tool_start_payload = StreamResponse(
                type="tool_choice", data={"name": "generate_final_answer_tool"}
            )
            stream_handler(f"{tool_start_payload.model_dump_json()}\n")

            documents = result.get("documents", [])

            docs_payload = StreamResponse(
                type="documents", data=[doc.dict() for doc in documents]
            )
            queue.put_nowait(f"{docs_payload.model_dump_json()}\n")

            formatted_documents_list = []
            for i, doc in enumerate(documents, 1):
                doc_string = f"Document [{i}]:\nTitle: {doc.title}\nContent: {doc.content}\n"
                formatted_documents_list.append(doc_string)
            formatted_documents_str = "\n\n---\n\n".join(formatted_documents_list)

            synthesis_history = []
            for msg in previous_messages:
                if msg["sent_by_bot"]:
                    synthesis_history.append(AIMessage(content=msg["text"]))
                else:
                    synthesis_history.append(HumanMessage(content=msg["text"]))

            final_human_message_content = """
<user_context>
{user_context_str}
</user_context>

<user_query>
{user_query}
</user_query>

<retrieved_documents>
{formatted_documents_str}
</retrieved_documents>

Based on my query, my context, and the retrieved documents, please provide the final synthesized answer.
"""

            synthesis_prompt_template = ChatPromptTemplate.from_messages(
                [
                    ("system", SYNTHESIZE_ANSWER_PROMPT),
                    MessagesPlaceholder(variable_name="chat_history"),
                    ("human", final_human_message_content),
                ]
            )
            synthesis_model = ChatOpenAI(
                model="gpt-4o-mini", temperature=0.2, streaming=True
            )
            synthesis_chain = synthesis_prompt_template | synthesis_model

            final_answer = ""

            async for chunk in synthesis_chain.astream(
                {
                    "chat_history": synthesis_history,
                    "user_query": user_query,
                    "formatted_documents_str": formatted_documents_str,
                    "user_context_str": user_context_str,
                },
                config={"callbacks": [token_tracker]},
            ):
                token = chunk.content
                if token:
                    final_answer += token
                    token_payload = StreamResponse(type="token", data=token)
                    queue.put_nowait(f"{token_payload.model_dump_json()}\n")

            token_stats = token_tracker.get_usage_stats()
            metadata_payload = StreamResponse(
                type="metadata", data={"usage_metadata": token_stats}
            )
            queue.put_nowait(f"{metadata_payload.model_dump_json()}\n")
        except asyncio.CancelledError:
            raise
        finally:
            queue.put_nowait(None)

    agent_task = asyncio.create_task(run_agent_graph())

    try:
        while True:
            message = await queue.get()
            if message is None:
                break
            yield message
    except Exception as e:
        agent_task.cancel()
    finally:
        await agent_task
