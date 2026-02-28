package models

import "time"

// Message represents a chat message
type Message struct {
	ID          string    `json:"id"`
	ChannelID   string    `json:"channel_id"`
	AuthorID    string    `json:"author_id"`
	AuthorType  string    `json:"author_type"`
	AuthorEmail string    `json:"author_email,omitempty"` // Joined from users table
	Text        string    `json:"text"`
	CreatedAt   time.Time `json:"created_at"`
}

// MessageList represents a paginated list of messages
type MessageList struct {
	Messages []*Message `json:"messages"`
	HasMore  bool       `json:"has_more"`
}
