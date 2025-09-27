import requests
from typing import List, Optional
from type_classes import Document
import re
from typing import Any, Dict, Set
from utils import formatted_doc
import os

FIELD_MAPPINGS = {
    "Account": "Id, Name, Phone",
    "Contact": "Id, Name, Email, Account.Name",
    "Lead": "Id, Name, Email, Company, Status",
    "Opportunity": "Id, Name, StageName, Amount, Account.Name",
    "Case": "Id, CaseNumber, Subject, Status, Priority, Account.Name, Description, Owner.Name",
    "User": "Id, Name",
}

def _refresh_salesforce_token(instance_url: str, refresh_token: str) -> Optional[str]:
    try:
        refresh_url = f"{instance_url.rstrip('/')}/services/oauth2/token"
        refresh_data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
            "client_id": os.getenv("SALESFORCE_CLIENT_ID"),
            "client_secret": os.getenv("SALESFORCE_CLIENT_SECRET"),
        }
        refresh_response = requests.post(refresh_url, data=refresh_data)
        if refresh_response.status_code == 200:
            return refresh_response.json().get("access_token")
        else:
            print(
                f"Warning: Token refresh failed with status {refresh_response.status_code}: {refresh_response.text}"
            )
            return None
    except Exception as refresh_error:
        print(
            f"Warning: An exception occurred during token refresh. Error: {refresh_error}"
        )
        return None


def search_salesforce_records(
    query: str, instance_url: str, access_token: str, refresh_token: str
) -> List[Document]:
    try:
        access_token = _refresh_salesforce_token(instance_url, refresh_token)
        if not access_token:
            return []

        sosl_query = f"FIND {{{query}}} IN ALL FIELDS RETURNING Account(Id, Name, Phone, CreatedDate ORDER BY CreatedDate DESC), Contact(Id, Name, Email, Account.Name, CreatedDate ORDER BY CreatedDate DESC), Lead(Id, Name, Email, Company, Status, CreatedDate ORDER BY CreatedDate DESC), Opportunity(Id, Name, StageName, Amount, Account.Name, CreatedDate ORDER BY CreatedDate DESC), Case(Id, CaseNumber, Subject, Status, Priority, Account.Name, Description, CreatedDate ORDER BY CreatedDate DESC) LIMIT 20"

        search_url = f"{instance_url.rstrip('/')}/services/data/v58.0/search/"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        params = {"q": sosl_query}

        response = requests.get(search_url, headers=headers, params=params)
        response.raise_for_status()

        search_records = response.json().get("searchRecords", [])
        formatted_response: List[Document] = []

        for record in search_records:
            attributes = record.get("attributes", {})
            record_type = attributes.get("type", "")
            record_id = record.get("Id", "")

            title = ""
            metadata = {"record_type": record_type, "record_id": record_id}

            if record_type == "Account":
                title = record.get("Name", "")
                metadata.update({"type": record_type, "phone": record.get("Phone")})

            elif record_type == "Contact":
                title = record.get("Name", "")
                account_name = (
                    record.get("Account", {}).get("Name")
                    if record.get("Account")
                    else "N/A"
                )
                metadata.update(
                    {
                        "type": record_type,
                        "email": record.get("Email"),
                        "account_name": account_name,
                    }
                )

            elif record_type == "Lead":
                title = record.get("Name", "")
                metadata.update(
                    {
                        "type": record_type,
                        "email": record.get("Email"),
                        "company": record.get("Company"),
                        "status": record.get("Status"),
                    }
                )

            elif record_type == "Opportunity":
                title = record.get("Name", "")
                account_name = (
                    record.get("Account", {}).get("Name")
                    if record.get("Account")
                    else "N/A"
                )
                metadata.update(
                    {
                        "type": record_type,
                        "stage_name": record.get("StageName"),
                        "amount": record.get("Amount"),
                        "account_name": account_name,
                    }
                )

            elif record_type == "Case":
                title = record.get("Subject", "")
                account_name = (
                    record.get("Account", {}).get("Name")
                    if record.get("Account")
                    else "N/A"
                )
                metadata.update(
                    {
                        "type": record_type,
                        "case_number": record.get("CaseNumber"),
                        "status": record.get("Status"),
                        "priority": record.get("Priority"),
                        "account_name": account_name,
                    }
                )

            formatted_response.append(
                formatted_doc(
                    Document(
                        id=record_id,
                        title=title,
                        content=record.get("Description", ""),
                        url=f"{instance_url.rstrip('/')}/{record_id}",
                        metadata=metadata,
                        app_type="salesforce",
                    )
                )
            )

        return formatted_response

    except requests.exceptions.RequestException as e:
        print(f"Error during Salesforce API request: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred while searching Salesforce records: {e}")
        return []


