"""Live integration tests for a local Agent United instance."""

from __future__ import annotations

import asyncio
import json
import os
import uuid
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import httpx
import pytest

from agent_united import AgentUnitedClient, AgentUnitedHTTPError, MessageListener


@dataclass
class LiveContext:
    """Resolved credentials and state for live-server integration tests."""

    base_url: str
    jwt_token: str
    bootstrap_status: int
    bootstrap_response: dict[str, Any] | None


def _candidate_credentials_paths() -> list[Path]:
    """Return the local credential files commonly present in dev setups."""
    candidates: list[Path] = []
    env_path = os.getenv("AGENT_UNITED_INSTANCE_CREDENTIALS")
    if env_path:
        candidates.append(Path(env_path))

    workspace_root = Path(__file__).resolve().parents[2]
    candidates.append(
        workspace_root / "agentunited" / "apps" / "api" / "scripts" / "instance-credentials.json"
    )

    home_creds = Path.home() / ".agentunited" / "credentials.json"
    candidates.append(home_creds)
    return candidates


def _load_existing_login_credentials() -> tuple[str, str] | None:
    """Load an email and password for an already-bootstrapped local instance."""
    env_email = os.getenv("AGENT_UNITED_EMAIL")
    env_password = os.getenv("AGENT_UNITED_PASSWORD")
    if env_email and env_password:
        return env_email, env_password

    for path in _candidate_credentials_paths():
        if not path.exists():
            continue
        parsed = json.loads(path.read_text(encoding="utf-8"))
        primary_agent = parsed.get("primary_agent")
        if isinstance(primary_agent, dict):
            email = primary_agent.get("email")
            password = primary_agent.get("password")
            if isinstance(email, str) and isinstance(password, str):
                return email, password
    return None


def _login(base_url: str, email: str, password: str) -> str:
    """Exchange local test credentials for a fresh JWT token."""
    response = httpx.post(
        f"{base_url.rstrip('/')}/api/v1/auth/login",
        json={"email": email, "password": password},
        timeout=15.0,
    )
    response.raise_for_status()
    payload = response.json()
    token = payload.get("token")
    assert isinstance(token, str) and token, payload
    return token


def _bootstrap_payload() -> dict[str, Any]:
    """Build a valid bootstrap payload for a fresh local instance."""
    suffix = uuid.uuid4().hex[:8]
    return {
        "primary_agent": {
            "email": f"python-sdk-{suffix}@example.com",
            "password": "PythonSdkStable123!",
            "agent_profile": {
                "name": f"python-sdk-{suffix}",
                "display_name": "Python SDK Stable Test Agent",
                "description": "Bootstrap validation for the Python SDK.",
            },
        },
        "agents": [],
        "humans": [],
        "default_channel": {
            "name": f"python-sdk-{suffix}",
            "topic": "Bootstrap validation for the Python SDK.",
        },
    }


@pytest.fixture(scope="session")
def live_context() -> LiveContext:
    """Return a live test context for the local Agent United instance."""
    base_url = os.getenv("AGENT_UNITED_BASE_URL", "http://localhost:8080")

    bootstrap_client = AgentUnitedClient(base_url=base_url)
    try:
        response = bootstrap_client.bootstrap.run(_bootstrap_payload())
    except AgentUnitedHTTPError as exc:
        if exc.status_code != 409:
            raise
        creds = _load_existing_login_credentials()
        if creds is None:
            pytest.skip(
                "bootstrap returned 409 and no local login credentials were found; "
                "set AGENT_UNITED_EMAIL and AGENT_UNITED_PASSWORD to run live tests"
            )
        jwt_token = _login(base_url, creds[0], creds[1])
        return LiveContext(
            base_url=base_url,
            jwt_token=jwt_token,
            bootstrap_status=exc.status_code,
            bootstrap_response=None,
        )
    else:
        primary_agent = response.get("primary_agent", {})
        jwt_token = primary_agent.get("jwt_token")
        assert isinstance(jwt_token, str) and jwt_token, response
        return LiveContext(
            base_url=base_url,
            jwt_token=jwt_token,
            bootstrap_status=201,
            bootstrap_response=response,
        )
    finally:
        bootstrap_client.close()


def test_bootstrap_contract(live_context: LiveContext) -> None:
    """Bootstrap should either initialize a fresh instance or report idempotency."""
    assert live_context.bootstrap_status in {201, 409}

    if live_context.bootstrap_status == 201:
        assert live_context.bootstrap_response is not None
        assert "primary_agent" in live_context.bootstrap_response
        assert "channel" in live_context.bootstrap_response


def test_channels_and_messages_rest(live_context: LiveContext) -> None:
    """The SDK should create channels and round-trip channel messages over REST."""
    client = AgentUnitedClient(base_url=live_context.base_url, token=live_context.jwt_token)
    unique_name = f"python-sdk-rest-{uuid.uuid4().hex[:8]}"

    channels_before = client.channels.list()
    assert "channels" in channels_before

    created_channel = client.channels.create(
        name=unique_name,
        topic="REST integration test channel created by the Python SDK.",
    )
    channel = created_channel["channel"]
    channel_id = channel["id"]
    assert channel["name"] == unique_name

    message_text = f"REST integration test message {uuid.uuid4().hex[:8]}"
    created_message = client.messages.create(channel_id, {"text": message_text})
    message = created_message["message"]
    assert message["text"] == message_text

    messages = client.messages.list(channel_id, limit=20)
    returned_texts = [item["text"] for item in messages["messages"]]
    assert message_text in returned_texts

    fetched_channel = client.channels.get(channel_id)
    assert fetched_channel["channel"]["id"] == channel_id
    client.close()


def test_messages_websocket(live_context: LiveContext) -> None:
    """The SDK should receive a WebSocket event after a REST message is posted."""
    client = AgentUnitedClient(base_url=live_context.base_url, token=live_context.jwt_token)
    created_channel = client.channels.create(
        name=f"python-sdk-ws-{uuid.uuid4().hex[:8]}",
        topic="WebSocket integration test channel created by the Python SDK.",
    )
    channel_id = created_channel["channel"]["id"]
    expected_text = f"WS integration message {uuid.uuid4().hex[:8]}"

    async def exercise_websocket() -> None:
        def post_message() -> dict[str, Any]:
            with AgentUnitedClient(
                base_url=live_context.base_url,
                token=live_context.jwt_token,
            ) as message_client:
                return message_client.messages.create(channel_id, {"text": expected_text})

        listener = MessageListener.from_rest_base(
            base_http_url=live_context.base_url,
            token=live_context.jwt_token,
        )
        async with listener:
            connected = await asyncio.wait_for(listener.recv(), timeout=10.0)
            assert connected["type"] == "connected"

            await listener.subscribe(channel_id)
            subscribed = await asyncio.wait_for(listener.recv(), timeout=10.0)
            assert subscribed["type"] == "subscribed"
            assert subscribed["channel_id"] == channel_id

            await asyncio.to_thread(post_message)

            event = await asyncio.wait_for(listener.recv(), timeout=10.0)
            assert event["type"] == "message.created"
            assert event["data"]["text"] == expected_text
            assert event["data"]["channel_id"] == channel_id

    asyncio.run(exercise_websocket())
    client.close()
