package handlers

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"

	"github.com/agentunited/backend/internal/models"
	"github.com/go-playground/validator/v10"
	"github.com/rs/zerolog/log"
)

// BootstrapService defines the bootstrap operations
type BootstrapService interface {
	Bootstrap(ctx context.Context, req *models.BootstrapRequest) (*models.BootstrapResponse, error)
}

// BootstrapHandler handles bootstrap requests
type BootstrapHandler struct {
	service   BootstrapService
	validator *validator.Validate
}

// NewBootstrapHandler creates a new bootstrap handler
func NewBootstrapHandler(service BootstrapService) *BootstrapHandler {
	return &BootstrapHandler{
		service:   service,
		validator: validator.New(),
	}
}

func (h *BootstrapHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, http.StatusMethodNotAllowed, "method not allowed")
		return
	}

	// Parse request
	var req models.BootstrapRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		log.Debug().Err(err).Msg("failed to decode bootstrap request")
		respondError(w, http.StatusBadRequest, "invalid JSON")
		return
	}

	// Validate request
	if err := h.validator.Struct(&req); err != nil {
		log.Debug().Err(err).Msg("bootstrap request validation failed")
		respondError(w, http.StatusBadRequest, "validation failed: "+err.Error())
		return
	}

	// Call service
	resp, err := h.service.Bootstrap(r.Context(), &req)
	if err != nil {
		if errors.Is(err, models.ErrInstanceAlreadyBootstrapped) {
			respondError(w, http.StatusConflict, "instance has already been bootstrapped")
			return
		}
		
		log.Error().Err(err).Msg("bootstrap failed")
		respondError(w, http.StatusInternalServerError, "internal server error")
		return
	}

	// Return response
	respondJSON(w, http.StatusCreated, resp)
}

func respondError(w http.ResponseWriter, code int, message string) {
	respondJSON(w, code, map[string]string{"error": message})
}