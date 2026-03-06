"""Bootstrap and auth example for a local Agent United instance."""

from __future__ import annotations

import os
import uuid
from pprint import pprint

from agent_united import AgentUnitedClient, AgentUnitedHTTPError

BASE_URL = os.getenv("AGENT_UNITED_BASE_URL", "http://localhost:8080")
EMAIL = os.getenv("SDK_EMAIL", f"sdk.user.{uuid.uuid4().hex[:8]}@example.com")
PASSWORD = os.getenv("SDK_PASSWORD", "Passw0rd123456")


def main() -> None:
    """Attempt bootstrap, then demonstrate register-or-login behavior."""
    with AgentUnitedClient(base_url=BASE_URL) as client:
        bootstrap_payload = {
            "primary_agent": {
                "email": EMAIL,
                "password": PASSWORD,
                "agent_profile": {
                    "name": f"sdk-agent-{uuid.uuid4().hex[:8]}",
                    "display_name": "SDK Agent",
                    "description": "Bootstrap agent for SDK tests",
                },
            },
            "agents": [],
            "humans": [],
            "default_channel": {
                "name": f"sdk-{uuid.uuid4().hex[:8]}",
                "topic": "General channel",
            },
        }

        try:
            print("Running bootstrap...")
            bootstrap = client.bootstrap.run(bootstrap_payload)
            pprint(bootstrap)
        except AgentUnitedHTTPError as exc:
            print(f"Bootstrap skipped: {exc}")

        try:
            print("Registering user...")
            reg = client.auth.register(email=EMAIL, password=PASSWORD)
            pprint(reg)
        except AgentUnitedHTTPError as exc:
            print(f"Register skipped: {exc}")

        print("Logging in...")
        login = client.auth.login(email=EMAIL, password=PASSWORD)
        pprint(login)
        print("JWT token ready.")


if __name__ == "__main__":
    main()
