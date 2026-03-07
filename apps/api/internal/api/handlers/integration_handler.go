package handlers

import (
	"encoding/json"
	"net/http"

	mw "github.com/agentunited/backend/internal/api/middleware"
	"github.com/agentunited/backend/internal/models"
	"github.com/agentunited/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type IntegrationHandler struct {
	svc service.IntegrationService
}

func NewIntegrationHandler(svc service.IntegrationService) *IntegrationHandler {
	return &IntegrationHandler{svc: svc}
}

func (h *IntegrationHandler) List(w http.ResponseWriter, r *http.Request) {
	userID, ok := mw.GetUserID(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	items, err := h.svc.List(r.Context(), userID)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Internal server error"})
		return
	}
	respondJSON(w, http.StatusOK, map[string]interface{}{"integrations": items})
}

func (h *IntegrationHandler) Create(w http.ResponseWriter, r *http.Request) {
	userID, ok := mw.GetUserID(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	var req models.CreateIntegrationRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Invalid request body"})
		return
	}
	created, err := h.svc.Create(r.Context(), userID, &req)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: err.Error()})
		return
	}
	apiKey := created.APIKey
	created.APIKey = ""
	respondJSON(w, http.StatusCreated, map[string]interface{}{"integration": created, "api_key": apiKey})
}

func (h *IntegrationHandler) Delete(w http.ResponseWriter, r *http.Request) {
	userID, ok := mw.GetUserID(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	id := chi.URLParam(r, "id")
	if id == "" {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Integration ID is required"})
		return
	}
	if err := h.svc.Delete(r.Context(), userID, id); err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Internal server error"})
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
