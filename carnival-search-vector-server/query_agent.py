import asyncio
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from langgraph.graph import StateGraph, END
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import AIMessage, HumanMessage, ToolMessage, BaseMessage
from langchain_core.tools import BaseTool, tool
from langchain_core.callbacks import BaseCallbackHandler
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from prompts import (
    PLANNER_PROMPT,
    REPLANNER_PROMPT,
    SYNTHESIZE_ANSWER_PROMPT,
    APP_AGENT_PROMPT,
)
from type_classes import (
    Document,
    AgentState as OldAgentState,
    PreviousMessage,
    Connector,
)
from database import get_db_cursor
from tools.tools import create_app_tools

load_dotenv(override=True)


class StreamResponse(BaseModel):
    type: str
    data: Any


class TokenUsageTracker(BaseCallbackHandler):
    def __init__(self):
        self.total_input_tokens = 0
        self.total_output_tokens = 0
        self.llm_calls = 0

    def on_llm_end(self, response, **kwargs) -> None:
        token_usage = {}
        if hasattr(response, "llm_output") and response.llm_output:
            token_usage = response.llm_output.get("token_usage", {})
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


class PlanStep(BaseModel):
    task: str = Field(
        description="The specific, detailed task to be performed in this step."
    )
    app_name: str = Field(
        description="The name of the application agent that should execute this task. Must be one of {app_names}."
    )


class Plan(BaseModel):
    steps: List[PlanStep] = Field(
        description="The list of steps to execute to answer the user's query."
    )


class AgentState(BaseModel):
    messages: List[BaseMessage]
    user_query: str
    user_context_str: str
    plan: List[PlanStep]
    past_steps: List[Tuple[PlanStep, str]] = Field(default_factory=list)
    documents: List[Document] = Field(default_factory=list)
    unique_documents: Dict[str, bool] = Field(default_factory=dict)
    iteration_count: int = Field(default=0)
    max_iterations: int = Field(default=10)  # Default limit of 10 iterations


def create_app_agent_runnable(tools: List[BaseTool], llm: ChatGoogleGenerativeAI):
    prompt = ChatPromptTemplate.from_messages(
        [("system", APP_AGENT_PROMPT), MessagesPlaceholder(variable_name="messages")]
    )
    return prompt | llm.bind_tools(tools, tool_choice="any")


def create_orchestrator_graph(
    model: ChatGoogleGenerativeAI,
    app_tools: Dict[str, List[BaseTool]],
    stream_handler,
    callbacks: Optional[List[BaseCallbackHandler]] = None,
):
    structured_llm = model.with_structured_output(Plan, method="json_mode")
    
    app_agent_runnables = {
        name: create_app_agent_runnable(tools, model)
        for name, tools in app_tools.items()
    }

    def call_planner(state: AgentState):
        print("INSIDE PLANNER")
        planner_prompt = ChatPromptTemplate.from_messages(
            [("system", PLANNER_PROMPT), MessagesPlaceholder(variable_name="messages")]
        )
        planner = planner_prompt | structured_llm

        plan = planner.invoke(
            {
                "user_context_str": state.user_context_str,
                "app_names": ", ".join(app_tools.keys()),
                "current_date": datetime.now().strftime("%Y-%m-%d"),
                "messages": state.messages,
            },
            config={"callbacks": callbacks},
        )
        print("plan ---->", plan)

        for step in plan.steps:
            step.app_name = step.app_name.lower()

        return {"plan": plan.steps}

    def execute_step(state: AgentState):
        print("INSIDE EXECUTION")
        step = state.plan[0]
        app_name = step.app_name
        
        new_iteration_count = state.iteration_count + 1
        
        result_str = f"Error: No tool was called for app '{app_name}'."
        documents, unique_documents = list(state.documents), dict(state.unique_documents)
        
        if app_name not in app_agent_runnables:
            result_str = f"Error: No tools available for app '{app_name}'. Skipping step."
        else:
            agent_runnable = app_agent_runnables[app_name]
            
            # Convert past steps to ToolMessage objects
            messages = []
            for s, r in state.past_steps:
                # Add the original step as a HumanMessage
                messages.append(HumanMessage(content=s.task))
                # Add the result as a ToolMessage
                messages.append(AIMessage(content=str(r)))
            
            # Add the current step as a HumanMessage
            messages.append(HumanMessage(content=step.task))
            
            response = agent_runnable.invoke(
                {
                    "app_name": app_name,
                    "task": step.task,
                    "messages": messages,
                },
                config={"callbacks": callbacks},
            )
            
            if response.tool_calls:
                tool_call = response.tool_calls[0] 
                tool_name = tool_call["name"]
                tool_map = {t.name: t for t in app_tools[app_name]}
                
                print("calling tool -->", tool_name, " with args -->", tool_call["args"])

                if tool_name in tool_map:
                    stream_handler(StreamResponse(type="tool_choice", data={"name": tool_name, "app_type": app_name}).model_dump_json() + "\n")
                    tool_result = tool_map[tool_name].invoke(tool_call["args"])
                    
                    print("tool result ---->", tool_result)

                    result_str = f"app name: {app_name}, tool name: {tool_name}, args: {tool_call['args']}, tool result: {str(tool_result)}"

                    if isinstance(tool_result, list):
                        for doc in tool_result:
                            if isinstance(doc, Document) and doc.id not in unique_documents:
                                unique_documents[doc.id] = True
                                documents.append(doc)
                    elif isinstance(tool_result, Document) and tool_result.id not in unique_documents:
                        doc = tool_result
                        unique_documents[doc.id] = True
                        documents.append(doc)
                else:
                    result_str = f"Error: Agent tried to call tool '{tool_name}' which does not exist for app '{app_name}'."

        past_steps = state.past_steps + [(step, result_str)]
        return {
            "past_steps": past_steps,
            "documents": documents,
            "unique_documents": unique_documents,
            "iteration_count": new_iteration_count,
        }

    replanner_prompt = ChatPromptTemplate.from_messages(
        [("system", REPLANNER_PROMPT), MessagesPlaceholder(variable_name="messages")]
    )
    replanner = replanner_prompt | structured_llm

    def call_replanner(state: AgentState):
        print("INSIDE REPLANNER")
        remaining_plan_str = "\n".join(
            [f"- {s.task} (using {s.app_name})" for s in state.plan[1:]]
        )

        # Create enhanced messages list with AI messages for past steps
        enhanced_messages = list(state.messages)
        for s, r in state.past_steps:
            # Add an AI message for each completed step
            enhanced_messages.append(AIMessage(
                content=f"Step: {s.task}\nResult: {r}"
            ))

        new_plan = replanner.invoke(
            {
                "plan": remaining_plan_str,
                "app_names": ", ".join(app_tools.keys()),
                "messages": enhanced_messages,
            },
            config={"callbacks": callbacks},
        )

        print("new_plan ---->", new_plan)

        for step in new_plan.steps:
            step.app_name = step.app_name.lower()

        return {"plan": new_plan.steps}

    workflow = StateGraph(AgentState)
    workflow.add_node("planner", call_planner)
    workflow.add_node("executor", execute_step)
    workflow.add_node("replanner", call_replanner)

    workflow.set_entry_point("planner")

    def should_execute_or_end(state: AgentState):
        if state.iteration_count >= state.max_iterations:
            print(f"Maximum iterations ({state.max_iterations}) reached. Ending execution.")
            return END
        return "executor" if state.plan else END

    workflow.add_conditional_edges("planner", should_execute_or_end)
    workflow.add_edge("executor", "replanner")

    def should_continue(state: AgentState):
        if state.iteration_count >= state.max_iterations:
            print(f"Maximum iterations ({state.max_iterations}) reached. Ending execution.")
            return END
        return "executor" if state.plan else END

    workflow.add_conditional_edges("replanner", should_continue)

    return workflow.compile()


