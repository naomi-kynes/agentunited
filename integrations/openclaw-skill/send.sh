#!/usr/bin/env bash
# Send a message to Agent United
# Usage: ./send.sh "message text" [--channel CHANNEL_ID]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

MESSAGE="${1:?Usage: send.sh \"message text\" [--channel CHANNEL_ID]}"
shift || true

# Parse optional --channel flag
CHANNEL="$AGENT_UNITED_CHANNEL_ID"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --channel) CHANNEL="$2"; shift 2 ;;
    *) shift ;;
  esac
done

RESPONSE=$(curl -s -w "\n%{http_code}" "${AGENT_UNITED_URL}/api/v1/channels/${CHANNEL}/messages" \
  -H "Authorization: Bearer ${AGENT_UNITED_API_KEY}" \
  -H "Content-Type: application/json" \
  -d "$(python3 -c "import json,sys; print(json.dumps({'text': sys.argv[1]}))" "$MESSAGE")")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✓ Message sent to #${CHANNEL}"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
else
  echo "✗ Failed (HTTP $HTTP_CODE)" >&2
  echo "$BODY" >&2
  exit 1
fi
