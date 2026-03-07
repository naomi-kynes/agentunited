-- +goose Up
CREATE TABLE IF NOT EXISTS user_channel_reads (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
    last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, channel_id)
);

CREATE INDEX IF NOT EXISTS idx_user_channel_reads_channel ON user_channel_reads(channel_id);

-- +goose Down
DROP TABLE IF EXISTS user_channel_reads;
