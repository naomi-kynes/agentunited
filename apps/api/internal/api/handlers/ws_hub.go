package handlers

import (
	"context"
	"sync"

	"github.com/gorilla/websocket"
)

// Hub manages WebSocket connections and broadcasting.
type Hub struct {
	// Registered clients by channel ID
	channels map[string]map[*websocket.Conn]string // channel_id -> conn -> user_id
	mu       sync.RWMutex
}

// NewHub creates a new Hub.
func NewHub() *Hub {
	return &Hub{
		channels: make(map[string]map[*websocket.Conn]string),
	}
}

// Subscribe adds a connection to a channel.
func (h *Hub) Subscribe(ctx context.Context, channelID string, conn *websocket.Conn, userID string) {
	h.mu.Lock()
	defer h.mu.Unlock()
	
	if h.channels[channelID] == nil {
		h.channels[channelID] = make(map[*websocket.Conn]string)
	}
	h.channels[channelID][conn] = userID
}

// Unsubscribe removes a connection from all channels.
func (h *Hub) Unsubscribe(conn *websocket.Conn) {
	h.mu.Lock()
	defer h.mu.Unlock()
	
	for channelID := range h.channels {
		delete(h.channels[channelID], conn)
		if len(h.channels[channelID]) == 0 {
			delete(h.channels, channelID)
		}
	}
}

// Broadcast sends a message to all connections in a channel.
func (h *Hub) Broadcast(ctx context.Context, channelID string, message []byte) {
	h.mu.RLock()
	conns := h.channels[channelID]
	h.mu.RUnlock()
	
	for conn := range conns {
		// Fire and forget - don't block on slow clients
		go func(c *websocket.Conn) {
			c.WriteMessage(websocket.TextMessage, message)
		}(conn)
	}
}
