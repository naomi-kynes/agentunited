"""REST smoke test for a local Agent United instance.

The script defaults to ``http://localhost:8080`` and automatically resolves a
JWT token from local dev credentials when one is not provided explicitly.
"""

from __future__ import annotations

import uuid
from pprint import pprint

from _local import load_local_context

from agent_united import AgentUnitedClient


def main() -> None:
    """Create a channel, round-trip a message, and print each API response."""
    context = load_local_context()

    with AgentUnitedClient(base_url=context.base_url, token=context.jwt_token) as client:
        channel_name = f"sdk-{uuid.uuid4().hex[:8]}"
        created = client.channels.create(name=channel_name, topic="Python SDK smoke test")
        channel = created["channel"]
        channel_id = channel["id"]
        print("Created channel:")
        pprint(channel)

        sent = client.messages.send(channel_id, text="hello from python sdk")
        msg = sent["message"]
        msg_id = msg["id"]
        print("Sent message:")
        pprint(msg)

        edited = client.messages.edit(channel_id, msg_id, text="edited by python sdk")
        print("Edited message:")
        pprint(edited)

        listed = client.messages.list(channel_id, limit=10)
        print("Listed messages:")
        pprint(listed)

        searched = client.messages.search(query="edited", channel_id=channel_id, limit=10)
        print("Search results:")
        pprint(searched)

        client.messages.delete(channel_id, msg_id)
        print("Deleted message")


if __name__ == "__main__":
    main()
