import requests
import base64
from typing import List, Dict, Any
from type_classes import Document
from utils import formatted_doc
from database import get_db_cursor
import os


def _refresh_jira_token(refresh_token: str):
    try:
        refresh_url = f"https://auth.atlassian.com/oauth/token"
        refresh_data = { 
            "grant_type": "refresh_token", 
            "client_id": os.getenv("ATLASSIAN_CLIENT_ID"), 
            "client_secret": os.getenv("ATLASSIAN_CLIENT_SECRET"), 
            "refresh_token": refresh_token 
        }
        refresh_response = requests.post(refresh_url, data=refresh_data)
        if refresh_response.status_code == 200:
            with get_db_cursor() as cursor:
                cursor.execute(
                    "UPDATE user_connector SET credentials_data = jsonb_set(credentials_data, '{refresh_token}', %s) WHERE credentials_data->>'refresh_token' = %s",
                    (f'"{refresh_response.json().get("refresh_token")}"', refresh_token)
                )
            return refresh_response.json().get("access_token")
        else:
            print(f"Error refreshing Jira token: {refresh_response.text}")
            return None
    except Exception as e:
        print(f"Error refreshing Jira token: {e}")
        return None

def get_jira_issues_by_jql(
    jql: str,
    base_url: str,
    email: str,
    token: str,
    refresh_token: str | None = None,
    limit: int = 20,
    start: int = 0,
    expand: str | None = None
):
    try:
        if refresh_token:
            token = _refresh_jira_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Jira token")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        else:
            auth_string = f"{email}:{token}"
            auth_header = base64.b64encode(auth_string.encode("ascii")).decode("ascii")
            headers = {
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
            
        fields = "summary,description,status,assignee,reporter,priority,project,issuetype,updated,resolutiondate"
        tenant_info_url = f"{base_url.rstrip('/')}/_edge/tenant_info"
        tenant_response = requests.get(tenant_info_url)
        tenant_response.raise_for_status()
        cloud_id = tenant_response.json().get("cloudId")
        if not cloud_id:
            raise ValueError("Could not retrieve cloud_id from tenant info")
        url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/search/jql"
        payload = {
            "jql": jql,
            "maxResults": limit
        }
        if fields:
            if isinstance(fields, str):
                if fields == "*all":
                    payload["fields"] = "*all"
                else:
                    payload["fields"] = [f.strip() for f in fields.split(",")]
            else:
                payload["fields"] = fields
        if expand:
            payload["expand"] = expand
        response = requests.post(url, headers=headers, json=payload)
        response.raise_for_status()
        issues = response.json().get("issues", [])
        formatted_response: List[Document] = []
        for issue in issues:
            fields_data = issue.get("fields", {})
            description = fields_data.get("description", "")
            if isinstance(description, dict):
                description = str(description)
            link = f"{base_url.rstrip('/')}/browse/{issue['key']}"
            formatted_response.append(
                formatted_doc(
                    Document(
                        id=issue["key"],
                        title=fields_data.get("summary", issue["key"]),
                        content=description,
                        url=link,
                        metadata={
                            "key": issue["key"],
                            "status": fields_data.get("status", {}).get("name", ""),
                            "assignee": (
                                fields_data.get("assignee", {}).get("displayName", "")
                                if fields_data.get("assignee")
                                else ""
                            ),
                            "reporter": (
                                fields_data.get("reporter", {}).get("displayName", "")
                                if fields_data.get("reporter")
                                else ""
                            ),
                            "priority": (
                                fields_data.get("priority", {}).get("name", "")
                                if fields_data.get("priority")
                                else ""
                            ),
                            "project": fields_data.get("project", {}).get("name", ""),
                            "issue_type": fields_data.get("issuetype", {}).get(
                                "name", ""
                            ),
                            "updated": fields_data.get("updated", ""),
                            "resolutiondate": fields_data.get("resolutiondate", ""),
                        },
                        app_type="jira",
                    )
                )
            )
        return formatted_response
    except Exception as e:
        print(f"Error searching JIRA issues with JQL: {e}")
        return []


def get_jira_users(base_url: str, email: str, token: str, refresh_token: str | None = None, limit: int = 500):
    try:
        if refresh_token:
            token = _refresh_jira_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Jira token")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        else:
            auth_string = f"{email}:{token}"
            auth_header = base64.b64encode(auth_string.encode("ascii")).decode("ascii")
            headers = {
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        tenant_info_url = f"{base_url.rstrip('/')}/_edge/tenant_info"
        tenant_response = requests.get(tenant_info_url)
        tenant_response.raise_for_status()
        cloud_id = tenant_response.json().get("cloudId")
        if not cloud_id:
            raise ValueError("Could not retrieve cloud_id from tenant info")
        url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/2/users/search"
        params = {"username": ".", "maxResults": limit}
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        users = response.json()
        formatted_response = []
        for user in users:
            formatted_response.append({
                "id": user.get("accountId"),
                "name": user.get("displayName", user.get("name", "")),
            })
        return formatted_response
    except Exception as e:
        print(f"Error fetching Jira users: {e}")
        return []


def get_jira_issue_by_key(issue_key: str, base_url: str, email: str, token: str, refresh_token: str | None = None):
    try:
        if refresh_token:
            token = _refresh_jira_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Jira token")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        else:
            auth_string = f"{email}:{token}"
            auth_header = base64.b64encode(auth_string.encode("ascii")).decode("ascii")
            headers = {
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        tenant_info_url = f"{base_url.rstrip('/')}/_edge/tenant_info"
        tenant_response = requests.get(tenant_info_url)
        tenant_response.raise_for_status()
        cloud_id = tenant_response.json().get("cloudId")
        if not cloud_id:
            raise ValueError("Could not retrieve cloud_id from tenant info")
        url = (
            f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/2/issue/{issue_key}"
        )
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        issue = response.json()
        fields = issue.get("fields", {})
        description = fields.get("description", "")
        if isinstance(description, dict):
            description = str(description)
        link = f"{base_url.rstrip('/')}/browse/{issue_key}"
        return formatted_doc(
            Document(
                id=issue_key,
                title=fields.get("summary", ""),
                content=description,
                url=link,
                metadata={
                    "key": issue_key,
                    "status": fields.get("status", {}).get("name", ""),
                    "assignee": (
                        fields.get("assignee", {}).get("displayName", "")
                        if fields.get("assignee")
                        else ""
                    ),
                    "reporter": (
                        fields.get("reporter", {}).get("displayName", "")
                        if fields.get("reporter")
                        else ""
                    ),
                    "priority": (
                        fields.get("priority", {}).get("name", "")
                        if fields.get("priority")
                        else ""
                    ),
                    "project": fields.get("project", {}).get("name", ""),
                    "issue_type": fields.get("issuetype", {}).get("name", ""),
                    "updated": fields.get("updated", ""),
                    "resolutiondate": fields.get("resolutiondate", ""),
                },
                app_type="jira",
            )
        )
    except Exception as e:
        print(f"Error fetching JIRA issue by key: {e}")
        return None


def get_jira_projects(base_url: str, email: str, token: str, refresh_token: str | None = None) -> List[Dict[str, Any]]:
    try:
        if refresh_token:
            token = _refresh_jira_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Jira token")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        else:
            auth_string = f"{email}:{token}"
            auth_header = base64.b64encode(auth_string.encode("ascii")).decode("ascii")
            headers = {
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        tenant_info_url = f"{base_url.rstrip('/')}/_edge/tenant_info"
        tenant_response = requests.get(tenant_info_url)
        tenant_response.raise_for_status()
        cloud_id = tenant_response.json().get("cloudId")
        if not cloud_id:
            raise ValueError("Could not retrieve cloud_id from tenant info")

        url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/2/project"

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        projects = response.json()

        filtered_projects = [
            {
                "id": project.get("id"),
                "key": project.get("key"),
                "name": project.get("name"),
            }
            for project in projects
        ]

        return filtered_projects

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred while getting JIRA projects: {http_err}")
        print(f"Response body: {http_err.response.text}")
        return []
    except Exception as e:
        print(f"An error occurred while getting JIRA projects: {e}")
        return []


def get_all_jira_fields(
    base_url: str, email: str, token: str, refresh_token: str | None = None
) -> List[Dict[str, Any]]:
    try:
        if refresh_token:
            token = _refresh_jira_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Jira token")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        else:
            auth_string = f"{email}:{token}"
            auth_header = base64.b64encode(auth_string.encode("ascii")).decode("ascii")
            headers = {
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        tenant_info_url = f"{base_url.rstrip('/')}/_edge/tenant_info"
        tenant_response = requests.get(tenant_info_url)
        tenant_response.raise_for_status()
        cloud_id = tenant_response.json().get("cloudId")
        if not cloud_id:
            raise ValueError("Could not retrieve cloud_id from tenant info")

        url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/2/field"

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        all_fields = response.json()

        fields = [
            {
                "id": field.get("id"),
                "key": field.get("key"),
                "name": field.get("name"),
                "type": field.get("schema", {}).get("type"),
            }
            for field in all_fields
        ]

        return fields

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred while getting JIRA fields: {http_err}")
        print(f"Response body: {http_err.response.text}")
        return []
    except Exception as e:
        print(f"An error occurred while getting JIRA fields: {e}")
        return []


def get_jira_issue_statuses(base_url: str, email: str, token: str, refresh_token: str | None = None) -> List[str]:
    """Get a list of all available issue statuses in JIRA."""
    try:
        if refresh_token:
            token = _refresh_jira_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Jira token")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        else:
            auth_string = f"{email}:{token}"
            auth_header = base64.b64encode(auth_string.encode("ascii")).decode("ascii")
            headers = {
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        tenant_info_url = f"{base_url.rstrip('/')}/_edge/tenant_info"
        tenant_response = requests.get(tenant_info_url)
        tenant_response.raise_for_status()
        cloud_id = tenant_response.json().get("cloudId")
        if not cloud_id:
            raise ValueError("Could not retrieve cloud_id from tenant info")

        url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/2/status"

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        statuses = response.json()

        status_names = [status.get("name") for status in statuses if status.get("name")]

        return list(set(status_names))

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred while getting JIRA statuses: {http_err}")
        print(f"Response body: {http_err.response.text}")
        return []
    except Exception as e:
        print(f"An error occurred while getting JIRA statuses: {e}")
        return []


def get_jira_issue_priorities(base_url: str, email: str, token: str, refresh_token: str | None = None) -> List[str]:
    """Get a list of all available issue priorities in JIRA."""
    try:
        if refresh_token:
            token = _refresh_jira_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Jira token")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        else:
            auth_string = f"{email}:{token}"
            auth_header = base64.b64encode(auth_string.encode("ascii")).decode("ascii")
            headers = {
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        tenant_info_url = f"{base_url.rstrip('/')}/_edge/tenant_info"
        tenant_response = requests.get(tenant_info_url)
        tenant_response.raise_for_status()
        cloud_id = tenant_response.json().get("cloudId")
        if not cloud_id:
            raise ValueError("Could not retrieve cloud_id from tenant info")

        url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/2/priority"

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        priorities = response.json()

        # Extract priority names and return as list of strings
        priority_names = [priority.get("name") for priority in priorities if priority.get("name")]

        return priority_names

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred while getting JIRA priorities: {http_err}")
        print(f"Response body: {http_err.response.text}")
        return []
    except Exception as e:
        print(f"An error occurred while getting JIRA priorities: {e}")
        return []


def get_jira_issue_types(base_url: str, email: str, token: str, refresh_token: str | None = None) -> List[str]:
    """Get a list of all available issue types in JIRA."""
    try:
        if refresh_token:
            token = _refresh_jira_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Jira token")
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        else:
            auth_string = f"{email}:{token}"
            auth_header = base64.b64encode(auth_string.encode("ascii")).decode("ascii")
            headers = {
                "Authorization": f"Basic {auth_header}",
                "Content-Type": "application/json",
                "Accept": "application/json",
            }
        tenant_info_url = f"{base_url.rstrip('/')}/_edge/tenant_info"
        tenant_response = requests.get(tenant_info_url)
        tenant_response.raise_for_status()
        cloud_id = tenant_response.json().get("cloudId")
        if not cloud_id:
            raise ValueError("Could not retrieve cloud_id from tenant info")

        url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/2/issuetype"

        response = requests.get(url, headers=headers)
        response.raise_for_status()

        issue_types = response.json()

        # Extract issue type names and return as list of strings
        type_names = [issue_type.get("name") for issue_type in issue_types if issue_type.get("name")]

        return type_names

    except requests.exceptions.HTTPError as http_err:
        print(f"HTTP error occurred while getting JIRA issue types: {http_err}")
        print(f"Response body: {http_err.response.text}")
        return []
    except Exception as e:
        print(f"An error occurred while getting JIRA issue types: {e}")
        return []

