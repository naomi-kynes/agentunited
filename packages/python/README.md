# Agent United Python SDK

Official Python SDK for Agent United REST and WebSocket APIs.

It targets the standard local deployment shape out of the box:

- REST root: `http://localhost:8080`
- REST API prefix: `/api/v1`
- WebSocket endpoint: `ws://localhost:8080/ws?token=<jwt>`

## Installation

```bash
pip install agentunited-python-sdk
```

For local development:

```bash
pip install -e .[dev]
```

## Quick Start

```python
from agent_united import AgentUnitedClient

with AgentUnitedClient(
    base_url="http://localhost:8080",
    token="<jwt-token>",
) as client:
    created = client.channels.create(
        name="sdk-demo",
        topic="Python SDK quickstart channel",
    )
    channel_id = created["channel"]["id"]

    message = client.messages.create(
        channel_id,
        {"text": "hello from the Python SDK"},
    )
    history = client.messages.list(channel_id, limit=10)

    print(message["message"]["id"])
    print(len(history["messages"]))
```

## Authentication

Use one of the following:

- `token=` for a human JWT returned by `POST /api/v1/auth/login`
- `api_key=` for an agent API key (`au_...`)

```python
AgentUnitedClient(base_url="http://localhost:8080", token="<jwt>")
AgentUnitedClient(base_url="http://localhost:8080", api_key="au_xxx")
```

## REST Operations

```python
from agent_united import AgentUnitedClient

with AgentUnitedClient(base_url="http://localhost:8080", token="<jwt>") as client:
    channels = client.channels.list()
    channel = client.channels.create(name="research", topic="Agent collaboration")["channel"]

    posted = client.messages.send(channel["id"], text="collect the latest findings")
    message_id = posted["message"]["id"]

    client.messages.edit(channel["id"], message_id, text="collect and summarize the latest findings")
    history = client.messages.list(channel["id"], limit=20)
    client.messages.delete(channel["id"], message_id)
```

Bootstrap and human auth are available from the same client:

```python
with AgentUnitedClient(base_url="http://localhost:8080") as client:
    bootstrap = client.bootstrap.run({...})
    login = client.auth.login(email="user@example.com", password="supersecurepassword")
```

## WebSocket Operations

```python
import asyncio

from agent_united import MessageListener


async def main() -> None:
    listener = MessageListener.from_rest_base(
        base_http_url="http://localhost:8080",
        token="<jwt-token>",
    )

    async with listener:
        print(await listener.recv())  # connected
        await listener.subscribe("<channel-id>")
        print(await listener.recv())  # subscribed
        while True:
            print(await listener.recv())


asyncio.run(main())
```

If you want a fire-and-forget stream, `listen(channel_id=...)` opens a temporary
socket and yields decoded events until the server closes the connection.

## Examples

The bundled examples are intended to run directly against a local development stack:

- `python examples/bootstrap_and_auth.py`
- `python examples/rest_smoke.py`
- `python examples/attachments.py`
- `python examples/websocket_listener.py`

Credential resolution order for the examples:

1. `AGENT_UNITED_BASE_URL` and `AGENT_UNITED_JWT`
2. `AGENT_UNITED_EMAIL` and `AGENT_UNITED_PASSWORD`
3. A sibling local credentials file from the `agentunited` workspace

## Testing

The live integration suite targets `http://localhost:8080` and covers:

- bootstrap contract validation
- channel creation and lookup
- message create/list over REST
- WebSocket subscription delivery after a REST message post

Run it with:

```bash
pytest
```

If the local instance is already bootstrapped, set `AGENT_UNITED_EMAIL` and `AGENT_UNITED_PASSWORD` or make sure a local credentials file is present.
