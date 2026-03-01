#!/usr/bin/env bash
# Shared config loader for Agent United OpenClaw skill
# Sources credentials from env vars or ~/.agentunited/credentials.json

CREDS_FILE="${HOME}/.agentunited/credentials.json"

if [ -n "${AGENT_UNITED_API_KEY:-}" ]; then
  # Use env vars directly
  AGENT_UNITED_URL="${AGENT_UNITED_URL:-http://localhost:8080}"
  AGENT_UNITED_CHANNEL_ID="${AGENT_UNITED_CHANNEL_ID:-}"
elif [ -f "$CREDS_FILE" ]; then
  # Load from credentials file
  AGENT_UNITED_URL="${AGENT_UNITED_URL:-http://localhost:8080}"
  AGENT_UNITED_API_KEY=$(python3 -c "import json; print(json.load(open('$CREDS_FILE'))['primary_agent']['api_key'])")
  if [ -z "${AGENT_UNITED_CHANNEL_ID:-}" ]; then
    AGENT_UNITED_CHANNEL_ID=$(python3 -c "import json; print(json.load(open('$CREDS_FILE'))['channel']['channel_id'])")
  fi
else
  echo "Error: No Agent United credentials found." >&2
  echo "Set AGENT_UNITED_API_KEY env var or run setup.sh + provision.py first." >&2
  exit 1
fi

if [ -z "${AGENT_UNITED_CHANNEL_ID:-}" ]; then
  echo "Error: AGENT_UNITED_CHANNEL_ID not set and not found in credentials." >&2
  exit 1
fi

export AGENT_UNITED_URL AGENT_UNITED_API_KEY AGENT_UNITED_CHANNEL_ID
