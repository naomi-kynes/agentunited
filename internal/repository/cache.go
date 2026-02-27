package repository

import (
	"context"
	"fmt"

	"github.com/agentunited/backend/internal/config"
	"github.com/redis/go-redis/v9"
	"github.com/rs/zerolog/log"
)

// Cache wraps redis.Client with additional methods
type Cache struct {
	Client *redis.Client
}

// NewCache creates a new Redis client connection
func NewCache(ctx context.Context, cfg *config.RedisConfig) (*Cache, error) {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Addr(),
		Password: cfg.Password,
		DB:       cfg.DB,
	})

	// Verify connection
	if err := client.Ping(ctx).Err(); err != nil {
		client.Close()
		return nil, fmt.Errorf("ping redis: %w", err)
	}

	log.Info().Str("addr", cfg.Addr()).Int("db", cfg.DB).Msg("redis connected")

	return &Cache{Client: client}, nil
}

// Close closes the Redis client connection
func (c *Cache) Close() error {
	if err := c.Client.Close(); err != nil {
		return fmt.Errorf("close redis connection: %w", err)
	}
	log.Info().Msg("redis connection closed")
	return nil
}

// HealthCheck verifies Redis connectivity
func (c *Cache) HealthCheck(ctx context.Context) error {
	if err := c.Client.Ping(ctx).Err(); err != nil {
		return fmt.Errorf("redis health check failed: %w", err)
	}
	return nil
}
