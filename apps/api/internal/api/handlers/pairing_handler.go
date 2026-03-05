package handlers

import (
	"encoding/json"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	"regexp"
	"strings"
	"sync"
	"time"

	"github.com/agentunited/backend/internal/relay"
	"github.com/rs/zerolog/log"
)

var (
	relayTokenRegex = regexp.MustCompile(`^rt_[A-Za-z0-9_-]{8,}$`)
	subdomainRegex  = regexp.MustCompile(`^[a-z0-9]([a-z0-9-]{1,28}[a-z0-9])?$`)
)

// PairingCode represents a 6-digit code linked to a workspace instance
type PairingCode struct {
	Code      string    `json:"code"`
	ExpiresAt time.Time `json:"expires_at"`
	Verified  bool      `json:"verified"`
}

// PairingHandler handles instance pairing and admin relay token updates.
type PairingHandler struct {
	codes     map[string]PairingCode
	codesLock sync.RWMutex
}

// NewPairingHandler creates a new pairing handler.
func NewPairingHandler() *PairingHandler {
	return &PairingHandler{
		codes:     make(map[string]PairingCode),
		codesLock: sync.RWMutex{},
	}
}

// GetCode generates or returns a valid 6-digit pairing code.
func (h *PairingHandler) GetCode(w http.ResponseWriter, r *http.Request) {
	h.codesLock.Lock()
	defer h.codesLock.Unlock()

	now := time.Now()
	for k, v := range h.codes {
		if now.After(v.ExpiresAt) {
			delete(h.codes, k)
		}
	}

	rand.Seed(time.Now().UnixNano())
	codeChars := "0123456789ABCDEF"
	code := ""
	for i := 0; i < 6; i++ {
		code += string(codeChars[rand.Intn(len(codeChars))])
	}

	pairingCode := PairingCode{
		Code:      code,
		ExpiresAt: now.Add(15 * time.Minute),
		Verified:  false,
	}

	h.codes[code] = pairingCode

	log.Info().Str("code", code).Msg("generated new pairing code")

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(pairingCode)
}

// VerifyCode checks if a code is valid.
func (h *PairingHandler) VerifyCode(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		http.Error(w, "missing code", http.StatusBadRequest)
		return
	}

	h.codesLock.Lock()
	v, ok := h.codes[code]
	if !ok || time.Now().After(v.ExpiresAt) {
		h.codesLock.Unlock()
		http.Error(w, "invalid or expired code", http.StatusUnauthorized)
		return
	}
	v.Verified = true
	h.codes[code] = v
	h.codesLock.Unlock()

	w.Header().Set("Content-Type", "application/json")
	_ = json.NewEncoder(w).Encode(map[string]string{
		"status":  "verified",
		"message": "instance paired successfully",
	})
}

type AdminPairingRequest struct {
	RelayToken string `json:"relay_token"`
}

type SubdomainCheckRequest struct {
	Subdomain string `json:"subdomain"`
}

type SubdomainClaimRequest struct {
	Subdomain string `json:"subdomain"`
}

// AdminPairing updates relay token, persists it, and triggers embedded relay reconnect.
// POST /api/v1/admin/pairing
func (h *PairingHandler) AdminPairing(w http.ResponseWriter, r *http.Request) {
	var req AdminPairingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Invalid request body"})
		return
	}

	if !relayTokenRegex.MatchString(req.RelayToken) {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Invalid relay token format"})
		return
	}

	// Update in-process state for current runtime.
	_ = os.Setenv("DEPLOYMENT_MODE", "tunnel")
	_ = os.Setenv("RELAY_TOKEN", req.RelayToken)

	// Persist token so it survives restart.
	cfgPath := os.Getenv("RELAY_CONFIG_FILE")
	if cfgPath == "" {
		cfgPath = "data/relay_config.json"
	}
	currentCfg, _ := loadRelayConfig(cfgPath)
	subdomain := ""
	if currentCfg != nil {
		subdomain = currentCfg.Subdomain
	}
	if err := persistRelayConfig(cfgPath, req.RelayToken, subdomain); err != nil {
		log.Error().Err(err).Str("path", cfgPath).Msg("failed to persist relay config")
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Failed to persist pairing config"})
		return
	}

	// Trigger (re)connect with new token.
	mgr := relay.GetGlobalManager()
	if mgr == nil {
		respondJSON(w, http.StatusServiceUnavailable, ErrorResponse{Error: "Relay manager unavailable"})
		return
	}
	mgr.UpdateToken(req.RelayToken)

	respondJSON(w, http.StatusOK, map[string]any{
		"status":      "paired",
		"mode":        "tunnel",
		"config_path": cfgPath,
	})
}

