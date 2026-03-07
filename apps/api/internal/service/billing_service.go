package service

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/agentunited/backend/internal/models"
	"github.com/agentunited/backend/internal/repository"
	"github.com/agentunited/backend/pkg/billing"
	"github.com/rs/zerolog/log"
)

var ErrInvalidWebhookSignature = errors.New("invalid webhook signature")

type BillingService interface {
	GetCheckoutURL(ctx context.Context, workspaceID, email, name, successURL, cancelURL string) (string, error)
	GetPortalURL(ctx context.Context, workspaceID, returnURL string) (string, error)
	HandleWebhook(ctx context.Context, body []byte, signature string) error
}

type billingService struct {
	repo          repository.SubscriptionRepository
	provider      billing.Service
	webhookSecret string
	priceIDPro    string
}

func NewBillingService(repo repository.SubscriptionRepository, provider billing.Service, webhookSecret, priceIDPro string) BillingService {
	return &billingService{repo: repo, provider: provider, webhookSecret: webhookSecret, priceIDPro: priceIDPro}
}

func (s *billingService) GetCheckoutURL(ctx context.Context, workspaceID, email, name, successURL, cancelURL string) (string, error) {
	customerID := ""
	if existing, err := s.repo.GetByWorkspace(ctx, workspaceID); err == nil {
		customerID = existing.StripeCustomerID
	}
	var err error
	if customerID == "" {
		customerID, err = s.provider.CreateCustomer(ctx, email, name)
		if err != nil {
			return "", err
		}
		_ = s.repo.UpsertByWorkspace(ctx, &models.Subscription{WorkspaceID: workspaceID, StripeCustomerID: customerID, Plan: "free", Status: "active"})
	}
	return s.provider.CreateCheckoutSession(ctx, customerID, s.priceIDPro, successURL, cancelURL)
}

func (s *billingService) GetPortalURL(ctx context.Context, workspaceID, returnURL string) (string, error) {
	existing, err := s.repo.GetByWorkspace(ctx, workspaceID)
	if err != nil || existing.StripeCustomerID == "" {
		return "", billing.ErrNotConfigured
	}
	return s.provider.GetPortalURL(ctx, existing.StripeCustomerID, returnURL)
}

func (s *billingService) HandleWebhook(ctx context.Context, body []byte, signature string) error {
	if s.webhookSecret == "" {
		log.Warn().Msg("billing webhook not configured")
		return nil // intentionally noop when not configured
	}
	if !verifyStripeSignature(body, signature, s.webhookSecret) {
		return ErrInvalidWebhookSignature
	}

	var evt struct {
		Type string `json:"type"`
		Data struct {
			Object map[string]interface{} `json:"object"`
		} `json:"data"`
	}
	if err := json.Unmarshal(body, &evt); err != nil {
		return fmt.Errorf("decode webhook: %w", err)
	}

	switch evt.Type {
	case "checkout.session.completed":
		wsID := strVal(evt.Data.Object["client_reference_id"])
		subID := strVal(evt.Data.Object["subscription"])
		custID := strVal(evt.Data.Object["customer"])
		plan := strVal(mapVal(evt.Data.Object, "metadata")["plan"])
		if plan == "" {
			plan = "pro"
		}
		status := "active"
		_ = s.repo.UpsertByWorkspace(ctx, &models.Subscription{WorkspaceID: wsID, StripeCustomerID: custID, StripeSubscriptionID: subID, Plan: normalizePlan(plan), Status: status})
	case "customer.subscription.updated", "customer.subscription.deleted":
		obj := evt.Data.Object
		wsID := strVal(mapVal(obj, "metadata")["workspace_id"])
		subID := strVal(obj["id"])
		custID := strVal(obj["customer"])
		status := normalizeStatus(strVal(obj["status"]))
		plan := normalizePlan(strVal(mapVal(obj, "metadata")["plan"]))
		if plan == "free" {
			plan = "pro"
		}
		var cpe *time.Time
		if unix := int64Val(obj["current_period_end"]); unix > 0 {
			t := time.Unix(unix, 0).UTC()
			cpe = &t
		}
		_ = s.repo.UpsertByWorkspace(ctx, &models.Subscription{WorkspaceID: wsID, StripeCustomerID: custID, StripeSubscriptionID: subID, Plan: plan, Status: status, CurrentPeriodEnd: cpe})
	case "invoice.payment_failed":
		obj := evt.Data.Object
		subID := strVal(obj["subscription"])
		wsID := strVal(mapVal(obj, "metadata")["workspace_id"])
		if subID != "" {
			_ = s.repo.UpsertByWorkspace(ctx, &models.Subscription{WorkspaceID: wsID, StripeSubscriptionID: subID, Plan: "pro", Status: "past_due"})
		}
	}
	return nil
}

func verifyStripeSignature(payload []byte, signatureHeader, secret string) bool {
	if signatureHeader == "" || secret == "" {
		return false
	}
	parts := strings.Split(signatureHeader, ",")
	var ts, sig string
	for _, p := range parts {
		kv := strings.SplitN(strings.TrimSpace(p), "=", 2)
		if len(kv) != 2 {
			continue
		}
		if kv[0] == "t" {
			ts = kv[1]
		}
		if kv[0] == "v1" {
			sig = kv[1]
		}
	}
	if ts == "" || sig == "" {
		return false
	}
	signedPayload := ts + "." + string(payload)
	h := hmac.New(sha256.New, []byte(secret))
	h.Write([]byte(signedPayload))
	expected := hex.EncodeToString(h.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(sig))
}

func strVal(v interface{}) string {
	s, _ := v.(string)
	return s
}
func int64Val(v interface{}) int64 {
	switch x := v.(type) {
	case float64:
		return int64(x)
	case string:
		n, _ := strconv.ParseInt(x, 10, 64)
		return n
	default:
		return 0
	}
}
func mapVal(m map[string]interface{}, k string) map[string]interface{} {
	if m == nil {
		return map[string]interface{}{}
	}
	if v, ok := m[k].(map[string]interface{}); ok {
		return v
	}
	return map[string]interface{}{}
}
func normalizePlan(p string) string {
	s := strings.ToLower(strings.TrimSpace(p))
	switch s {
	case "pro", "enterprise":
		return s
	default:
		return "free"
	}
}
func normalizeStatus(s string) string {
	s = strings.ToLower(strings.TrimSpace(s))
	switch s {
	case "active", "past_due", "canceled", "trialing":
		return s
	default:
		return "active"
	}
}
