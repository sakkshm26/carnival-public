import requests
from typing import List
from type_classes import Document
from urllib.parse import urlparse, parse_qs
from utils import formatted_doc


def search_slack_messages(
    query: str, user_access_token: str, sort: str = "score", sort_dir: str = "desc"
) -> List[Document]:
    try:
        search_response = requests.post(
            f"https://slack.com/api/search.messages?query={query}&count=20&sort={sort}&sort_dir={sort_dir}",
            headers={"Authorization": f"Bearer {user_access_token}"},
        )
        search_response.raise_for_status()
        search_data = search_response.json()

        if not search_data.get("ok"):
            print(f"Slack API error during search: {search_data.get('error')}")
            return []

        formatted_response: List[Document] = []
        matches = search_data.get("messages", {}).get("matches", [])

        for match in matches:
            if not match.get("username"):
                continue

            content = match.get("text", "")
            is_thread_parent = False

            try:
                permalink = match.get("permalink", "")
                if permalink:
                    parsed_url = urlparse(permalink)
                    query_params = parse_qs(parsed_url.query)
                    thread_ts_from_url = query_params.get("thread_ts", [None])[0]

                    if thread_ts_from_url and thread_ts_from_url == match.get("ts"):
                        is_thread_parent = True
            except Exception as e:
                pass

            if is_thread_parent:
                try:
                    channel_id = match["channel"]["id"]
                    thread_parent_ts = match["ts"]

                    thread_response = requests.get(
                        "https://slack.com/api/conversations.replies",
                        params={
                            "channel": channel_id,
                            "ts": thread_parent_ts,
                            "limit": 15,
                        },
                        headers={"Authorization": f"Bearer {user_access_token}"},
                    )
                    thread_response.raise_for_status()
                    thread_data = thread_response.json()

                    if thread_data.get("ok"):
                        thread_messages = thread_data.get("messages", [])
                        full_conversation = "\n\n".join(
                            [msg.get("text", "") for msg in thread_messages]
                        )
                        content = full_conversation
                    else:
                        print(
                            f"Slack API error fetching thread {thread_parent_ts}: {thread_data.get('error')}"
                        )

                except Exception as e:
                    pass

            formatted_response.append(
                formatted_doc(
                    Document(
                        id=match["ts"],
                        title=f"{match['username']} · {match['channel']['name']}",
                        content=content,
                        url=match["permalink"],
                        metadata={
                            "channel_name": match["channel"]["name"],
                            "username": match["username"],
                        },
                        app_type="slack",
                    )
                )
            )
        return formatted_response
    except requests.exceptions.RequestException as e:
        print(f"HTTP Error searching slack messages: {e}")
        return []
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return []


def get_slack_users(user_access_token: str, limit: int = 600):
    try:
        response = requests.get(
            "https://slack.com/api/users.list",
            headers={"Authorization": f"Bearer {user_access_token}"},
            params={"limit": limit},
        )
        users = response.json().get("members", [])
        formatted_response = []
        for user in users:
            if user.get("deleted") or user.get("is_bot"):
                continue
            profile = user.get("profile", {})
            formatted_response.append({
                "id": user["id"],
                "name": profile.get("real_name", user.get("name", "")),
                "email": profile.get("email", "")
            })
        return formatted_response
    except Exception as e:
        print(f"Error fetching Slack users: {e}")
        return []


def get_slack_channels(user_access_token: str, limit: int = 999):
    try:
        response = requests.get(
            "https://slack.com/api/conversations.list",
            headers={"Authorization": f"Bearer {user_access_token}"},
            params={
                "limit": limit,
                "exclude_archived": True,
                "types": "public_channel,private_channel",
            },
        )
        channels = response.json().get("channels", [])
        formatted_response = []
        for channel in channels:
            formatted_response.append({
                "id": channel.get("id"),
                "name": channel.get("name")
            })
        return formatted_response
    except Exception as e:
        print(f"Error fetching Slack channels: {e}")
        return []


def get_slack_channel_messages(
    channel_id: str, user_access_token: str, limit: int = 15
):
    try:
        response = requests.get(
            "https://slack.com/api/conversations.history",
            headers={"Authorization": f"Bearer {user_access_token}"},
            params={"channel": channel_id, "limit": limit},
        )
        messages = response.json().get("messages", [])
        formatted_response = []
        for msg in messages:
            if msg.get("type") != "message":
                continue
            formatted_response.append(
                formatted_doc(
                    Document(
                        id=msg.get("ts"),
                        title=f"Message in {channel_id}",
                        content=msg.get("text", ""),
                        url=f"https://app.slack.com/client/{channel_id}/thread/{channel_id}-{msg.get('ts', '')}",
                        metadata={"user": msg.get("user", ""), "ts": msg.get("ts", "")},
                        app_type="slack",
                    )
                )
            )
        return formatted_response
    except Exception as e:
        print(f"Error fetching Slack channel messages: {e}")
        return []
