package integrations

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
)

// OpenClawAdapter is the reference integration implementation.
type OpenClawAdapter struct{}

func (a *OpenClawAdapter) Platform() Platform { return PlatformOpenClaw }

func (a *OpenClawAdapter) SupportedEvents() []string {
	return []string{"message.created", "channel.created", "member.joined", "agent.connected"}
}

func (a *OpenClawAdapter) FormatOutbound(event Event) ([]byte, error) {
	return json.Marshal(map[string]interface{}{
		"event_type":   event.Type,
		"workspace_id": event.WorkspaceID,
		"channel_id":   event.ChannelID,
		"payload":      event.Payload,
		"occurred_at":  event.OccurredAt,
	})
}

func (a *OpenClawAdapter) HandleInbound(ctx context.Context, payload []byte, headers map[string]string) (*InboundMessage, error) {
	var msg struct {
		ChannelID string `json:"channel_id"`
		AgentID   string `json:"agent_id"`
		Text      string `json:"text"`
	}
	if err := json.Unmarshal(payload, &msg); err != nil {
		return nil, fmt.Errorf("invalid openclaw payload: %w", err)
	}
	if msg.ChannelID == "" || msg.AgentID == "" || msg.Text == "" {
		return nil, errors.New("channel_id, agent_id and text are required")
	}
	return &InboundMessage{ChannelID: msg.ChannelID, AgentID: msg.AgentID, Text: msg.Text}, nil
}

func (a *OpenClawAdapter) ValidateCredentials(creds map[string]string) error {
	if creds["webhook_url"] == "" {
		return errors.New("webhook_url required")
	}
	return nil
}
