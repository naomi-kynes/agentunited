package repository

import (
	"context"
	"crypto/sha256"
	"fmt"
	"testing"
	"time"

	"github.com/agentunited/backend/internal/models"
	"github.com/google/uuid"
	"github.com/stretchr/testify/require"
	"golang.org/x/crypto/bcrypt"
)

func TestInviteRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	userRepo := NewUserRepository(db)
	inviteRepo := NewInviteRepository(db)

	ctx := context.Background()

	// Create user first
	user := &models.User{
		ID:           uuid.New().String(),
		Email:        "user@example.com",
		PasswordHash: hashPassword(t, "password123"),
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)

	// Create invite
	invite := &models.Invite{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Status:    models.InviteStatusPending,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		CreatedAt: time.Now(),
	}
	tokenHash := hashToken("test-token")

	err = inviteRepo.Create(ctx, invite, tokenHash)
	require.NoError(t, err)
	require.NotEmpty(t, invite.ID)
	require.NotZero(t, invite.CreatedAt)
}

func TestInviteRepository_GetByTokenHash(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	userRepo := NewUserRepository(db)
	inviteRepo := NewInviteRepository(db)

	ctx := context.Background()

	// Create user and invite
	user := &models.User{
		ID:           uuid.New().String(),
		Email:        "user@example.com",
		PasswordHash: hashPassword(t, "password123"),
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)

	invite := &models.Invite{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Status:    models.InviteStatusPending,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		CreatedAt: time.Now(),
	}
	tokenHash := hashToken("test-token")
	err = inviteRepo.Create(ctx, invite, tokenHash)
	require.NoError(t, err)

	// Retrieve invite
	retrieved, err := inviteRepo.GetByTokenHash(ctx, tokenHash)
	require.NoError(t, err)
	require.Equal(t, invite.ID, retrieved.ID)
	require.Equal(t, invite.UserID, retrieved.UserID)
	require.Equal(t, invite.Status, retrieved.Status)
}

func TestInviteRepository_ConsumeToken(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	userRepo := NewUserRepository(db)
	inviteRepo := NewInviteRepository(db)

	ctx := context.Background()

	// Create user and invite
	user := &models.User{
		ID:           uuid.New().String(),
		Email:        "user@example.com",
		PasswordHash: hashPassword(t, "password123"),
	}
	err := userRepo.Create(ctx, user)
	require.NoError(t, err)

	invite := &models.Invite{
		ID:        uuid.New().String(),
		UserID:    user.ID,
		Status:    models.InviteStatusPending,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		CreatedAt: time.Now(),
	}
	tokenHash := hashToken("test-token")
	err = inviteRepo.Create(ctx, invite, tokenHash)
	require.NoError(t, err)

	// Consume token
	err = inviteRepo.ConsumeToken(ctx, tokenHash)
	require.NoError(t, err)

	// Verify status changed
	retrieved, err := inviteRepo.GetByTokenHash(ctx, tokenHash)
	require.NoError(t, err)
	require.Equal(t, models.InviteStatusConsumed, retrieved.Status)
	require.NotNil(t, retrieved.ConsumedAt)
}

func TestInviteRepository_GetByTokenHash_NotFound(t *testing.T) {
	db := setupTestDB(t)
	defer cleanupTestDB(t, db)

	inviteRepo := NewInviteRepository(db)
	ctx := context.Background()

	_, err := inviteRepo.GetByTokenHash(ctx, "nonexistent-hash")
	require.Error(t, err)
	require.Equal(t, models.ErrInviteNotFound, err)
}

func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", hash)
}

func hashPassword(t *testing.T, password string) string {
	t.Helper()
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	require.NoError(t, err)
	return string(hash)
}