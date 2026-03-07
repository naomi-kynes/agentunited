-- +goose Up
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT NOT NULL DEFAULT 'human';
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_type;
ALTER TABLE users ADD CONSTRAINT chk_user_type CHECK (user_type IN ('human','agent'));

UPDATE users SET user_type = 'human' WHERE user_type IS NULL OR user_type = '';

-- +goose Down
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_type;
ALTER TABLE users DROP COLUMN IF EXISTS user_type;
