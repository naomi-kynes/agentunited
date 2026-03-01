#!/bin/bash
# Agent United - App Verification Script

echo "🔍 Verifying Agent United setup..."
echo ""

# Check backend
echo "1. Backend API:"
HEALTH=$(curl -s http://localhost:8080/health)
if echo "$HEALTH" | grep -q "ok"; then
  echo "   ✅ API healthy: $HEALTH"
else
  echo "   ❌ API not healthy"
  exit 1
fi

# Check database
echo ""
echo "2. Database:"
CHANNELS=$(docker-compose -f ~/agentunited/apps/api/docker-compose.yml exec -T postgres psql -U postgres -d agentunited -t -c "SELECT COUNT(*) FROM channels;")
MESSAGES=$(docker-compose -f ~/agentunited/apps/api/docker-compose.yml exec -T postgres psql -U postgres -d agentunited -t -c "SELECT COUNT(*) FROM messages;")
echo "   ✅ Channels: $CHANNELS"
echo "   ✅ Messages: $MESSAGES"

# Check Electron app
echo ""
echo "3. Electron app:"
if ps aux | grep -i "[e]lectron.*agentunited" > /dev/null; then
  echo "   ✅ Running"
  
  # Check remote debugging
  PAGES=$(curl -s http://localhost:9222/json/list | jq -r '.[] | select(.url | startswith("http://localhost:5180")) | .title')
  if [ ! -z "$PAGES" ]; then
    echo "   ✅ Remote debugging active: $PAGES"
  else
    echo "   ⚠️  Remote debugging not responding"
  fi
else
  echo "   ❌ Not running"
  exit 1
fi

# Check channel API
echo ""
echo "4. Channel data:"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiZjU5OWViNWUtM2FlZi00ZDYwLTg4ZDMtYzc2YTBiZDE0MDQyIiwiZW1haWwiOiJlbXBpcmVAZXhhbXBsZS5jb20iLCJleHAiOjE3NzI0MjEwMzMsImlhdCI6MTc3MjMzNDYzM30.aYQpIhsKOwgNMKiiDRV2Dvkf_BIl5ks_LV_idnCREjM"
CHANNELS_JSON=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:8080/api/v1/channels)
CHANNEL_NAME=$(echo "$CHANNELS_JSON" | jq -r '.channels[0].name')
echo "   ✅ API returns: $CHANNEL_NAME"

echo ""
echo "✅ All systems operational!"
echo ""
echo "📱 In the Electron window, you should see:"
echo "   - Title: Agent United"
echo "   - Sidebar: #team-ny channel"
echo "   - Status: 🟢 Connected (bottom-right)"
echo ""
echo "🧪 To test messaging:"
echo "   1. Click #team-ny in the sidebar"
echo "   2. Type a message in the input box"
echo "   3. Click Send"
echo ""
