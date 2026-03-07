# 2026-03-06 — Unread count tracking

## Added persistence
Migration: `apps/api/migrations/011_user_channel_reads.sql`

Table:
- `user_channel_reads`
  - `user_id UUID`
  - `channel_id UUID`
  - `last_read_at TIMESTAMPTZ`
  - Primary key `(user_id, channel_id)`

## Repository additions
`ChannelRepository` now supports:
- `MarkChannelRead(ctx, userID, channelID)`
- `GetUnreadCounts(ctx, userID)`

Unread count semantics:
- Counts messages in channels where user is a member
- Excludes user-authored messages
- Counts messages newer than `last_read_at` (or epoch if never read)

## API behavior changes
- `GET /api/v1/channels` now includes `unread_count` for each channel item.

New endpoints (JWT/API-key protected via existing auth middleware):
- `POST /api/v1/channels/{id}/read` → marks channel read (`204`)
- `POST /api/v1/dm/{id}/read` → marks DM read (`204`)

Also mounted on `/v1` compatibility routes.
