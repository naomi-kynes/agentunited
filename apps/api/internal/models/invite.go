package models

import "time"

// InviteStatus represents the status of an invite
type InviteStatus string

const (
	InviteStatusPending  InviteStatus = "pending"
	InviteStatusConsumed InviteStatus = "consumed"
	InviteStatusExpired  InviteStatus = "expired"
)

// Invite represents a user invitation
type Invite struct {
	ID         string        `json:"id"`
	UserID     string        `json:"user_id"`
	Status     InviteStatus  `json:"status"`
	ExpiresAt  time.Time     `json:"expires_at"`
	CreatedAt  time.Time     `json:"created_at"`
	ConsumedAt *time.Time    `json:"consumed_at,omitempty"`
}

// InviteWithToken includes the one-time plaintext token
type InviteWithToken struct {
	Invite
	PlaintextToken string `json:"plaintext_token"`
}

// InviteAcceptRequest represents invite acceptance payload
type InviteAcceptRequest struct {
	Token    string `json:"token" validate:"required"`
	Password string `json:"password" validate:"required,min=12"`
}