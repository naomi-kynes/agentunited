package handlers

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/agentunited/backend/internal/api/middleware"
	"github.com/agentunited/backend/internal/models"
	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockMessageService is a mock implementation of MessageService
type MockMessageService struct {
	mock.Mock
}

func (m *MockMessageService) Send(ctx context.Context, channelID, userID, text string) (*models.Message, error) {
	args := m.Called(ctx, channelID, userID, text)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Message), args.Error(1)
}

func (m *MockMessageService) GetMessages(ctx context.Context, channelID, userID string, limit int, before string) (*models.MessageList, error) {
	args := m.Called(ctx, channelID, userID, limit, before)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.MessageList), args.Error(1)
}

// Test: Send message successfully
func TestMessageHandler_Send_Success(t *testing.T) {
	mockService := new(MockMessageService)
	handler := NewMessageHandler(mockService)

	message := &models.Message{
		ID:        "test-message-id",
		ChannelID: "test-channel-id",
		AuthorID:  "test-user-id",
		Text:      "Hello world",
	}

	mockService.On("Send", mock.Anything, "test-channel-id", "test-user-id", "Hello world").
		Return(message, nil)

	reqBody := map[string]string{
		"text": "Hello world",
	}
	bodyJSON, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/channels/test-channel-id/messages", bytes.NewReader(bodyJSON))
	req.Header.Set("Content-Type", "application/json")

	ctx := context.WithValue(req.Context(), middleware.UserIDKey, "test-user-id")
	req = req.WithContext(ctx)

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("channel_id", "test-channel-id")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rr := httptest.NewRecorder()

	handler.Send(rr, req)

	assert.Equal(t, http.StatusCreated, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	require.NoError(t, err)

	assert.Contains(t, response, "message")
	msg := response["message"].(map[string]interface{})
	assert.Equal(t, "Hello world", msg["text"])

	mockService.AssertExpectations(t)
}

// Test: Send message when not a member
func TestMessageHandler_Send_NotMember(t *testing.T) {
	mockService := new(MockMessageService)
	handler := NewMessageHandler(mockService)

	mockService.On("Send", mock.Anything, "test-channel-id", "test-user-id", "Hello").
		Return(nil, models.ErrNotChannelMember)

	reqBody := map[string]string{
		"text": "Hello",
	}
	bodyJSON, _ := json.Marshal(reqBody)
	req := httptest.NewRequest(http.MethodPost, "/api/v1/channels/test-channel-id/messages", bytes.NewReader(bodyJSON))
	req.Header.Set("Content-Type", "application/json")

	ctx := context.WithValue(req.Context(), middleware.UserIDKey, "test-user-id")
	req = req.WithContext(ctx)

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("channel_id", "test-channel-id")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rr := httptest.NewRecorder()

	handler.Send(rr, req)

	assert.Equal(t, http.StatusForbidden, rr.Code)

	mockService.AssertExpectations(t)
}

// Test: Get messages successfully
func TestMessageHandler_GetMessages_Success(t *testing.T) {
	mockService := new(MockMessageService)
	handler := NewMessageHandler(mockService)

	messageList := &models.MessageList{
		Messages: []*models.Message{
			{ID: "msg1", Text: "Message 1"},
			{ID: "msg2", Text: "Message 2"},
		},
		HasMore: false,
	}

	mockService.On("GetMessages", mock.Anything, "test-channel-id", "test-user-id", 50, "").
		Return(messageList, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/channels/test-channel-id/messages", nil)

	ctx := context.WithValue(req.Context(), middleware.UserIDKey, "test-user-id")
	req = req.WithContext(ctx)

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("channel_id", "test-channel-id")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rr := httptest.NewRecorder()

	handler.GetMessages(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	require.NoError(t, err)

	assert.Contains(t, response, "messages")
	assert.Contains(t, response, "has_more")
	assert.False(t, response["has_more"].(bool))

	mockService.AssertExpectations(t)
}

// Test: Get messages with limit and before parameters
func TestMessageHandler_GetMessages_WithParams(t *testing.T) {
	mockService := new(MockMessageService)
	handler := NewMessageHandler(mockService)

	messageList := &models.MessageList{
		Messages: []*models.Message{
			{ID: "msg3", Text: "Message 3"},
		},
		HasMore: true,
	}

	mockService.On("GetMessages", mock.Anything, "test-channel-id", "test-user-id", 10, "msg2-id").
		Return(messageList, nil)

	req := httptest.NewRequest(http.MethodGet, "/api/v1/channels/test-channel-id/messages?limit=10&before=msg2-id", nil)

	ctx := context.WithValue(req.Context(), middleware.UserIDKey, "test-user-id")
	req = req.WithContext(ctx)

	rctx := chi.NewRouteContext()
	rctx.URLParams.Add("channel_id", "test-channel-id")
	req = req.WithContext(context.WithValue(req.Context(), chi.RouteCtxKey, rctx))

	rr := httptest.NewRecorder()

	handler.GetMessages(rr, req)

	assert.Equal(t, http.StatusOK, rr.Code)

	var response map[string]interface{}
	err := json.NewDecoder(rr.Body).Decode(&response)
	require.NoError(t, err)

	assert.True(t, response["has_more"].(bool))

	mockService.AssertExpectations(t)
}
