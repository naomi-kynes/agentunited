-- +goose Up
CREATE TABLE invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    consumed_at TIMESTAMP WITH TIME ZONE,
    
    CONSTRAINT chk_invite_status CHECK (status IN ('pending', 'consumed', 'expired'))
);

CREATE INDEX idx_invites_token_hash ON invites(token_hash);
CREATE INDEX idx_invites_expires_at ON invites(expires_at);

-- +goose Down
DROP TABLE invites;