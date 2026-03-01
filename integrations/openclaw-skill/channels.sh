#!/usr/bin/env bash
# List channels from Agent United
# Usage: ./channels.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/_config.sh"

RESPONSE=$(curl -s -w "\n%{http_code}" "${AGENT_UNITED_URL}/api/v1/channels" \
  -H "Authorization: Bearer ${AGENT_UNITED_API_KEY}")

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "$BODY" | python3 -c "
import json, sys
data = json.load(sys.stdin)
channels = data.get('channels', data) if isinstance(data, dict) else data
if not channels:
    print('No channels.')
else:
    for ch in channels:
        cid = ch.get('id', ch.get('channel_id', ''))
        name = ch.get('name', '')
        topic = ch.get('topic', '')
        print(f'#{name} ({cid}) — {topic}')
"
else
  echo "✗ Failed (HTTP $HTTP_CODE)" >&2
  echo "$BODY" >&2
  exit 1
fi
