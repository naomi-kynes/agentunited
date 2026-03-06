"""Async WebSocket helpers for Agent United real-time events."""

from __future__ import annotations

import json
from collections.abc import AsyncIterator, Callable, Mapping
from typing import Any
from urllib.parse import urlencode, urlparse, urlunparse

from websockets.asyncio.client import ClientConnection, connect
from websockets.exceptions import ConnectionClosed


class MessageListener:
    """Listen to Agent United WebSocket events.

    Default server endpoint is ``/ws`` and currently expects a JWT token in
    the query string as ``?token=...``.
    """

    def __init__(
        self,
        *,
        url: str,
        token: str | None = None,
        headers: Mapping[str, str] | None = None,
        decoder: Callable[[str], dict[str, Any]] | None = None,
    ) -> None:
        """Configure a WebSocket listener.

        Args:
            url: Full WebSocket URL, e.g. ``ws://localhost:8080/ws``.
            token: Optional JWT token appended as query param ``token``.
            headers: Optional additional handshake headers.
            decoder: Optional payload decoder (defaults to ``json.loads``).
        """
        self._url = self._with_token(url, token) if token else url
        self._headers = dict(headers or {})
        self._decoder = decoder or json.loads
        self._connection: ClientConnection | None = None

    @classmethod
    def from_rest_base(cls, *, base_http_url: str, token: str) -> MessageListener:
        """Construct a listener from a REST base URL and JWT token."""
        parsed = urlparse(base_http_url)
        scheme = "wss" if parsed.scheme == "https" else "ws"
        ws_url = urlunparse((scheme, parsed.netloc, "/ws", "", "", ""))
        return cls(url=ws_url, token=token)

    async def connect(self) -> ClientConnection:
        """Open the WebSocket connection if it is not already open."""
        if self._connection is None:
            self._connection = await connect(self._url, additional_headers=self._headers or None)
        return self._connection

    async def close(self) -> None:
        """Close the active WebSocket connection, if one exists."""
        if self._connection is not None:
            await self._connection.close()
            self._connection = None

    async def __aenter__(self) -> MessageListener:
        """Open the socket and return the listener for async context-manager usage."""
        await self.connect()
        return self

    async def __aexit__(self, exc_type: object, exc: object, tb: object) -> None:
        """Close the socket when leaving an async context manager."""
        await self.close()

    async def subscribe(self, channel_id: str) -> None:
        """Subscribe the active connection to one channel."""
        await self.send_json({"type": "subscribe", "channel_id": channel_id})

    async def send_message(self, channel_id: str, text: str) -> None:
        """Send a real-time ``send_message`` command over the active socket."""
        await self.send_json({"type": "send_message", "channel_id": channel_id, "text": text})

    async def send_json(self, payload: Mapping[str, Any]) -> None:
        """Send a JSON payload over the active WebSocket connection."""
        websocket = await self.connect()
        await websocket.send(json.dumps(dict(payload)))

    async def recv(self) -> dict[str, Any]:
        """Receive and decode one WebSocket event from the active connection."""
        websocket = await self.connect()
        message = await websocket.recv()
        return self._decode_message(message)

    async def listen(self, *, channel_id: str | None = None) -> AsyncIterator[dict[str, Any]]:
        """Yield decoded events until the socket closes.

        Args:
            channel_id: Optional channel to subscribe to after the connection
                opens. When set, the stream will first yield the server's
                ``connected`` acknowledgement and then the ``subscribed``
                acknowledgement before channel events arrive.
        """
        try:
            async with connect(self._url, additional_headers=self._headers or None) as websocket:
                if channel_id:
                    await websocket.send(
                        json.dumps({"type": "subscribe", "channel_id": channel_id})
                    )
                async for message in websocket:
                    yield self._decode_message(message)
        except ConnectionClosed:
            return

    def _decode_message(self, message: str | bytes) -> dict[str, Any]:
        """Decode a raw websocket payload into a dictionary."""
        raw = message.decode("utf-8") if isinstance(message, bytes) else message
        payload = self._decoder(raw)
        if isinstance(payload, dict):
            return payload
        return {"data": payload}

    @staticmethod
    def _with_token(url: str, token: str) -> str:
        """Append the JWT ``token`` query parameter to a WebSocket URL."""
        parsed = urlparse(url)
        query = parsed.query
        if query:
            query = f"{query}&{urlencode({'token': token})}"
        else:
            query = urlencode({"token": token})
        return urlunparse(
            (parsed.scheme, parsed.netloc, parsed.path, parsed.params, query, parsed.fragment)
        )
