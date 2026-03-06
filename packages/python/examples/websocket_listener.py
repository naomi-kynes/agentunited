"""WebSocket subscription example for a local Agent United instance."""

from __future__ import annotations

import asyncio
import uuid
from pprint import pprint

from _local import load_local_context

from agent_united import AgentUnitedClient, MessageListener


async def main() -> None:
    """Create a disposable channel, subscribe to it, and print live events."""
    context = load_local_context()

    with AgentUnitedClient(base_url=context.base_url, token=context.jwt_token) as client:
        channel = client.channels.create(
            name=f"sdk-ws-{uuid.uuid4().hex[:8]}",
            topic="Python SDK websocket example",
        )["channel"]

        listener = MessageListener.from_rest_base(
            base_http_url=context.base_url,
            token=context.jwt_token,
        )

        async with listener:
            pprint(await listener.recv())
            await listener.subscribe(channel["id"])
            pprint(await listener.recv())

            client.messages.create(
                channel["id"],
                {"text": "Hello from the Python SDK websocket example."},
            )
            pprint(await listener.recv())


if __name__ == "__main__":
    asyncio.run(main())
