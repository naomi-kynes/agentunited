package repository

import (
	"context"
	"fmt"

	"github.com/agentunited/backend/internal/config"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/jackc/pgx/v5/stdlib"
	"github.com/pressly/goose/v3"
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

// RunMigrations executes SQL migration files using goose
func (db *DB) RunMigrations(ctx context.Context, migrationsDir string) error {
	// Get a *sql.DB from the pgx pool for goose compatibility
	sqlDB := stdlib.OpenDBFromPool(db.Pool)

	goose.SetLogger(goose.NopLogger())

	if err := goose.SetDialect("postgres"); err != nil {
		return fmt.Errorf("set goose dialect: %w", err)
	}

	if err := goose.UpContext(ctx, sqlDB, migrationsDir); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}

	version, err := goose.GetDBVersionContext(ctx, sqlDB)
	if err != nil {
		return fmt.Errorf("get migration version: %w", err)
	}

	log.Info().Int64("version", version).Str("dir", migrationsDir).Msg("migrations complete")
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