async def get_answer(
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
                    SELECT 
                        connector.app_type,
                        user_connector.credentials_data
                    FROM user_connector 
                    LEFT JOIN connector ON user_connector.fk_user_connector = connector.id 
                    WHERE user_connector.fk_connector_user = '{user_id}'
                    AND user_connector.fk_user_connector_org = '{org_id}'
                """
                )

                connector_rows = cursor.fetchall()
                connectors = []
                for index, row in enumerate(connector_rows):
                    connectors.append(
                        Connector(
                            app_type=row["app_type"],
                            credentials_data=row["credentials_data"],
                        )
                    )

                cursor.execute(
                    f"""
                    SELECT description FROM org_user_map WHERE fk_user_org = '{org_id}' AND fk_org_user = '{user_id}'
                    """
                )
                user_context_str = cursor.fetchone()["description"]
                
            if user_context_str is None:
                user_context_str = ""

            all_tools = create_app_tools(connectors)
            orchestrator_graph = create_orchestrator_graph(
                model=ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2),
                app_tools=all_tools,
                stream_handler=stream_handler,
                callbacks=[token_tracker],
            )

            messages = []
            for msg in previous_messages:
                messages.append(
                    HumanMessage(content=msg["text"])
                    if not msg["sent_by_bot"]
                    else AIMessage(content=msg["text"])
                )
            messages.append(HumanMessage(content=user_query))

            initial_state = {
                "messages": messages,
                "user_query": user_query,
                "user_context_str": user_context_str,
                "plan": [],
                "past_steps": [],
                "documents": [],
                "unique_documents": {},
                "iteration_count": 0,
                "max_iterations": 5,
            }
            result_state = await asyncio.to_thread(
                orchestrator_graph.invoke, initial_state
            )

            # for message in result_state.get("messages"):
            #     print(message.pretty_repr())            
            
            tool_start_payload = StreamResponse(
                type="tool_choice", data={"name": "generate_final_answer_tool"}
            )
            stream_handler(f"{tool_start_payload.model_dump_json()}\n")

            documents = result_state.get("documents", [])

            docs_payload = StreamResponse(
                type="documents", data=[doc.dict() for doc in documents]
            )
            queue.put_nowait(f"{docs_payload.model_dump_json()}\n")

            formatted_documents_list = []
            for i, doc in enumerate(documents, 1):
                doc_string = f"Document [{i}]:\nTitle: {doc.title}\nContent: {doc.content}\nMetadata: {doc.metadata}\nApp Type: {doc.app_type}"
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

<current_date>
Today's date: {current_date}
</current_date>

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
            # synthesis_model = ChatOpenAI(
            #     model="gpt-4o-mini", streaming=True, temperature=0.2
            # )
            synthesis_model = ChatGoogleGenerativeAI(model="gemini-2.0-flash", temperature=0.2)
            synthesis_chain = synthesis_prompt_template | synthesis_model

            final_answer = ""

            async for chunk in synthesis_chain.astream(
                {
                    "chat_history": synthesis_history,
                    "user_query": user_query,
                    "formatted_documents_str": formatted_documents_str,
                    "user_context_str": user_context_str,
                    "current_date": datetime.now().strftime("%Y-%m-%d"),
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
