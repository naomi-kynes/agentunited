package api

import (
	"encoding/json"
	"net/http"

	"github.com/agentunited/backend/internal/repository"
	"github.com/rs/zerolog/log"
)

// HealthHandler handles health check requests
type HealthHandler struct {
	db    *repository.DB
	cache *repository.Cache
}

// NewHealthHandler creates a new health check handler
func NewHealthHandler(db *repository.DB, cache *repository.Cache) *HealthHandler {
	return &HealthHandler{
		db:    db,
		cache: cache,
	}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
	Cache    string `json:"cache"`
}

// Check handles GET /health
func (h *HealthHandler) Check(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()

	response := HealthResponse{
		Status:   "ok",
		Database: "disconnected",
		Cache:    "disconnected",
	}

	// Check database
	if err := h.db.HealthCheck(ctx); err != nil {
		log.Error().Err(err).Msg("database health check failed")
		response.Status = "degraded"
	} else {
		response.Database = "connected"
	}

	// Check cache
	if err := h.cache.HealthCheck(ctx); err != nil {
		log.Error().Err(err).Msg("cache health check failed")
		response.Status = "degraded"
	} else {
		response.Cache = "connected"
	}

	// Set status code based on health
	statusCode := http.StatusOK
	if response.Status == "degraded" {
		statusCode = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	
	if err := json.NewEncoder(w).Encode(response); err != nil {
		log.Error().Err(err).Msg("failed to encode health response")
	}
}
