"""SDK-specific exception types."""


class AgentUnitedError(Exception):
    """Base exception for all SDK failures."""


class AgentUnitedHTTPError(AgentUnitedError):
    """Raised when the REST API returns an error response."""

    def __init__(self, status_code: int, message: str) -> None:
        """Store the HTTP status code and error message."""
        self.status_code = status_code
        self.message = message
        super().__init__(f"HTTP {status_code}: {message}")
