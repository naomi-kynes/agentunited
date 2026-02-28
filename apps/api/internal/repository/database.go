package repository

import (
	"context"
	"fmt"
	"os"
	"path/filepath"

	"github.com/agentunited/backend/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

// DB wraps pgxpool.Pool with additional methods
type DB struct {
	Pool *pgxpool.Pool
}

// NewDB creates a new database connection pool
func NewDB(ctx context.Context, cfg *config.DatabaseConfig) (*DB, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.DSN())
	if err != nil {
		return nil, fmt.Errorf("parse database config: %w", err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("create connection pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping database: %w", err)
	}

	log.Info().Str("host", cfg.Host).Str("database", cfg.Database).Msg("database connected")

	return &DB{Pool: pool}, nil
}

// Close closes the database connection pool
func (db *DB) Close() {
	db.Pool.Close()
	log.Info().Msg("database connection closed")
}

// RunMigrations executes SQL migration files from the migrations directory
func (db *DB) RunMigrations(ctx context.Context, migrationsDir string) error {
	files, err := filepath.Glob(filepath.Join(migrationsDir, "*.sql"))
	if err != nil {
		return fmt.Errorf("read migrations directory: %w", err)
	}

	if len(files) == 0 {
		log.Warn().Str("dir", migrationsDir).Msg("no migration files found")
		return nil
	}

	for _, file := range files {
		log.Info().Str("file", filepath.Base(file)).Msg("running migration")

		content, err := os.ReadFile(file)
		if err != nil {
			return fmt.Errorf("read migration %s: %w", file, err)
		}

		// Execute migration
		if _, err := db.Pool.Exec(ctx, string(content)); err != nil {
			return fmt.Errorf("execute migration %s: %w", file, err)
		}
	}

	log.Info().Int("count", len(files)).Msg("migrations complete")
	return nil
}

// HealthCheck verifies database connectivity
func (db *DB) HealthCheck(ctx context.Context) error {
	var result int
	if err := db.Pool.QueryRow(ctx, "SELECT 1").Scan(&result); err != nil {
		return fmt.Errorf("health check query failed: %w", err)
	}
	if result != 1 {
		return fmt.Errorf("unexpected health check result: %d", result)
	}
	return nil
}