def _prepare_soql_for_document_conversion(soql_query: str) -> str:
    from_match = re.search(
        r"\sFROM\s+([a-zA-Z_][a-zA-Z0-9_]*)", soql_query, re.IGNORECASE
    )
    if not from_match:
        print(
            "Warning: Could not determine object from query. Returning original query."
        )
        return soql_query

    object_name = from_match.group(1)

    standard_fields_str = FIELD_MAPPINGS.get(object_name.capitalize())
    if not standard_fields_str:
        print(
            f"Warning: No standard field mapping for object '{object_name}'. Returning original query."
        )
        return soql_query

    combined_fields: Set[str] = {
        field.strip() for field in standard_fields_str.split(",")
    }

    select_match = re.search(
        r"SELECT\s+(.*?)\s+FROM", soql_query, re.IGNORECASE | re.DOTALL
    )
    if select_match:
        original_fields_str = select_match.group(1)
        original_fields = {field.strip() for field in original_fields_str.split(",")}

        combined_fields.update(original_fields)

    new_fields_clause = ", ".join(sorted(list(combined_fields)))

    modified_query = re.sub(
        r"SELECT\s+.*?\s+FROM",
        f"SELECT {new_fields_clause} FROM",
        soql_query,
        count=1,
        flags=re.IGNORECASE | re.DOTALL,
    )

    modified_query = re.sub(r"\s+LIMIT\s+\d+", "", modified_query, flags=re.IGNORECASE)

    final_query = modified_query.strip() + " LIMIT 20"

    return final_query


def get_salesforce_records_by_soql(
    soql_query: str, instance_url: str, access_token: str, refresh_token: str
) -> List[Document]:
    try:
        access_token = _refresh_salesforce_token(instance_url, refresh_token)
        if not access_token:
            return []

        prepared_query = _prepare_soql_for_document_conversion(soql_query)

        query_url = f"{instance_url.rstrip('/')}/services/data/v58.0/query/"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }
        params = {"q": prepared_query}

        response = requests.get(query_url, headers=headers, params=params)
        response.raise_for_status()

        records = response.json().get("records", [])
        formatted_response: List[Document] | List[Dict[str, Any]] = []

        for record in records:
            record_id = record.get("Id")
            if not record_id:
                continue

            attributes = record.get("attributes", {})
            record_type = attributes.get("type", "")

            if record_type == "User":
                formatted_response.append({"id": record_id, "name": record.get("Name")})
                continue
            elif record_type == "Case":
                title = record.get("Subject", record_id)
            else:
                title = record.get("Name", record_id)

            content = record.get("Description", "")

            record_url = f"{instance_url.rstrip('/')}/{record_id}"

            metadata = {
                k: v
                for k, v in record.items()
                if k not in ["Name", "Subject", "Description", "Id", "attributes"]
            }
            metadata["type"] = record_type

            formatted_response.append(
                formatted_doc(
                    Document(
                        id=record_id,
                        title=title,
                        content=content,
                        url=record_url,
                        metadata=metadata,
                        app_type="salesforce",
                    )
                )
            )

        return formatted_response

    except requests.exceptions.RequestException as e:
        print(f"Error during Salesforce API request: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred while processing SOQL query: {e}")
        return []


