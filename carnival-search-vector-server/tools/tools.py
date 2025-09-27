from langgraph.prebuilt.tool_node import ToolNode
from langchain_core.runnables import RunnableConfig
from type_classes import Connector, Document
from langchain_core.tools import tool, BaseTool
from typing import List, Dict

from tools.slack import (
    search_slack_messages,
    get_slack_channel_messages,
    get_slack_channels,
    get_slack_users,
)
from tools.confluence import (
    get_confluence_pages_by_cql,
    get_confluence_page,
)
from tools.jira import (
    get_jira_users,
    get_jira_issues_by_jql,
    get_jira_issue_by_key,
    get_all_jira_fields,
    get_jira_projects,
    get_jira_issue_statuses,
    get_jira_issue_priorities,
    get_jira_issue_types
)
from tools.salesforce import (
    search_salesforce_records,
    get_salesforce_records_by_soql,
    get_case_statuses,
    get_lead_statuses,
    get_opportunity_stages,
    get_salesforce_object_fields,
    get_salesforce_users
)

def create_app_tools(connectors: List[Connector]):
    tools: Dict[str, List[BaseTool]] = {}

    connector_types = {conn.app_type: conn.credentials_data for conn in connectors}

    if "slack" in connector_types:

        @tool
        def slack_search_using_keyword_tool(keyword: str, sort: str = "score", sort_dir: str = "desc") -> List[Document]:
            """
            Search Slack messages for given keyword across all accessible channels and direct messages.

            Args:
                keyword (str): The search term to look for in Slack messages.
                             Examples: "project update", "deadline", "meeting notes", "bug report"
                             
                sort (str, optional): How to sort the results. Options:
                                    - "score": Sort by relevance score (default)
                                    - "timestamp": Sort by message timestamp
                                    
                sort_dir (str, optional): Sort direction. Options:
                                        - "desc": Descending order (default)
                                        - "asc": Ascending order

            Returns:
                List[Document]: List of Slack messages containing the keyword with metadata
            """
            creds = connector_types["slack"]
            return search_slack_messages(keyword, creds.get("user_access_token", ""), sort, sort_dir)
        
        @tool
        def get_slack_channels_tool() -> List[Dict]:
            """
            Get all Slack channels.
            """
            creds = connector_types["slack"]
            return get_slack_channels(creds.get("user_access_token", ""))

        tools["slack"] = [slack_search_using_keyword_tool, get_slack_channels_tool]

    if "confluence" in connector_types:

        @tool
        def get_confluence_pages_by_cql_tool(cql: str) -> List[Document]:
            """
            Get Confluence pages, blog posts, and other content for given CQL (Confluence Query Language) query.

            Args:
                cql (str): The CQL query to search for in Confluence content.
                             Examples: "text ~ 'API documentation' or text ~ 'API reference'", "text ~ 'user guide' or text ~ 'user manual'"

            Returns:
                List[Document]: List of Confluence pages and content containing the keyword with metadata
            """
            creds = connector_types["confluence"]
            return get_confluence_pages_by_cql(
                cql,
                creds.get("base_url", ""),
                creds.get("email", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", None),
            )
            
        @tool
        def get_confluence_page_by_id_tool(page_id: str) -> Document:
            """
            Get Confluence page by its ID. Example: in the url https://company.atlassian.com/wiki/spaces/SPACE/pages/1234567890/URL, the page_id is 1234567890.
            """
            creds = connector_types["confluence"]
            return get_confluence_page(page_id, creds.get("base_url", ""), creds.get("email", ""), creds.get("access_token", ""), creds.get("refresh_token", None))

        tools["confluence"] = [get_confluence_pages_by_cql_tool, get_confluence_page_by_id_tool]

    if "jira" in connector_types:
        @tool
        def get_jira_issues_by_jql_tool(
            jql: str
        ) -> List[Document]:
            """
            Get JIRA issues using a precise JQL (JIRA Query Language) query. This is the PREFERRED tool for specific, filtered searches.
            You should CONSTRUCT a JQL query to search by specific fields which can only be 'text', 'summary', 'description', 'assignee', 'status', 'priority', 'project', 'issuetype' or 'resolutiondate'. Add a default ORDER BY created DESC to the query if no ORDER BY clause is present.

            Args:
                jql (str): JQL query string to filter and search issues.
                          Examples:
                          - "text ~ 'login error' OR summary ~ 'login error' OR description ~ 'login error' ORDER BY created DESC"
                          - "project = 'PROJ' AND status = 'Open' ORDER BY created DESC"
                          - "assignee = 'John Doe' AND priority = 'High' ORDER BY created DESC"
                          - "text ~ 'login error' AND created >= '2024-01-01' AND created <= '2024-01-31' ORDER BY created DESC"
                          - "issuetype = 'Bug' ORDER BY created DESC"

            Returns:
                List[Document]: List of JIRA issues matching the JQL query with specified fields
            """
            creds = connector_types["jira"]
            return get_jira_issues_by_jql(
                jql,
                creds.get("base_url", ""),
                creds.get("email", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", None),
                limit=20
            )

        @tool
        def get_jira_users_tool() -> List[Document]:
            """
            Get list of JIRA users in the system with their basic information.

            Returns:
                List[Document]: List of JIRA users with their display names, usernames, and email addresses
            """
            creds = connector_types["jira"]
            return get_jira_users(
                creds.get("base_url", ""),
                creds.get("email", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", None),
            )

        @tool
        def get_jira_issue_by_key_tool(issue_key: str) -> Document:
            """
            Get JIRA issue by its key.

            Args:
                issue_key (str): The key of the JIRA issue to retrieve.
                             Examples: "PROJ-123", "KAN-456"

            Returns:
                Document: JIRA issue with its metadata
            """
            creds = connector_types["jira"]
            return get_jira_issue_by_key(
                issue_key,
                creds.get("base_url", ""),
                creds.get("email", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", None),
            )
            
        @tool
        def get_jira_projects_tool() -> List[Document]:
            """
            Get all JIRA projects. Use this tool when you are not sure of the available projects and need to know the projects before using the get_jira_issues_by_jql_tool.
            """
            creds = connector_types["jira"]
            return get_jira_projects(
                creds.get("base_url", ""),
                creds.get("email", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", None),
            )
            
        # @tool
        # def get_all_jira_fields_tool() -> List[Document]:
        #     """
        #     Get all fields for issues in JIRA. Use this tool when you are not sure of the available fields and need to know the field names before using the get_jira_issues_by_jql_tool.
        #     """
        #     creds = connector_types["jira"]
        #     return get_all_jira_fields(
        #         creds.get("base_url", ""),
        #         creds.get("email", ""),
        #         creds.get("access_token", ""),
        #     )
            
        @tool
        def get_jira_issue_statuses_tool() -> List[str]:
            """
            Get all possible 'status' values for the Issue object.
            """
            creds = connector_types["jira"]
            return get_jira_issue_statuses(
                creds.get("base_url", ""),
                creds.get("email", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", None),
            )
            
        @tool
        def get_jira_issue_priorities_tool() -> List[str]:
            """
            Get all possible 'priority' values for the Issue object.
            """
            creds = connector_types["jira"]
            return get_jira_issue_priorities(
                creds.get("base_url", ""),
                creds.get("email", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", None),
            )
            
        @tool
        def get_jira_issue_types_tool() -> List[str]:
            """
            Get all possible 'issuetype' values for the Issue object.
            """
            creds = connector_types["jira"]
            return get_jira_issue_types(
                creds.get("base_url", ""),
                creds.get("email", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", None),
            )

        tools["jira"] = [get_jira_issues_by_jql_tool, get_jira_users_tool, get_jira_issue_by_key_tool, get_jira_projects_tool,  get_jira_issue_statuses_tool, get_jira_issue_priorities_tool, get_jira_issue_types_tool]

    if "salesforce" in connector_types:

        @tool
        def salesforce_search_using_keyword_tool(keyword: str) -> List[Document]:
            """
            Search Salesforce records across multiple object types for given keyword.

            Args:
                keyword (str): The search term to look for in Salesforce records (accounts, contacts, opportunities, cases, etc.).
                             Examples: "customer name", "deal value", "support ticket", "email address", "phone number"

            Returns:
                List[Document]: List of Salesforce records containing the keyword with metadata
            """
            creds = connector_types["salesforce"]
            return search_salesforce_records(
                keyword,
                creds.get("instance_url", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", ""),
            )
            
        @tool
        def salesforce_search_using_soql_tool(soql_query: str) -> List[Document]:
            """
            Search Salesforce records using a SOQL query. This is the PREFERRED tool for specific, filtered searches. When writing the SELECT fields, check whether you are adding all the fields from the WHERE clause. Add a default ORDER BY created DESC to the query if no ORDER BY clause is present.

            Args:
                soql_query (str): The SOQL query to execute.
                Examples:
                - "SELECT Name, ARR__c FROM Account WHERE Name LIKE '%Acme%' AND ARR__c > 10000"
                - "SELECT Email, OwnerId FROM Contact WHERE Email LIKE '%@acme.com%' AND OwnerId = '005F9000009LVOhIAO'"
                - "SELECT Amount, StageName FROM Opportunity WHERE Amount > 10000 AND StageName = 'Closed Won'"
                - "SELECT Status, Priority FROM Case WHERE Status = 'New' AND Priority = 'High'"
                - "SELECT Status FROM Lead WHERE Status = 'Open - Not Contacted' ORDER BY CreatedDate DESC"

            Returns:
                List[Document]: List of Salesforce records matching the SOQL query with metadata
            """
            creds = connector_types["salesforce"]
            return get_salesforce_records_by_soql(
                soql_query,
                creds.get("instance_url", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", ""),
            )
            
        @tool
        def get_salesforce_lead_statuses_tool() -> List[str]:
            """
            Get all possible 'Status' values for the Lead object.
            """
            creds = connector_types["salesforce"]
            return get_lead_statuses(
                creds.get("instance_url", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", ""),
            )
            
        @tool
        def get_salesforce_case_statuses_tool() -> List[str]:
            """
            Get all possible 'Status' values for the Case object.
            """
            creds = connector_types["salesforce"]
            return get_case_statuses(
                creds.get("instance_url", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", ""),
            )
            
        @tool
        def get_salesforce_opportunity_stages_tool() -> List[str]:
            """
            Get all possible 'StageName' values for the Opportunity object.
            """
            creds = connector_types["salesforce"]
            return get_opportunity_stages(
                creds.get("instance_url", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", ""),
            )
            
        @tool
        def get_salesforce_object_fields_tool(object_name: str) -> List[str]:
            """
            Get all possible fields for a given object. Always use this tool when you need to know the field names for an object before using the salesforce_search_using_soql_tool.

            Args:
                object_name (str): The name of the object to get fields for. Options: Account, Contact, Opportunity, Case, Lead

            Returns:
                List[str]: List of fields for the given object.
            """
            creds = connector_types["salesforce"]
            return get_salesforce_object_fields(
                creds.get("instance_url", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", ""),
                object_name,
            )
            
        @tool
        def get_salesforce_users_tool() -> List[Dict[str, str]]:
            """
            Get all users in Salesforce.
            """
            creds = connector_types["salesforce"]
            return get_salesforce_users(
                creds.get("instance_url", ""),
                creds.get("access_token", ""),
                creds.get("refresh_token", ""),
            )

        tools["salesforce"] = [salesforce_search_using_keyword_tool, salesforce_search_using_soql_tool, get_salesforce_lead_statuses_tool, get_salesforce_case_statuses_tool, get_salesforce_opportunity_stages_tool, get_salesforce_object_fields_tool, get_salesforce_users_tool]

    return tools

@tool
def generate_final_answer_tool() -> str:
    """
    Call this tool ONLY when you have gathered all necessary information from other tools to comprehensively answer the user's query.
    This tool synthesizes the collected documents into a final answer and ends the process.
    Do not call this tool if you need to perform more searches or if the gathered information is insufficient.
    This is the final step.
    """
    return "Final answer generation has been triggered. The collected documents will now be synthesized."