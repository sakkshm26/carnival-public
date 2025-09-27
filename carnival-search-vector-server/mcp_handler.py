# import asyncio
# from typing import Dict, Any, List
# from langchain_openai import ChatOpenAI
# from langchain_core.prompts import ChatPromptTemplate
# from langchain_core.output_parsers import JsonOutputParser
# from fastmcp import Client
# from mcp.types import Tool

# async def execute_mcp_call(app_type: str, user_query: str, org_id: str, connector_ids: List[str]):
#     """Execute MCP function calls based on app type"""
#     try:
#         if app_type.lower() == "slack":
#             return await execute_slack_mcp(user_query, org_id, connector_ids)
#         # elif app_type.lower() == "jira":
#         #     return await execute_jira_mcp(user_query, org_id, connector_ids)
#         else:
#             return {
#                 "status": "not_available",
#                 "app_type": app_type,
#                 "query": user_query,
#                 "message": f"MCP functions are not available for {app_type}. Only Jira and Slack are supported.",
#                 "data": []
#             }
#     except Exception as e:
#         raise Exception(f"Failed to execute MCP call for {app_type}: {e}")


# async def get_mcp_tools(mcp_server_url: str) -> List[Tool]:
#     """Get available tools from an MCP server"""
#     try:
#         async with Client(mcp_server_url) as client:
#             # Use the MCP protocol to list available tools
#             tools_response = await client.list_tools()
#             return tools_response
#     except Exception as e:
#         print(f"Failed to get tools from MCP server {mcp_server_url}: {str(e)}")
#         return []


# async def call_jira_mcp_tool(tool_name: str, params: Dict[str, Any]):
#     """Call a specific Jira MCP tool"""
#     mcp_server_url = "http://0.0.0.0:9000/mcp"
#     try:
#         async with Client(mcp_server_url) as client:
#             result = await client.call_tool(tool_name, params)
#             return result
                    
#     except Exception as e:
#         raise Exception(f"Failed to call MCP tool {tool_name}: {str(e)}")


# async def analyze_jira_query_and_select_tool(user_query: str) -> Dict[str, Any]:
#     """Use LLM to analyze query and select appropriate Jira MCP tool"""
#     # Get available tools dynamically from the MCP server
#     mcp_server_url = "http://0.0.0.0:9000/mcp"
#     available_tools = await get_mcp_tools(mcp_server_url)
    
#     llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
#     # Build the tools description dynamically
#     tools_description = ""
#     if available_tools:
#         tools_description = "Available Jira MCP tools for search/retrieval:\n"
#         for i, tool in enumerate(available_tools, 1):
#             tool_name = tool.name if hasattr(tool, 'name') else "unknown"
#             tool_desc = tool.description if hasattr(tool, 'description') else "No description available"
#             input_schema = tool.inputSchema if hasattr(tool, 'inputSchema') else {}
#             properties = input_schema.get("properties", {})
            
#             # Extract parameter names
#             param_names = list(properties.keys()) if properties else []
#             params_str = ", ".join(param_names) if param_names else "no parameters"
            
#             tools_description += f"{i}. {tool_name} - {tool_desc} (params: {params_str})\n"
#     else:
#         tools_description = "No tools available from the MCP server."
    
#     prompt = ChatPromptTemplate.from_messages([
#         ("system", f"""You are an expert at analyzing user queries to determine which Jira MCP tool to use for enterprise search.

# {tools_description}

# Query Analysis Guidelines:
# - For general search: use tools with "search" in the name
# - For specific issue keys (e.g. "PROJ-123"): use tools that get specific issues
# - For project queries: use tools that list or get project information
# - For user/assignee queries: use tools that get user information
# - For board/sprint queries: use appropriate board/sprint tools

# Analyze the query and return JSON with:
# - tool: the exact tool name to use (must be from the available tools list above)
# - params: parameters for the tool (based on the tool's input schema)
# - reasoning: why this tool was selected

# Use reasonable defaults for limits (10-20 items).
# If no suitable tool is available, suggest the most general search tool.

# Your response must be valid JSON only."""),
#         ("human", "Query: {query}")
#     ])
    
#     try:
#         response = llm.invoke(prompt.format(query=user_query))
#         parser = JsonOutputParser()
#         result = parser.parse(response.content)
        
#         # Validate that the selected tool exists
#         tool_names = [tool.name if hasattr(tool, 'name') else "unknown" for tool in available_tools]
#         if result.get("tool") not in tool_names:
#             # Fallback to first available tool or a default
#             fallback_tool = available_tools[0].name if available_tools else "jira_search"
#             result = {
#                 "tool": fallback_tool,
#                 "params": {"query": user_query, "limit": 20},
#                 "reasoning": f"Selected tool not found, using fallback: {fallback_tool}"
#             }
        
#         return result
#     except Exception as e:
#         # Fallback to general search
#         fallback_tool = available_tools[0].name if available_tools else "jira_search"
#         return {
#             "tool": fallback_tool,
#             "params": {"query": user_query, "limit": 20},
#             "reasoning": f"Fallback due to analysis error: {str(e)}"
#         }


# async def execute_jira_mcp(user_query: str, org_id: str, connector_ids: List[str]):
#     """Execute Jira MCP function calls"""
#     try:
#         tool_selection = await analyze_jira_query_and_select_tool(user_query)
#         tool_name = tool_selection["tool"]
#         params = tool_selection["params"]
#         reasoning = tool_selection.get("reasoning", "")
        
#         # Call the MCP tool and await the response
#         mcp_result = await call_jira_mcp_tool(tool_name, params)
        
