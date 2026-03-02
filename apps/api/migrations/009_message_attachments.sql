-- +goose Up

-- Add attachment support to messages
ALTER TABLE messages ADD COLUMN attachment_url TEXT;
ALTER TABLE messages ADD COLUMN attachment_name TEXT;

-- Create index for messages with attachments (for future queries)
CREATE INDEX IF NOT EXISTS idx_messages_attachments ON messages(attachment_url) WHERE attachment_url IS NOT NULL;

-- +goose Down

-- Remove attachment columns
DROP INDEX IF EXISTS idx_messages_attachments;
ALTER TABLE messages DROP COLUMN IF EXISTS attachment_name;
ALTER TABLE messages DROP COLUMN IF EXISTS attachment_url;