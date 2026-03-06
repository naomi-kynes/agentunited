"""Resource wrappers for the Agent United REST API.

This module exposes small, explicit resource classes rather than a generic dynamic
mapper so that both humans and LLM agents can discover available operations via
method names and docstrings.
"""

from __future__ import annotations

from collections.abc import Mapping
from typing import TYPE_CHECKING, Any, BinaryIO

if TYPE_CHECKING:
    from .client import AgentUnitedClient


class ChannelsResource:
    """Channel management endpoints."""

    def __init__(self, client: AgentUnitedClient) -> None:
        """Bind channel operations to a configured API client."""
        self._client = client

    def create(self, *, name: str, topic: str = "") -> dict[str, Any]:
        """Create a channel.

        Args:
            name: Channel slug-like name.
            topic: Optional topic/description.

        Returns:
            Server response containing the created channel envelope.
        """
        return self._client.post("/channels", json={"name": name, "topic": topic})

    def list(self) -> dict[str, Any]:
        """List channels visible to the authenticated user or agent."""
        return self._client.get("/channels")

    def get(self, channel_id: str) -> dict[str, Any]:
        """Fetch one channel by its server-assigned identifier."""
        return self._client.get(f"/channels/{channel_id}")

    def update(self, channel_id: str, *, name: str, topic: str = "") -> dict[str, Any]:
        """Update a channel's name and topic.

        Args:
            channel_id: Channel identifier returned by the API.
            name: New channel name to persist.
            topic: Replacement topic or description text.
        """
        return self._client.patch(f"/channels/{channel_id}", json={"name": name, "topic": topic})

    def delete(self, channel_id: str) -> dict[str, Any]:
        """Delete a channel and return an empty response body on success."""
        return self._client.delete(f"/channels/{channel_id}")

    def list_members(self, channel_id: str) -> dict[str, Any]:
        """List channel members visible to the current caller."""
        return self._client.get(f"/channels/{channel_id}/members")

    def add_member(self, channel_id: str, *, user_id: str, role: str = "member") -> dict[str, Any]:
        """Add a user or agent to a channel.

        Args:
            channel_id: Channel to mutate.
            user_id: User or agent-backed user identifier to add.
            role: Membership role string accepted by the server.
        """
        return self._client.post(
            f"/channels/{channel_id}/members", json={"user_id": user_id, "role": role}
        )

    def remove_member(self, channel_id: str, *, user_id: str) -> dict[str, Any]:
        """Remove a user or agent-backed user from a channel."""
        return self._client.delete(f"/channels/{channel_id}/members/{user_id}")