#         return {
#             "status": "success",
#             "app_type": "jira",
#             "query": user_query,
#             "mcp_function": tool_name,
#             "params": params,
#             "reasoning": reasoning,
#             "message": f"Executed {tool_name} via MCP",
#             "data": mcp_result
#         }
        
#     except Exception as e:
#         return {
#             "status": "error",
#             "app_type": "jira",
#             "query": user_query,
#             "message": f"Failed to execute Jira MCP call: {str(e)}",
#             "data": []
#         }


# async def call_slack_mcp_tool(tool_name: str, params: Dict[str, Any]):
#     print("tool name ---->", tool_name)
#     print("params ---->", params)
#     mcp_server_url = "http://0.0.0.0:9002/sse"
#     if params.get("limit") is not None:
#         params["limit"] = str(params["limit"])
#     try:
#         async with Client(mcp_server_url) as client:
#             result = await client.call_tool(tool_name, params)
#             return result
                    
#     except Exception as e:
#         raise Exception(f"Failed to call MCP tool {tool_name}: {str(e)}")


# async def analyze_slack_query_and_select_tool(user_query: str) -> Dict[str, Any]:
#     """Use LLM to analyze query and select appropriate Slack MCP tool"""
#     # Get available tools dynamically from the MCP server
#     mcp_server_url = "http://0.0.0.0:9002/sse"
#     available_tools = await get_mcp_tools(mcp_server_url)
    
#     llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
    
#     # Build the tools description dynamically
#     tools_description = ""
#     if available_tools:
#         tools_description = "Available Slack MCP tools for search/retrieval:\n"
#         available_tools = [tool for tool in available_tools if tool.name in ["channels_list", "conversations_history", "conversations_replies", "conversations_search_messages"]]
#         for i, tool in enumerate(available_tools, 1):
#             tool_name = tool.name if hasattr(tool, 'name') else "unknown"
#             tool_desc = tool.description if hasattr(tool, 'description') else "No description available"
#             input_schema = tool.inputSchema if hasattr(tool, 'inputSchema') else {}
#             properties = input_schema.get("properties", {})

#             # Extract parameter names and types
#             param_details = []
#             for param_name, param_info in properties.items():
#                 param_type = param_info.get("type", "unknown")
#                 required = param_name in input_schema.get("required", [])
#                 req_str = " (required)" if required else ""
#                 param_details.append(f"{param_name}: {param_type}{req_str}")

#             params_str = ", ".join(param_details) if param_details else "no parameters"
#             tools_description += f"{i}. {tool_name} - {tool_desc}\n   Params: {params_str}\n"
#     else:
#         tools_description = "No tools available from the MCP server."
        
#     print("tools description --->", tools_description)
    
#     prompt = ChatPromptTemplate.from_messages([
#         ("system", f"""You are an expert at analyzing user queries to determine which Slack MCP tool to use for enterprise search.

#         {tools_description}

#         Query Analysis Guidelines:
#         - For listing channels: use tools with "channels" or "list" in the name
#         - For searching messages: use tools with "search" or "messages" in the name
#         - For getting specific conversation data: use tools that access conversation details

#         Analyze the query and return JSON with:
#         - tool: the exact tool name to use (must be from the available tools list above)
#         - params: parameters for the tool (extract from query or use defaults based on the tool's schema)
#         - reasoning: why this tool was selected

#         Use reasonable defaults:
#         - limit: 50 for search results, 100 for listings
#         - For channels: include appropriate channel_types if required

#         Your response must be valid JSON only."""),
#         ("human", "Query: {query}")
#     ])
    
#     try:
#         response = llm.invoke(prompt.format(query=user_query))
#         parser = JsonOutputParser()
#         result = parser.parse(response.content)
        
#         # Validate that the selected tool exists
#         tool_names = [tool.name if hasattr(tool, 'name') else "unknown" for tool in available_tools]
#         if result.get("tool") not in tool_names:
#             fallback_tool = available_tools[0].name if available_tools else "conversations_search_messages"
#             result = {
#                 "tool": fallback_tool,
#                 "params": {"search_query": user_query, "limit": "20"},
#                 "reasoning": f"Selected tool not found, using fallback: {fallback_tool}"
#             }
        
#         return result
#     except Exception as e:
#         # Fallback to general message search
#         fallback_tool = available_tools[0].name if available_tools else "conversations_search_messages"
#         return {
#             "tool": fallback_tool,
#             "params": {"search_query": user_query, "limit": "20"},
#             "reasoning": f"Fallback to general message search due to analysis error: {str(e)}"
#         }


# async def execute_slack_mcp(user_query: str, org_id: str, connector_ids: List[str]):
#     """Execute Slack MCP function calls"""
#     try:
#         tool_selection = await analyze_slack_query_and_select_tool(user_query)
#         tool_name = tool_selection["tool"]
#         params = tool_selection["params"]
#         reasoning = tool_selection.get("reasoning", "")
        
#         mcp_result = await call_slack_mcp_tool(tool_name, params)
        
#         return {
#             "status": "success",
#             "app_type": "slack",
#             "query": user_query,
#             "mcp_function": tool_name,
#             "params": params,
#             "reasoning": reasoning,
#             "message": f"Executed {tool_name} via MCP",
#             "data": mcp_result
#         }
        
#     except Exception as e:
#         return {
#             "status": "error",
#             "app_type": "slack",
#             "query": user_query,
#             "message": f"Failed to execute Slack MCP call: {str(e)}",
#             "data": []
#         }