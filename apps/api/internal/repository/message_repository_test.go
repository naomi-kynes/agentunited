package repository

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/agentunited/backend/internal/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMessageRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	msgRepo := NewMessageRepository(db)
	userRepo := NewUserRepository(db)
	channelRepo := NewChannelRepository(db)
	ctx := context.Background()

	// Create user and channel
	user := &models.User{
		Email:        "user@example.com",
		PasswordHash: "hash",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)

	channel := &models.Channel{
		Name:      "general",
		Topic:     "General",
		CreatedBy: user.ID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err = channelRepo.Create(ctx, channel)
	require.NoError(t, err)

	// Create message
	message := &models.Message{
		ChannelID:  channel.ID,
		AuthorID:   user.ID,
		AuthorType: "user",
		Text:       "Hello world",
		CreatedAt:  time.Now(),
	}

	err = msgRepo.Create(ctx, message)
	require.NoError(t, err)

	// Verify ID was assigned
	assert.NotEmpty(t, message.ID)
	assert.False(t, message.CreatedAt.IsZero())
}

func TestMessageRepository_GetByChannel(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	msgRepo := NewMessageRepository(db)
	userRepo := NewUserRepository(db)
	channelRepo := NewChannelRepository(db)
	ctx := context.Background()

	// Create user and channel
	user := &models.User{
		Email:        "user@example.com",
		PasswordHash: "hash",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)

	channel := &models.Channel{
		Name:      "general",
		Topic:     "General",
		CreatedBy: user.ID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err = channelRepo.Create(ctx, channel)
	require.NoError(t, err)

	// Create 5 messages
	var messageIDs []string
	for i := 1; i <= 5; i++ {
		msg := &models.Message{
			ChannelID:  channel.ID,
			AuthorID:   user.ID,
			AuthorType: "user",
			Text:       fmt.Sprintf("Message %d", i),
			CreatedAt:  time.Now().Add(time.Duration(i) * time.Second), // Ensure ordering
		}
		err = msgRepo.Create(ctx, msg)
		require.NoError(t, err)
		messageIDs = append(messageIDs, msg.ID)

		time.Sleep(10 * time.Millisecond) // Ensure distinct timestamps
	}

	// Get messages (limit 3, no cursor)
	messages, hasMore, err := msgRepo.GetByChannel(ctx, channel.ID, 3, "")
	require.NoError(t, err)

	// Should return 3 messages (newest first)
	assert.Len(t, messages, 3)
	assert.True(t, hasMore) // More messages available

	// Verify ordering (newest first)
	assert.Equal(t, "Message 5", messages[0].Text)
	assert.Equal(t, "Message 4", messages[1].Text)
	assert.Equal(t, "Message 3", messages[2].Text)

	// Verify author email is populated
	assert.Equal(t, "user@example.com", messages[0].AuthorEmail)
}

func TestMessageRepository_GetByChannel_Pagination(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	msgRepo := NewMessageRepository(db)
	userRepo := NewUserRepository(db)
	channelRepo := NewChannelRepository(db)
	ctx := context.Background()

	// Create user and channel
	user := &models.User{
		Email:        "user@example.com",
		PasswordHash: "hash",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)

	channel := &models.Channel{
		Name:      "general",
		Topic:     "General",
		CreatedBy: user.ID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err = channelRepo.Create(ctx, channel)
	require.NoError(t, err)

	// Create 5 messages
	var messages []*models.Message
	for i := 1; i <= 5; i++ {
		msg := &models.Message{
			ChannelID:  channel.ID,
			AuthorID:   user.ID,
			AuthorType: "user",
			Text:       fmt.Sprintf("Message %d", i),
			CreatedAt:  time.Now().Add(time.Duration(i) * time.Second),
		}
		err = msgRepo.Create(ctx, msg)
		require.NoError(t, err)
		messages = append(messages, msg)

		time.Sleep(10 * time.Millisecond)
	}

	// Get first page (limit 2)
	page1, hasMore1, err := msgRepo.GetByChannel(ctx, channel.ID, 2, "")
	require.NoError(t, err)
	assert.Len(t, page1, 2)
	assert.True(t, hasMore1)
	assert.Equal(t, "Message 5", page1[0].Text)
	assert.Equal(t, "Message 4", page1[1].Text)

	// Get second page (using last message ID as cursor)
	page2, hasMore2, err := msgRepo.GetByChannel(ctx, channel.ID, 2, page1[1].ID)
	require.NoError(t, err)
	assert.Len(t, page2, 2)
	assert.True(t, hasMore2)
	assert.Equal(t, "Message 3", page2[0].Text)
	assert.Equal(t, "Message 2", page2[1].Text)

	// Get third page
	page3, hasMore3, err := msgRepo.GetByChannel(ctx, channel.ID, 2, page2[1].ID)
	require.NoError(t, err)
	assert.Len(t, page3, 1)
	assert.False(t, hasMore3) // No more messages
	assert.Equal(t, "Message 1", page3[0].Text)
}

func TestMessageRepository_GetByChannel_EmptyChannel(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	msgRepo := NewMessageRepository(db)
	userRepo := NewUserRepository(db)
	channelRepo := NewChannelRepository(db)
	ctx := context.Background()

	// Create user and channel
	user := &models.User{
		Email:        "user@example.com",
		PasswordHash: "hash",
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)

	channel := &models.Channel{
		Name:      "empty",
		Topic:     "Empty channel",
		CreatedBy: user.ID,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}
	err = channelRepo.Create(ctx, channel)
	require.NoError(t, err)

	// Get messages from empty channel
	messages, hasMore, err := msgRepo.GetByChannel(ctx, channel.ID, 50, "")
	require.NoError(t, err)

	assert.Empty(t, messages)
	assert.False(t, hasMore)
}