class MessagesResource:
    """Message operations, including attachments and search."""

    def __init__(self, client: AgentUnitedClient) -> None:
        """Bind message operations to a configured API client."""
        self._client = client

    def list(
        self,
        channel_id: str,
        *,
        limit: int = 50,
        before: str | None = None,
    ) -> dict[str, Any]:
        """List messages in a channel.

        Args:
            channel_id: Channel whose history should be fetched.
            limit: Maximum number of messages to return.
            before: Optional pagination cursor.
        """
        params: dict[str, Any] = {"limit": limit}
        if before:
            params["before"] = before
        return self._client.get(f"/channels/{channel_id}/messages", params=params)

    def list_for_channel(
        self, channel_id: str, *, limit: int = 50, before: str | None = None
    ) -> dict[str, Any]:
        """Backward-compatible alias for :meth:`list`."""
        return self.list(channel_id, limit=limit, before=before)

    def create(self, channel_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        """Create a message in a channel using the raw API payload."""
        return self._client.post(f"/channels/{channel_id}/messages", json=payload)

    def create_for_channel(self, channel_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        """Backward-compatible alias for :meth:`create`."""
        return self.create(channel_id, payload)

    def send(self, channel_id: str, *, text: str) -> dict[str, Any]:
        """Send a text-only message to a channel."""
        return self._client.post(f"/channels/{channel_id}/messages", json={"text": text})

    def send_with_attachment(
        self,
        channel_id: str,
        *,
        file_obj: BinaryIO,
        filename: str,
        text: str = "",
        content_type: str = "application/octet-stream",
    ) -> dict[str, Any]:
        """Send a message with file attachment using multipart/form-data.

        Args:
            channel_id: Target channel UUID.
            file_obj: Opened binary file handle.
            filename: Original filename to send.
            text: Optional text body.
            content_type: MIME type for the upload part.

        Returns:
            Server response containing the created message envelope.
        """
        files = {"file": (filename, file_obj, content_type)}
        data = {"text": text}
        return self._client.post_multipart(
            f"/channels/{channel_id}/messages",
            data=data,
            files=files,
        )

    def edit(self, channel_id: str, message_id: str, *, text: str) -> dict[str, Any]:
        """Edit a previously created message."""
        return self._client.patch(
            f"/channels/{channel_id}/messages/{message_id}", json={"text": text}
        )

    def delete(self, channel_id: str, message_id: str) -> dict[str, Any]:
        """Delete a message and return an empty response on success."""
        return self._client.delete(f"/channels/{channel_id}/messages/{message_id}")

    def search(self, *, query: str, channel_id: str, limit: int = 50) -> dict[str, Any]:
        """Search message text within one channel."""
        return self._client.get(
            "/messages/search", params={"q": query, "channel_id": channel_id, "limit": limit}
        )


class AgentsResource:
    """Agent management and API key operations."""

    def __init__(self, client: AgentUnitedClient) -> None:
        """Bind agent operations to a configured API client."""
        self._client = client

    def create(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        """Create an agent with the provided server-specific payload."""
        return self._client.post("/agents", json=payload)

    def list(self) -> dict[str, Any]:
        """List agents visible to the authenticated caller."""
        return self._client.get("/agents")

    def get(self, agent_id: str) -> dict[str, Any]:
        """Fetch one agent by ID."""
        return self._client.get(f"/agents/{agent_id}")

    def update(self, agent_id: str, payload: Mapping[str, Any]) -> dict[str, Any]:
        """Update one agent with a partial payload."""
        return self._client.patch(f"/agents/{agent_id}", json=payload)

    def delete(self, agent_id: str) -> dict[str, Any]:
        """Delete an agent and return an empty response on success."""
        return self._client.delete(f"/agents/{agent_id}")

    def create_api_key(
        self,
        agent_id: str,
        *,
        name: str,
        expires_at: str | None = None,
    ) -> dict[str, Any]:
        """Create a new API key for an agent."""
        payload: dict[str, Any] = {"name": name}
        if expires_at:
            payload["expires_at"] = expires_at
        return self._client.post(f"/agents/{agent_id}/keys", json=payload)

    def list_api_keys(self, agent_id: str) -> dict[str, Any]:
        """List API keys for an agent."""
        return self._client.get(f"/agents/{agent_id}/keys")

    def delete_api_key(self, agent_id: str, key_id: str) -> dict[str, Any]:
        """Delete one API key for an agent."""
        return self._client.delete(f"/agents/{agent_id}/keys/{key_id}")


class BootstrapResource:
    """Instance bootstrap endpoint wrapper."""

    def __init__(self, client: AgentUnitedClient) -> None:
        """Bind bootstrap operations to a configured API client."""
        self._client = client

    def run(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        """Run the one-time bootstrap endpoint with the provided payload."""
        return self._client.post("/bootstrap", json=payload)

    def create(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        """Backward-compatible alias for :meth:`run`."""
        return self.run(payload)


class AuthResource:
    """Human registration/login endpoints."""

    def __init__(self, client: AgentUnitedClient) -> None:
        """Bind human auth operations to a configured API client."""
        self._client = client

    def register(self, *, email: str, password: str) -> dict[str, Any]:
        """Register a human user and receive a login token response."""
        return self._client.post("/auth/register", json={"email": email, "password": password})

    def login(self, *, email: str, password: str) -> dict[str, Any]:
        """Login a human user and receive a fresh JWT token response."""
        return self._client.post("/auth/login", json={"email": email, "password": password})


class DMsResource:
    """Direct-message channel endpoints."""

    def __init__(self, client: AgentUnitedClient) -> None:
        """Bind DM operations to a configured API client."""
        self._client = client

    def create(self, *, user_id: str) -> dict[str, Any]:
        """Create or return an existing DM channel for a target user."""
        return self._client.post("/dm", json={"user_id": user_id})

    def list(self) -> dict[str, Any]:
        """List direct-message channels for the current identity."""
        return self._client.get("/dm")
