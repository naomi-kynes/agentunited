package realtime

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/agentunited/backend/internal/config"
	"github.com/centrifugal/gocent/v3"
	"github.com/golang-jwt/jwt/v5"
)

// Engine wraps Centrifugo publish/presence/history + subscription token issuing.
type Engine struct {
	enabled         bool
	channelPrefix   string
	tokenHMACSecret []byte
	client          *gocent.Client
}

func New(cfg config.CentrifugoConfig) *Engine {
	e := &Engine{enabled: cfg.Enabled, channelPrefix: cfg.ChannelPrefix, tokenHMACSecret: []byte(cfg.TokenHMACSecret)}
	if cfg.Enabled && cfg.APIURL != "" && cfg.APIKey != "" {
		e.client = gocent.New(gocent.Config{Addr: cfg.APIURL, Key: cfg.APIKey})
	}
	if e.channelPrefix == "" {
		e.channelPrefix = "channel:"
	}
	return e
}

func (e *Engine) Enabled() bool { return e != nil && e.enabled && e.client != nil }

func (e *Engine) Channel(channelID string) string { return e.channelPrefix + channelID }

func (e *Engine) Publish(ctx context.Context, channelID string, payload any) error {
	if !e.Enabled() {
		return nil
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	_, err = e.client.Publish(ctx, e.Channel(channelID), b)
	return err
}

func (e *Engine) Presence(ctx context.Context, channelID string) (any, error) {
	if !e.Enabled() {
		return map[string]any{"enabled": false}, nil
	}
	return e.client.Presence(ctx, e.Channel(channelID))
}

func (e *Engine) History(ctx context.Context, channelID string) (any, error) {
	if !e.Enabled() {
		return map[string]any{"enabled": false}, nil
	}
	return e.client.History(ctx, e.Channel(channelID))
}

// GenerateSubscribeToken signs a channel subscription token for Centrifugo private channels.
func (e *Engine) GenerateSubscribeToken(userID, channelID string, ttl time.Duration) (string, error) {
	if len(e.tokenHMACSecret) == 0 {
		return "", fmt.Errorf("centrifugo token secret not configured")
	}
	claims := jwt.MapClaims{
		"sub":     userID,
		"channel": e.Channel(channelID),
		"exp":     time.Now().Add(ttl).Unix(),
	}
	t := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return t.SignedString(e.tokenHMACSecret)
}
