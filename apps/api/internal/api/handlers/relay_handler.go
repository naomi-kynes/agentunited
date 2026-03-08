package handlers

import (
	"context"
	"net/http"

	mw "github.com/agentunited/backend/internal/api/middleware"
	"github.com/agentunited/backend/internal/models"
)

type RelayService interface {
	GetStatus(ctx context.Context, workspaceID string) (*models.RelayStatusResponse, error)
}

type RelayHandler struct{ service RelayService }

func NewRelayHandler(service RelayService) *RelayHandler { return &RelayHandler{service: service} }

func (h *RelayHandler) Status(w http.ResponseWriter, r *http.Request) {
	workspaceID, ok := mw.GetUserID(r.Context())
	if !ok {
		respondError(w, http.StatusUnauthorized, "unauthorized")
		return
	}
	resp, err := h.service.GetStatus(r.Context(), workspaceID)
	if err != nil {
		respondError(w, http.StatusNotFound, "relay status not found")
		return
	}
	respondJSON(w, http.StatusOK, resp)
}
