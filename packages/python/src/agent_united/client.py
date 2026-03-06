"""HTTP client primitives for the Agent United REST API."""

from __future__ import annotations

from collections.abc import Mapping
from typing import Any

import httpx

from .exceptions import AgentUnitedHTTPError
from .resources import (
    AgentsResource,
    AuthResource,
    BootstrapResource,
    ChannelsResource,
    DMsResource,
    MessagesResource,
)


class AgentUnitedClient:
    """Typed wrapper around Agent United REST endpoints.

    Pass the instance root URL, such as ``http://localhost:8080``, and the
    client will target ``/api/v1`` by default. This keeps local examples short
    while still allowing callers to override the API prefix when needed.
    """

    def __init__(
        self,
        *,
        base_url: str,
        token: str | None = None,
        api_key: str | None = None,
        timeout: float = 15.0,
        default_headers: Mapping[str, str] | None = None,
        api_prefix: str = "/api/v1",
    ) -> None:
        """Create a configured REST client.

        Args:
            base_url: Instance root URL or API base URL.
            token: JWT token for human-authenticated calls.
            api_key: Agent API key (``au_...``). If both are provided, ``token`` is used.
            timeout: HTTP timeout in seconds.
            default_headers: Optional headers merged into every request.
            api_prefix: Prefix used for relative REST paths.
        """
        normalized_base_url = base_url.rstrip("/")
        normalized_api_prefix = self._normalize_api_prefix(api_prefix)
        headers = {"Accept": "application/json"}
        if default_headers:
            headers.update(default_headers)

        auth_value = token or api_key
        if auth_value:
            headers["Authorization"] = f"Bearer {auth_value}"
        headers.setdefault("User-Agent", "agent-united-python-sdk/0.1.0")

        self._client = httpx.Client(
            base_url=normalized_base_url,
            headers=headers,
            timeout=timeout,
        )
        self._api_prefix = normalized_api_prefix

        self.auth = AuthResource(self)
        self.bootstrap = BootstrapResource(self)
        self.channels = ChannelsResource(self)
        self.messages = MessagesResource(self)
        self.agents = AgentsResource(self)
        self.dms = DMsResource(self)

    def close(self) -> None:
        """Close the underlying HTTP session."""
        self._client.close()

    def __enter__(self) -> AgentUnitedClient:
        """Return the client for ``with`` block usage."""
        return self

    def __exit__(self, exc_type: object, exc: object, tb: object) -> None:
        """Close the client when leaving a context manager."""
        self.close()

    def get(self, path: str, *, params: Mapping[str, Any] | None = None) -> dict[str, Any]:
        """Issue a ``GET`` request against a relative or fully-qualified API path."""
        return self._request("GET", path, params=params)

    def post(
        self,
        path: str,
        *,
        json: Mapping[str, Any] | None = None,
        params: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Issue a ``POST`` request against a relative or fully-qualified API path."""
        return self._request("POST", path, json=json, params=params)

    def post_multipart(
        self,
        path: str,
        *,
        data: Mapping[str, Any] | None = None,
        files: Mapping[str, Any] | None = None,
        params: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Issue a multipart ``POST`` request for attachment uploads."""
        response = self._client.post(
            self._qualify_path(path),
            data=data,
            files=files,
            params=params,
        )
        return self._handle_response(response)

    def patch(
        self,
        path: str,
        *,
        json: Mapping[str, Any] | None = None,
        params: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Issue a ``PATCH`` request against a relative or fully-qualified API path."""
        return self._request("PATCH", path, json=json, params=params)

    def delete(self, path: str, *, params: Mapping[str, Any] | None = None) -> dict[str, Any]:
        """Issue a ``DELETE`` request against a relative or fully-qualified API path."""
        return self._request("DELETE", path, params=params)

    def _request(
        self,
        method: str,
        path: str,
        *,
        json: Mapping[str, Any] | None = None,
        params: Mapping[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Perform an HTTP request and decode the JSON response payload."""
        response = self._client.request(method, self._qualify_path(path), json=json, params=params)
        return self._handle_response(response)

    def _handle_response(self, response: httpx.Response) -> dict[str, Any]:
        """Normalize successful and error HTTP responses into SDK return values."""
        if response.is_error:
            message = self._extract_error_message(response)
            raise AgentUnitedHTTPError(response.status_code, message)

        if response.status_code == 204 or not response.content:
            return {}

        payload = response.json()
        if isinstance(payload, dict):
            return payload
        return {"data": payload}

    @staticmethod
    def _extract_error_message(response: httpx.Response) -> str:
        """Extract a readable API error message from the response body."""
        try:
            payload = response.json()
        except ValueError:
            return response.text or "Unknown error"

        if isinstance(payload, dict):
            for key in ("message", "error", "detail"):
                value = payload.get(key)
                if isinstance(value, str) and value:
                    return value

        return response.text or "Unknown error"

    @staticmethod
    def _normalize_api_prefix(api_prefix: str) -> str:
        """Normalize an API prefix into ``/segment`` form."""
        prefix = api_prefix.strip() or "/api/v1"
        if not prefix.startswith("/"):
            prefix = f"/{prefix}"
        return prefix.rstrip("/")

    def _qualify_path(self, path: str) -> str:
        """Expand a relative resource path under the configured API prefix."""
        if path.startswith("http://") or path.startswith("https://"):
            return path
        if path.startswith(self._api_prefix):
            return path
        if not path.startswith("/"):
            path = f"/{path}"
        return f"{self._api_prefix}{path}"
