package handlers

import (
	"net/http"
	"strings"

	mw "github.com/agentunited/backend/internal/api/middleware"
	"github.com/agentunited/backend/internal/repository"
)

type UsersHandler struct {
	userRepo  repository.UserRepository
	agentRepo repository.AgentRepository
}

func NewUsersHandler(userRepo repository.UserRepository, agentRepo repository.AgentRepository) *UsersHandler {
	return &UsersHandler{userRepo: userRepo, agentRepo: agentRepo}
}

func (h *UsersHandler) List(w http.ResponseWriter, r *http.Request) {
	callerID, ok := mw.GetUserID(r.Context())
	if !ok || callerID == "" {
		respondJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	type listItem struct {
		ID          string `json:"id"`
		Email       string `json:"email"`
		DisplayName string `json:"display_name"`
		Type        string `json:"type"`
	}
	out := make([]listItem, 0)

	users, err := h.userRepo.List(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		return
	}
	for _, u := range users {
		if u.ID == callerID {
			continue
		}
		dn := strings.TrimSpace(u.DisplayName)
		if dn == "" {
			dn = strings.Split(u.Email, "@")[0]
		}
		out = append(out, listItem{ID: u.ID, Email: u.Email, DisplayName: dn, Type: "human"})
	}

	agents, err := h.agentRepo.ListAll(r.Context())
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		return
	}
	for _, a := range agents {
		dn := strings.TrimSpace(a.DisplayName)
		if dn == "" {
			dn = a.Name
		}
		out = append(out, listItem{ID: a.ID, Email: "", DisplayName: dn, Type: "agent"})
	}

	respondJSON(w, http.StatusOK, map[string]interface{}{"users": out})
}
