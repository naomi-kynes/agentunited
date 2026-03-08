package service

import (
	"context"
	"fmt"

	"github.com/agentunited/backend/internal/models"
	"github.com/agentunited/backend/internal/repository"
)

type RelayService interface {
	GetStatus(ctx context.Context, workspaceID string) (*models.RelayStatusResponse, error)
}

type relayService struct {
	subscriptionRepo repository.SubscriptionRepository
	relayDomain      string
}

func NewRelayService(subscriptionRepo repository.SubscriptionRepository, relayDomain string) RelayService {
	return &relayService{subscriptionRepo: subscriptionRepo, relayDomain: relayDomain}
}

func (s *relayService) GetStatus(ctx context.Context, workspaceID string) (*models.RelayStatusResponse, error) {
	sub, err := s.subscriptionRepo.GetByWorkspace(ctx, workspaceID)
	if err != nil {
		return nil, err
	}
	return &models.RelayStatusResponse{
		RelayURL:         fmt.Sprintf("https://%s.%s", sub.RelaySubdomain, s.relayDomain),
		RelayTier:        sub.RelayTier,
		BandwidthUsedMB:  sub.RelayBandwidthUsedMB,
		BandwidthLimitMB: sub.RelayBandwidthLimitMB,
		ConnectionsMax:   sub.RelayConnectionsMax,
		RelaySubdomain:   sub.RelaySubdomain,
		ExpiresAt:        sub.RelayExpiresAt,
	}, nil
}
