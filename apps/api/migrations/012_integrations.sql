-- +goose Up
CREATE TABLE IF NOT EXISTS integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('openclaw','langgraph','autogen','custom')),
    api_key TEXT NOT NULL,
    webhook_url TEXT NOT NULL,
    event_subscriptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_integrations_workspace_id ON integrations(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integrations_platform ON integrations(platform);

-- +goose Down
DROP TABLE IF EXISTS integrations;
