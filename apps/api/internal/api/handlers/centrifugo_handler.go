package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/agentunited/backend/internal/api/middleware"
	"github.com/agentunited/backend/internal/realtime"
)

type channelMembershipChecker interface {
	IsMember(ctx context.Context, channelID, userID string) (bool, string, error)
}

// CentrifugoHandler bridges API auth/membership with Centrifugo channel auth and observability.
type CentrifugoHandler struct {
	rt             *realtime.Engine
	channelService channelMembershipChecker
}

func NewCentrifugoHandler(rt *realtime.Engine, channelService channelMembershipChecker) *CentrifugoHandler {
	return &CentrifugoHandler{rt: rt, channelService: channelService}
}

type subscribeTokenRequest struct {
	ChannelID string `json:"channel_id"`
}

func (h *CentrifugoHandler) SubscribeToken(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}

	var req subscribeTokenRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ChannelID == "" {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "channel_id is required"})
		return
	}

	isMember, _, err := h.channelService.IsMember(r.Context(), req.ChannelID, userID)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "membership check failed"})
		return
	}
	if !isMember {
		respondJSON(w, http.StatusForbidden, ErrorResponse{Error: "Not a member of this channel"})
		return
	}

	token, err := h.rt.GenerateSubscribeToken(userID, req.ChannelID, 10*time.Minute)
	if err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{"token": token, "channel": h.rt.Channel(req.ChannelID)})
}

func (h *CentrifugoHandler) Presence(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	channelID := r.URL.Query().Get("channel_id")
	if channelID == "" {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "channel_id is required"})
		return
	}
	isMember, _, err := h.channelService.IsMember(r.Context(), channelID, userID)
	if err != nil || !isMember {
		respondJSON(w, http.StatusForbidden, ErrorResponse{Error: "Not a member of this channel"})
		return
	}
	data, err := h.rt.Presence(r.Context(), channelID)
	if err != nil {
		respondJSON(w, http.StatusBadGateway, ErrorResponse{Error: err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{"presence": data})
}

func (h *CentrifugoHandler) History(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.GetUserID(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	channelID := r.URL.Query().Get("channel_id")
	if channelID == "" {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "channel_id is required"})
		return
	}
	isMember, _, err := h.channelService.IsMember(r.Context(), channelID, userID)
	if err != nil || !isMember {
		respondJSON(w, http.StatusForbidden, ErrorResponse{Error: "Not a member of this channel"})
		return
	}
	data, err := h.rt.History(r.Context(), channelID)
	if err != nil {
		respondJSON(w, http.StatusBadGateway, ErrorResponse{Error: err.Error()})
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{"history": data})
}
