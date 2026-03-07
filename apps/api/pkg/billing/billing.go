package billing

import (
	"context"
	"errors"
	"time"
)

var ErrNotConfigured = errors.New("billing not configured")

type Subscription struct {
	ID               string
	CustomerID       string
	SubscriptionID   string
	Plan             string
	Status           string
	CurrentPeriodEnd *time.Time
}

type Service interface {
	CreateCustomer(ctx context.Context, email, name string) (customerID string, err error)
	CreateCheckoutSession(ctx context.Context, customerID string, planID string, successURL string, cancelURL string) (url string, err error)
	GetPortalURL(ctx context.Context, customerID string, returnURL string) (url string, err error)
	GetSubscription(ctx context.Context, subscriptionID string) (*Subscription, error)
}

type Stub struct {
	Configured bool
}

func NewStub(configured bool) *Stub { return &Stub{Configured: configured} }

func (s *Stub) CreateCustomer(ctx context.Context, email, name string) (string, error) {
	if !s.Configured {
		return "", ErrNotConfigured
	}
	return "cus_stub", nil
}

func (s *Stub) CreateCheckoutSession(ctx context.Context, customerID string, planID string, successURL string, cancelURL string) (string, error) {
	if !s.Configured {
		return "", ErrNotConfigured
	}
	return successURL, nil
}

func (s *Stub) GetPortalURL(ctx context.Context, customerID string, returnURL string) (string, error) {
	if !s.Configured {
		return "", ErrNotConfigured
	}
	return returnURL, nil
}

func (s *Stub) GetSubscription(ctx context.Context, subscriptionID string) (*Subscription, error) {
	if !s.Configured {
		return nil, ErrNotConfigured
	}
	return &Subscription{SubscriptionID: subscriptionID, Plan: "pro", Status: "active"}, nil
}
