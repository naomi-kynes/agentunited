package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/agentunited/backend/internal/service"
	"github.com/golang-jwt/jwt/v5"
	"github.com/gorilla/websocket"
	"github.com/rs/zerolog/log"
)

// WebSocketPubSub defines the pub/sub operations required by the websocket handler.
type WebSocketPubSub interface {
	Publish(ctx context.Context, channel, message string) error
	Subscribe(ctx context.Context, channel string) error
}

// WebSocketHandler handles WebSocket connections.
type WebSocketHandler struct {
	jwtSecret string
	upgrader  websocket.Upgrader
	pubsub    WebSocketPubSub
}

// NewWebSocketHandler creates a new WebSocket handler.
// messageService/channelService are reserved for later Part 3 steps.
func NewWebSocketHandler(_ service.MessageService, _ service.ChannelService, jwtSecret string) *WebSocketHandler {
	return &WebSocketHandler{
		jwtSecret: jwtSecret,
		upgrader: websocket.Upgrader{
			CheckOrigin: func(r *http.Request) bool { return true },
		},
	}
}

// SetPubSub injects the pub/sub dependency.
func (h *WebSocketHandler) SetPubSub(pubsub WebSocketPubSub) {
	h.pubsub = pubsub
}

type wsInbound struct {
	Type      string `json:"type"`
	ChannelID string `json:"channel_id"`
	Text      string `json:"text"`
}

func (h *WebSocketHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/ws" {
		http.NotFound(w, r)
		return
	}

	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "missing token", http.StatusUnauthorized)
		return
	}

	claims, err := h.validateToken(token)
	if err != nil {
		http.Error(w, "invalid token", http.StatusUnauthorized)
		return
	}

	conn, err := h.upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Error().Err(err).Msg("websocket upgrade failed")
		return
	}
	defer conn.Close()

	ack, _ := json.Marshal(map[string]string{
		"type":    "connected",
		"user_id": claims.UserID,
	})
	if err := conn.WriteMessage(websocket.TextMessage, ack); err != nil {
		return
	}

	for {
		_, data, err := conn.ReadMessage()
		if err != nil {
			return
		}
		var in wsInbound
		if err := json.Unmarshal(data, &in); err != nil {
			continue
		}
		switch in.Type {
		case "subscribe":
			if in.ChannelID == "" {
				continue
			}
			if h.pubsub != nil {
				_ = h.pubsub.Subscribe(r.Context(), fmt.Sprintf("channel:%s", in.ChannelID))
			}
			resp, _ := json.Marshal(map[string]string{"type": "subscribed", "channel_id": in.ChannelID})
			_ = conn.WriteMessage(websocket.TextMessage, resp)
		case "send_message":
			if in.ChannelID == "" || in.Text == "" {
				continue
			}
			if h.pubsub != nil {
				payload, _ := json.Marshal(map[string]string{
					"type":       "message",
					"channel_id": in.ChannelID,
					"text":       in.Text,
					"user_id":    claims.UserID,
				})
				_ = h.pubsub.Publish(r.Context(), fmt.Sprintf("channel:%s", in.ChannelID), string(payload))
			}
			resp, _ := json.Marshal(map[string]string{"type": "message_sent", "channel_id": in.ChannelID})
			_ = conn.WriteMessage(websocket.TextMessage, resp)
		}
	}
}

func (h *WebSocketHandler) validateToken(tokenString string) (*service.JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &service.JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return []byte(h.jwtSecret), nil
	})
	if err != nil || !token.Valid {
		return nil, err
	}
	claims, ok := token.Claims.(*service.JWTClaims)
	if !ok {
		return nil, jwt.ErrTokenMalformed
	}
	return claims, nil
}