// TunnelStatus returns current control-plane status for dashboard wiring.
func (h *PairingHandler) TunnelStatus(w http.ResponseWriter, r *http.Request) {
	cfgPath := os.Getenv("RELAY_CONFIG_FILE")
	if cfgPath == "" {
		cfgPath = "data/relay_config.json"
	}
	cfg, _ := loadRelayConfig(cfgPath)
	mgr := relay.GetGlobalManager()
	state := relay.State{Mode: os.Getenv("DEPLOYMENT_MODE"), HasToken: os.Getenv("RELAY_TOKEN") != "", Running: false}
	if mgr != nil {
		state = mgr.State()
	}

	resp := map[string]any{
		"mode":        state.Mode,
		"has_token":   state.HasToken,
		"running":     state.Running,
		"config_path": cfgPath,
	}
	if cfg != nil {
		resp["subdomain"] = cfg.Subdomain
		resp["updated_at"] = cfg.UpdatedAt
	}
	respondJSON(w, http.StatusOK, resp)
}

// SubdomainCheck validates requested subdomain format and checks reservation in persisted local config.
func (h *PairingHandler) SubdomainCheck(w http.ResponseWriter, r *http.Request) {
	var req SubdomainCheckRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Invalid request body"})
		return
	}
	req.Subdomain = normalizeSubdomain(req.Subdomain)
	if !subdomainRegex.MatchString(req.Subdomain) {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Invalid subdomain format"})
		return
	}

	cfgPath := os.Getenv("RELAY_CONFIG_FILE")
	if cfgPath == "" {
		cfgPath = "data/relay_config.json"
	}
	cfg, _ := loadRelayConfig(cfgPath)
	available := true
	if cfg != nil && cfg.Subdomain != "" && cfg.Subdomain != req.Subdomain {
		available = false
	}
	respondJSON(w, http.StatusOK, map[string]any{"subdomain": req.Subdomain, "available": available})
}

// SubdomainClaim stores desired subdomain locally for later dashboard/cloud registration handoff.
func (h *PairingHandler) SubdomainClaim(w http.ResponseWriter, r *http.Request) {
	var req SubdomainClaimRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Invalid request body"})
		return
	}
	req.Subdomain = normalizeSubdomain(req.Subdomain)
	if !subdomainRegex.MatchString(req.Subdomain) {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "Invalid subdomain format"})
		return
	}

	cfgPath := os.Getenv("RELAY_CONFIG_FILE")
	if cfgPath == "" {
		cfgPath = "data/relay_config.json"
	}
	cfg, _ := loadRelayConfig(cfgPath)
	token := ""
	if cfg != nil {
		token = cfg.RelayToken
	}
	if token == "" {
		token = os.Getenv("RELAY_TOKEN")
	}
	if err := persistRelayConfig(cfgPath, token, req.Subdomain); err != nil {
		respondJSON(w, http.StatusInternalServerError, ErrorResponse{Error: "Failed to persist subdomain"})
		return
	}
	respondJSON(w, http.StatusOK, map[string]any{"status": "claimed", "subdomain": req.Subdomain})
}

// PairingStatus allows dashboard polling to know when local pairing code is verified.
func (h *PairingHandler) PairingStatus(w http.ResponseWriter, r *http.Request) {
	code := r.URL.Query().Get("code")
	if code == "" {
		respondJSON(w, http.StatusBadRequest, ErrorResponse{Error: "code is required"})
		return
	}
	h.codesLock.RLock()
	v, ok := h.codes[code]
	h.codesLock.RUnlock()
	if !ok {
		respondJSON(w, http.StatusNotFound, ErrorResponse{Error: "code not found"})
		return
	}
	status := "pending"
	if v.Verified {
		status = "verified"
	}
	if time.Now().After(v.ExpiresAt) {
		status = "expired"
	}
	respondJSON(w, http.StatusOK, map[string]any{"code": code, "status": status, "expires_at": v.ExpiresAt})
}

type relayConfigFile struct {
	DeploymentMode string `json:"deployment_mode"`
	RelayToken     string `json:"relay_token"`
	Subdomain      string `json:"subdomain,omitempty"`
	UpdatedAt      string `json:"updated_at"`
}

func persistRelayConfig(path, token, subdomain string) error {
	if err := os.MkdirAll(filepath.Dir(path), 0o755); err != nil {
		return err
	}
	payload := relayConfigFile{
		DeploymentMode: "tunnel",
		RelayToken:     token,
		Subdomain:      subdomain,
		UpdatedAt:      time.Now().UTC().Format(time.RFC3339),
	}
	b, err := json.MarshalIndent(payload, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, b, 0o600)
}

func loadRelayConfig(path string) (*relayConfigFile, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var cfg relayConfigFile
	if err := json.Unmarshal(b, &cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}

func normalizeSubdomain(s string) string {
	return regexp.MustCompile(`[^a-z0-9-]`).ReplaceAllString(strings.ToLower(strings.TrimSpace(s)), "")
}
