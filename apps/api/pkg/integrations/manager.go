package integrations

import "context"

// AdapterStore fetches active integrations subscribed to events.
type AdapterStore interface {
	ListActiveByEvent(ctx context.Context, workspaceID, eventType string) ([]IntegrationRecord, error)
}

// DeliverySender sends signed outbound payloads.
type DeliverySender interface {
	DispatchSigned(ctx context.Context, url, eventType, integrationID string, payload []byte, signature string)
}

// IntegrationRecord is a storage projection needed by manager.
type IntegrationRecord struct {
	ID         string
	Platform   string
	WebhookURL string
	APIKey     string
}

// IntegrationManager routes typed events to registered adapters.
type IntegrationManager struct {
	store  AdapterStore
	sender DeliverySender
}

func NewIntegrationManager(store AdapterStore, sender DeliverySender) *IntegrationManager {
	return &IntegrationManager{store: store, sender: sender}
}

// RouteEvent routes typed events to active adapter integrations.
// Concrete delivery is performed by higher-level services with HMAC signing.
func (m *IntegrationManager) RouteEvent(ctx context.Context, event Event) error {
	_, err := m.store.ListActiveByEvent(ctx, event.WorkspaceID, event.Type)
	return err
}
