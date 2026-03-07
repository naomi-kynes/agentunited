package handlers

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	mw "github.com/agentunited/backend/internal/api/middleware"
	"github.com/agentunited/backend/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
)

type channelReadServiceStub struct{}

func (s *channelReadServiceStub) Create(ctx context.Context, userID, name, topic string) (*models.Channel, error) {
	return nil, nil
}
func (s *channelReadServiceStub) Get(ctx context.Context, channelID, userID string) (*models.ChannelWithMembers, error) {
	return nil, nil
}
func (s *channelReadServiceStub) Update(ctx context.Context, channelID, userID, name, topic string) (*models.Channel, error) {
	return nil, nil
}
func (s *channelReadServiceStub) Delete(ctx context.Context, channelID, userID string) error {
	return nil
}
func (s *channelReadServiceStub) List(ctx context.Context, userID string) ([]*models.ChannelWithMembers, error) {
	return nil, nil
}
func (s *channelReadServiceStub) GetMembers(ctx context.Context, channelID, userID string) ([]*models.MemberInfo, error) {
	return nil, nil
}
func (s *channelReadServiceStub) AddMember(ctx context.Context, channelID, targetUserID, requesterUserID, role string) error {
	return nil
}
func (s *channelReadServiceStub) RemoveMember(ctx context.Context, channelID, targetUserID, requesterUserID string) error {
	return nil
}
func (s *channelReadServiceStub) ListDMChannels(ctx context.Context, userID string) ([]*models.ChannelWithMembers, error) {
	return nil, nil
}
func (s *channelReadServiceStub) CreateOrGetDMChannel(ctx context.Context, userID, targetUserID string) (*models.Channel, error) {
	return nil, nil
}
func (s *channelReadServiceStub) IsMember(ctx context.Context, channelID, userID string) (bool, string, error) {
	return true, "member", nil
}
func (s *channelReadServiceStub) MarkChannelRead(ctx context.Context, channelID, userID string) error {
	return nil
}

func TestChannelReadEndpoints_AuthRequired(t *testing.T) {
	h := NewChannelHandler(&channelReadServiceStub{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/channels/c1/read", nil)
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "c1")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))
	rr := httptest.NewRecorder()
	h.MarkRead(rr, req)
	assert.Equal(t, http.StatusUnauthorized, rr.Code)

	req2 := httptest.NewRequest(http.MethodPost, "/api/v1/dm/c1/read", nil)
	rctx2 := chi.NewRouteContext()
	rctx2.URLParams.Add("id", "c1")
	req2 = req2.WithContext(context.WithValue(req2.Context(), chi.RouteCtxKey, rctx2))
	rr2 := httptest.NewRecorder()
	h.MarkDMRead(rr2, req2)
	assert.Equal(t, http.StatusUnauthorized, rr2.Code)
}

func TestChannelReadEndpoints_Success204(t *testing.T) {
	h := NewChannelHandler(&channelReadServiceStub{})

	req := httptest.NewRequest(http.MethodPost, "/api/v1/channels/c1/read", nil)
	ctx := context.WithValue(req.Context(), mw.UserIDKey, "u1")
	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("id", "c1")
	req = req.WithContext(context.WithValue(ctx, chi.RouteCtxKey, rctx))
	rr := httptest.NewRecorder()
	h.MarkRead(rr, req)
	assert.Equal(t, http.StatusNoContent, rr.Code)
}
