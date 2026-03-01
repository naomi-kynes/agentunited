#!/usr/bin/env bash
# Read recent messages from Agent United
# Usage: ./read.sh [--channel CHANNEL_ID] [--limit N]
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

CHANNEL="$AGENT_UNITED_CHANNEL_ID"
LIMIT=20

while [[ $# -gt 0 ]]; do
  case "$1" in
    --channel) CHANNEL="$2"; shift 2 ;;
    --limit) LIMIT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

RESPONSE=$(curl -s -w "\n%{http_code}" "${AGENT_UNITED_URL}/api/v1/channels/${CHANNEL}/messages?limit=${LIMIT}" \
  -H "Authorization: Bearer ${AGENT_UNITED_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  # Format messages for agent readability
  echo "$BODY" | python3 -c "
import json, sys
data = json.load(sys.stdin)
messages = data.get('messages', data) if isinstance(data, dict) else data
if not messages:
    print('No messages.')
else:
    for msg in messages:
        author = msg.get('author_email', msg.get('author_type', 'unknown'))
        text = msg.get('text', '')
        ts = msg.get('created_at', '')[:19]
        print(f'[{ts}] {author}: {text}')
"
else
  echo "✗ Failed (HTTP $HTTP_CODE)" >&2
  echo "$BODY" >&2
  exit 1
fi
