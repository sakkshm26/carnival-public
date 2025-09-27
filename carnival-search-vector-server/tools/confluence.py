import requests
import base64
from typing import List
from type_classes import Document
from html_parser import extract_text_from_confluence_html
import re
from utils import formatted_doc
from database import get_db_cursor
import os


def _refresh_confluence_token(refresh_token: str):
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
            print(f"Error refreshing Confluence token: {refresh_response.text}")
            return None
    except Exception as e:
        print(f"Error refreshing Confluence token: {e}")
        return None

def get_confluence_pages_by_cql(
    cql: str, base_url: str, email: str, token: str, refresh_token: str | None = None
):
    try:
        if refresh_token:
            token = _refresh_confluence_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Confluence token")
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
        
        search_url = f"https://api.atlassian.com/ex/confluence/{cloud_id}/rest/api/content/search"

        params = {
            "cql": cql,
            "limit": 5,
            "expand": "space,body.storage",
        }

        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()

        found_snippets: List[Document] = []
        pages = response.json().get("results", [])

        for page in pages:
            page_title = page.get("title", "Untitled")
            webui_link = page.get("_links", {}).get("webui")
            if not webui_link:
                continue
            page_link = f"{base_url.rstrip('/')}/wiki{webui_link}"

            html_content = page.get("body", {}).get("storage", {}).get("value", "")
            if not html_content:
                continue

            plain_text = extract_text_from_confluence_html(html_content)

            chunks = plain_text.split("\n\n")

            for i, chunk in enumerate(chunks):
                normalized_chunk = " ".join(chunk.split())
                if len(normalized_chunk) < 20:
                    continue

                found_snippets.append(
                    formatted_doc(
                        Document(
                            id=page.get("id", ""),
                            title=page_title,
                            content=normalized_chunk,
                            url=page_link,
                            metadata={"space": page.get("space", {}).get("name", None)},
                            app_type="confluence",
                        )
                    )
                )

        return found_snippets
    except Exception as e:
        print(f"Error searching Confluence content: {e}")
        return []


# def get_confluence_users(base_url: str, email: str, token: str, limit: int = 50):
#     """
#     Get Confluence users (limit: 50)
#     """
#     try:
#         tenant_info_url = f"{base_url.rstrip('/')}/_edge/tenant_info"
#         tenant_response = requests.get(tenant_info_url)
#         tenant_response.raise_for_status()
#         cloud_id = tenant_response.json().get("cloudId")
#         if not cloud_id:
#             raise ValueError("Could not retrieve cloud_id from tenant info")
#         auth_string = f"{email}:{token}"
#         auth_bytes = auth_string.encode('ascii')
#         auth_header = base64.b64encode(auth_bytes).decode('ascii')
#         url = f"https://api.atlassian.com/scim/directory/{cloud_id}/Users"
#         headers = {
#             "Authorization": f"Basic {auth_header}",
#             "Content-Type": "application/json"
#         }
#         params = {
#             "count": limit
#         }
#         response = requests.get(url, headers=headers, params=params)
#         response.raise_for_status()
#         users = response.json().get("Resources", [])
#         formatted_response = []
#         for user in users:
#             name = user.get("displayName", "")
#             emails = user.get("emails", [])
#             email_val = emails[0]["value"] if emails else ""
#             formatted_response.append(
#                 Document(
#                     id=user.get("id", ""),
#                     title=name,
#                     content=email_val,
#                     url=f"{base_url.rstrip('/')}/wiki/people/{user.get('id', '')}",
#                     metadata={
#                         "id": user.get("id", ""),
#                         "email": email_val
#                     },
#                     app_type="confluence",
#                 )
#             )
#         return formatted_response
#     except Exception as e:
#         print(f"Error fetching Confluence users: {e}")
#         return []


def get_confluence_page(page_id: str, base_url: str, email: str, token: str, refresh_token: str | None = None):
    """
    Get a Confluence page by page_id
    """
    try:
        if refresh_token:
            token = _refresh_confluence_token(refresh_token)
            if not token:
                raise ValueError("Could not refresh Confluence token")
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
        url = f"https://api.atlassian.com/ex/confluence/{cloud_id}/rest/api/content/{page_id}"
        params = {"expand": "space,body.storage,body.view"}
        response = requests.get(url, headers=headers, params=params)
        response.raise_for_status()
        page = response.json()
        title = page.get("title", "")
        body = page.get("body", {}).get("view", {}).get("value", "")
        link = f"{base_url.rstrip('/')}/wiki{page.get('_links', {}).get('webui', '')}"
        return formatted_doc(
            Document(
                id=page_id,
                title=title,
                content=body,
                url=link,
                metadata={
                    "id": page_id,
                    "space": page.get("space", {}).get("name", ""),
                    "type": page.get("type", ""),
                },
                app_type="confluence",
            )
        )
    except Exception as e:
        print(f"Error fetching Confluence page: {e}")
        return None
