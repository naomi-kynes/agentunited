package config

import (
	"fmt"
	"os"
	"strconv"
	"time"
)

// Config holds application configuration
type Config struct {
	Server   ServerConfig
	Database DatabaseConfig
	Redis    RedisConfig
	JWT      JWTConfig
	Relay    RelayConfig
}

// ServerConfig holds HTTP server settings
type ServerConfig struct {
	Port string
}

// RelayConfig holds relay/tunnel settings for both embedded client and relay server binary.
type RelayConfig struct {
	DeploymentMode string
	Token          string
	ServerURL      string
	LocalAPIURL    string
	Domain         string
	ListenAddr     string
}

// DatabaseConfig holds PostgreSQL connection settings
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Database string
	SSLMode  string
}

// RedisConfig holds Redis connection settings
type RedisConfig struct {
	Host     string
	Port     string
	Password string
	DB       int
}

// JWTConfig holds JWT authentication settings
type JWTConfig struct {
	Secret string
	Expiry time.Duration
}

// Load reads configuration from environment variables
func Load() (*Config, error) {
	redisDB, err := strconv.Atoi(getEnv("REDIS_DB", "0"))
	if err != nil {
		return nil, fmt.Errorf("invalid REDIS_DB value: %w", err)
	}

	// Parse JWT expiry duration
	jwtExpiryStr := getEnv("JWT_EXPIRY", "24h")
	jwtExpiry, err := time.ParseDuration(jwtExpiryStr)
	if err != nil {
		return nil, fmt.Errorf("invalid JWT_EXPIRY value: %w", err)
	}

	// JWT secret is required in production
	jwtSecret := getEnv("JWT_SECRET", "")
	if jwtSecret == "" {
		return nil, fmt.Errorf("JWT_SECRET is required")
	}

	serverPort := getEnv("SERVER_PORT", "8080")
	cfg := &Config{
		Server: ServerConfig{
			Port: serverPort,
		},
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", ""),
			Database: getEnv("DB_NAME", "agentunited"),
			SSLMode:  getEnv("DB_SSLMODE", "disable"),
		},
		Redis: RedisConfig{
			Host:     getEnv("REDIS_HOST", "localhost"),
			Port:     getEnv("REDIS_PORT", "6379"),
			Password: getEnv("REDIS_PASSWORD", ""),
			DB:       redisDB,
		},
		JWT: JWTConfig{
			Secret: jwtSecret,
			Expiry: jwtExpiry,
		},
		Relay: RelayConfig{
			DeploymentMode: getEnv("DEPLOYMENT_MODE", "self-hosted"),
			Token:          getEnv("RELAY_TOKEN", ""),
			ServerURL:      getEnv("RELAY_SERVER", "ws://localhost:8090/tunnel"),
			LocalAPIURL:    getEnv("RELAY_LOCAL_API", fmt.Sprintf("http://127.0.0.1:%s", serverPort)),
			Domain:         getEnv("RELAY_DOMAIN", "tunnel.agentunited.ai"),
			ListenAddr:     getEnv("RELAY_LISTEN_ADDR", ":8090"),
		},
	}

	return cfg, nil
}

// DSN returns PostgreSQL connection string
func (d *DatabaseConfig) DSN() string {
	return fmt.Sprintf(
		"host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		d.Host, d.Port, d.User, d.Password, d.Database, d.SSLMode,
	)
}

// RedisAddr returns Redis connection address
func (r *RedisConfig) Addr() string {
	return fmt.Sprintf("%s:%s", r.Host, r.Port)
}

// getEnv reads environment variable or returns default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
