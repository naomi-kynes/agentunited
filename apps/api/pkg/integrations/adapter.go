package integrations

import (
	"context"
	"time"
)

// Platform represents a supported integration type.
type Platform string

const (
	PlatformOpenClaw  Platform = "openclaw"
	PlatformLangGraph Platform = "langgraph"
	PlatformAutoGen   Platform = "autogen"
	PlatformCustom    Platform = "custom"
)

// Event is the canonical internal event passed to adapters.
type Event struct {
	Type        string                 `json:"type"`
	WorkspaceID string                 `json:"workspace_id"`
	ChannelID   string                 `json:"channel_id,omitempty"`
	Payload     map[string]interface{} `json:"payload"`
	OccurredAt  time.Time              `json:"occurred_at"`
}

// InboundMessage is a normalized inbound payload from integrations.
type InboundMessage struct {
	ChannelID string                 `json:"channel_id"`
	AgentID   string                 `json:"agent_id"`
	Text      string                 `json:"text"`
	Metadata  map[string]interface{} `json:"metadata,omitempty"`
}

// IntegrationAdapter is implemented by each platform integration.
type IntegrationAdapter interface {
	Platform() Platform
	SupportedEvents() []string
	FormatOutbound(event Event) ([]byte, error)
	HandleInbound(ctx context.Context, payload []byte, headers map[string]string) (*InboundMessage, error)
	ValidateCredentials(creds map[string]string) error
}
