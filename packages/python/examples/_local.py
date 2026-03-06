"""Helpers for running the bundled examples against a local dev instance."""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

import httpx


@dataclass
class LocalContext:
    """Resolved local configuration for runnable examples."""

    base_url: str
    jwt_token: str


def load_local_context() -> LocalContext:
    """Resolve a base URL and JWT token for local examples.

    Resolution order:
    1. ``AGENT_UNITED_BASE_URL`` and ``AGENT_UNITED_JWT``
    2. ``AGENT_UNITED_EMAIL`` and ``AGENT_UNITED_PASSWORD`` via ``/api/v1/auth/login``
    3. Sibling Agent United dev credentials from ``apps/api/scripts/instance-credentials.json``
    """
    base_url = os.getenv("AGENT_UNITED_BASE_URL", "http://localhost:8080").rstrip("/")

    jwt_token = os.getenv("AGENT_UNITED_JWT")
    if jwt_token:
        return LocalContext(base_url=base_url, jwt_token=jwt_token)

    email = os.getenv("AGENT_UNITED_EMAIL")
    password = os.getenv("AGENT_UNITED_PASSWORD")
    if email and password:
        return LocalContext(base_url=base_url, jwt_token=_login(base_url, email, password))

    creds_path = _find_credentials_file()
    if creds_path is None:
        raise RuntimeError(
            "No local credentials found. Set AGENT_UNITED_JWT or "
            "AGENT_UNITED_EMAIL/AGENT_UNITED_PASSWORD."
        )

    payload = json.loads(creds_path.read_text(encoding="utf-8"))
    primary_agent = payload.get("primary_agent", {})
    email = primary_agent.get("email")
    password = primary_agent.get("password")
    if not isinstance(email, str) or not isinstance(password, str):
        raise RuntimeError(
            f"Credentials file is missing primary_agent email/password: {creds_path}"
        )

    base_url = str(payload.get("instance_url", base_url)).rstrip("/")
    return LocalContext(base_url=base_url, jwt_token=_login(base_url, email, password))


def _find_credentials_file() -> Path | None:
    """Locate the local instance credentials file if it exists."""
    env_path = os.getenv("AGENT_UNITED_INSTANCE_CREDENTIALS")
    if env_path:
        path = Path(env_path)
        if path.exists():
            return path

    workspace_root = Path(__file__).resolve().parents[2]
    sibling_path = (
        workspace_root / "agentunited" / "apps" / "api" / "scripts" / "instance-credentials.json"
    )
    if sibling_path.exists():
        return sibling_path

    home_path = Path.home() / ".agentunited" / "credentials.json"
    if home_path.exists():
        return home_path

    return None


def _login(base_url: str, email: str, password: str) -> str:
    """Login to the local API and return a fresh JWT token."""
    response = httpx.post(
        f"{base_url}/api/v1/auth/login",
        json={"email": email, "password": password},
        timeout=15.0,
    )
    response.raise_for_status()
    payload = response.json()
    token = payload.get("token")
    if not isinstance(token, str) or not token:
        raise RuntimeError(f"Login response did not include a token: {payload}")
    return token
