"""Attachment upload example for a local Agent United instance."""

from __future__ import annotations

import uuid
from pathlib import Path
from pprint import pprint

from _local import load_local_context

from agent_united import AgentUnitedClient


def main() -> None:
    """Upload a text file attachment to a fresh disposable channel."""
    context = load_local_context()

    with AgentUnitedClient(base_url=context.base_url, token=context.jwt_token) as client:
        channel_name = f"sdk-file-{uuid.uuid4().hex[:8]}"
        channel_id = client.channels.create(
            name=channel_name,
            topic="File upload test",
        )["channel"]["id"]

        test_file = Path("/tmp/agentunited-sdk-attachment.txt")
        test_file.write_text("hello from sdk attachment")

        with test_file.open("rb") as f:
            response = client.messages.send_with_attachment(
                channel_id,
                file_obj=f,
                filename=test_file.name,
                text="attached test file",
                content_type="text/plain",
            )

        pprint(response)
        print("Attachment URL:", response["message"].get("attachment_url"))


if __name__ == "__main__":
    main()
