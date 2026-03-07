package handlers

import (
	"io"
	"net/http"

	mw "github.com/agentunited/backend/internal/api/middleware"
	"github.com/agentunited/backend/internal/service"
	"github.com/agentunited/backend/pkg/billing"
)

type BillingHandler struct {
	svc service.BillingService
}

func NewBillingHandler(svc service.BillingService) *BillingHandler { return &BillingHandler{svc: svc} }

func (h *BillingHandler) Checkout(w http.ResponseWriter, r *http.Request) {
	workspaceID, ok := mw.GetUserID(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	email := r.URL.Query().Get("email")
	name := r.URL.Query().Get("name")
	successURL := r.URL.Query().Get("success_url")
	if successURL == "" {
		successURL = "http://localhost:3001/billing/success"
	}
	cancelURL := r.URL.Query().Get("cancel_url")
	if cancelURL == "" {
		cancelURL = "http://localhost:3001/billing/cancel"
	}

	url, err := h.svc.GetCheckoutURL(r.Context(), workspaceID, email, name, successURL, cancelURL)
	if err != nil {
		if err == billing.ErrNotConfigured {
			respondJSON(w, http.StatusServiceUnavailable, ErrorResponse{Error: "billing not configured"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"url": url})
}

func (h *BillingHandler) Portal(w http.ResponseWriter, r *http.Request) {
	workspaceID, ok := mw.GetUserID(r.Context())
	if !ok {
		respondJSON(w, http.StatusUnauthorized, ErrorResponse{Error: "Unauthorized"})
		return
	}
	returnURL := r.URL.Query().Get("return_url")
	if returnURL == "" {
		returnURL = "http://localhost:3001/settings/billing"
	}
	url, err := h.svc.GetPortalURL(r.Context(), workspaceID, returnURL)
	if err != nil {
		if err == billing.ErrNotConfigured {
			respondJSON(w, http.StatusServiceUnavailable, ErrorResponse{Error: "billing not configured"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"url": url})
}

func (h *BillingHandler) Webhook(w http.ResponseWriter, r *http.Request) {
	body, err := io.ReadAll(r.Body)
	if err != nil {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid body"})
		return
	}
	sig := r.Header.Get("Stripe-Signature")
	err = h.svc.HandleWebhook(r.Context(), body, sig)
	if err != nil {
		if err == service.ErrInvalidWebhookSignature {
			respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "invalid signature"})
			return
		}
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "internal server error"})
		return
	}
	respondJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}