def _get_picklist_values(
    object_name: str,
    field_name: str,
    instance_url: str,
    access_token: str,
    refresh_token: str,
) -> List[str]:
    new_access_token = _refresh_salesforce_token(instance_url, refresh_token)
    if new_access_token:
        access_token = new_access_token

    try:
        describe_url = f"{instance_url.rstrip('/')}/services/data/v58.0/sobjects/{object_name}/describe"
        headers = {
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        }

        response = requests.get(describe_url, headers=headers)
        response.raise_for_status()

        metadata = response.json()

        for field in metadata.get("fields", []):
            if field.get("name") == field_name:
                picklist_values = [
                    pv["label"]
                    for pv in field.get("picklistValues", [])
                    if pv.get("active")
                ]
                return picklist_values

        print(f"Error: Field '{field_name}' not found on object '{object_name}'.")
        return []

    except requests.exceptions.RequestException as e:
        print(f"Error during Salesforce API request for {object_name} metadata: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred while getting picklist values: {e}")
        return []


def get_lead_statuses(
    instance_url: str, access_token: str, refresh_token: str
) -> List[str]:
    return _get_picklist_values(
        "Lead", "Status", instance_url, access_token, refresh_token
    )


def get_opportunity_stages(
    instance_url: str, access_token: str, refresh_token: str
) -> List[str]:
    return _get_picklist_values(
        "Opportunity", "StageName", instance_url, access_token, refresh_token
    )


def get_case_statuses(
    instance_url: str, access_token: str, refresh_token: str
) -> List[str]:
    return _get_picklist_values(
        "Case", "Status", instance_url, access_token, refresh_token
    )


def get_salesforce_object_fields(
    instance_url: str, access_token: str, refresh_token: str, record_type: str
) -> List[str]:
    try:
        refreshed_access_token = _refresh_salesforce_token(instance_url, refresh_token)
        if not refreshed_access_token:
            print("Error: Failed to refresh Salesforce token.")
            return []

        describe_url = f"{instance_url.rstrip('/')}/services/data/v58.0/sobjects/{record_type}/describe"

        headers = {
            "Authorization": f"Bearer {refreshed_access_token}",
            "Content-Type": "application/json",
        }

        response = requests.get(describe_url, headers=headers)

        response.raise_for_status()

        data = response.json()

        field_definitions = data.get("fields", [])

        field_names = [field["name"] for field in field_definitions]

        return field_names

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(
                f"Error: The Salesforce object '{record_type}' was not found. Please check the API name."
            )
        else:
            print(f"Error: HTTP error during Salesforce API request: {e}")
            print(f"Response Body: {e.response.text}")
        return []
    except requests.exceptions.RequestException as e:
        print(f"Error: A network-related error occurred: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []


def get_salesforce_users(
    instance_url: str, access_token: str, refresh_token: str
) -> List[Dict[str, str]]:
    try:
        refreshed_access_token = _refresh_salesforce_token(instance_url, refresh_token)
        if not refreshed_access_token:
            print("Error: Failed to refresh Salesforce token.")
            return []

        soql_query = "SELECT Id, Name FROM User WHERE IsActive = true ORDER BY Name LIMIT 1000"
        
        query_url = f"{instance_url.rstrip('/')}/services/data/v58.0/query/"
        headers = {
            "Authorization": f"Bearer {refreshed_access_token}",
            "Content-Type": "application/json",
        }
        params = {"q": soql_query}

        response = requests.get(query_url, headers=headers, params=params)
        response.raise_for_status()

        records = response.json().get("records", [])
        users = []

        for record in records:
            user_id = record.get("Id")
            user_name = record.get("Name")
            
            if user_id and user_name:
                users.append({
                    "id": user_id,
                    "name": user_name
                })

        return users

    except requests.exceptions.RequestException as e:
        print(f"Error during Salesforce API request for users: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred while getting Salesforce users: {e}")
        return []
