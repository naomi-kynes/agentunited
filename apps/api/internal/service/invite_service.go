package service

import (
	"context"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
	"net/url"
	"time"

	"github.com/agentunited/backend/internal/models"
	"github.com/agentunited/backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

// InviteService handles invite operations
type InviteService struct {
	userRepo   repository.UserRepository
	inviteRepo repository.InviteRepository
	jwtSecret  string
	baseURL    string
}

// NewInviteService creates a new invite service
func NewInviteService(
	userRepo repository.UserRepository,
	inviteRepo repository.InviteRepository,
	jwtSecret string,
	baseURL string,
) *InviteService {
	return &InviteService{
		userRepo:   userRepo,
		inviteRepo: inviteRepo,
		jwtSecret:  jwtSecret,
		baseURL:    baseURL,
	}
}

// ValidateInvite validates an invite token and returns invite + user info
func (s *InviteService) ValidateInvite(ctx context.Context, token string) (*models.Invite, *models.User, error) {
	tokenHash := s.hashToken(token)

	// Validate token
	invite, err := s.inviteRepo.ValidateToken(ctx, tokenHash)
	if err != nil {
		return nil, nil, err
	}

	// Get user info
	user, err := s.userRepo.GetByID(ctx, invite.UserID)
	if err != nil {
		return nil, nil, fmt.Errorf("get user: %w", err)
	}

	return invite, user, nil
}

// AcceptInvite consumes an invite token and sets user password
func (s *InviteService) AcceptInvite(ctx context.Context, token, password string) (string, error) {
	// Validate password strength first
	if len(password) < 12 {
		return "", models.ErrWeakPassword
	}

	tokenHash := s.hashToken(token)

	// Validate token
	invite, err := s.inviteRepo.ValidateToken(ctx, tokenHash)
	if err != nil {
		return "", err
	}

	// Get user
	user, err := s.userRepo.GetByID(ctx, invite.UserID)
	if err != nil {
		return "", fmt.Errorf("get user: %w", err)
	}

	// Hash password
	passwordHash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}

	// Update user with password
	user.PasswordHash = string(passwordHash)
	user.UpdatedAt = time.Now()

	if err := s.userRepo.Update(ctx, user); err != nil {
		return "", fmt.Errorf("update user password: %w", err)
	}

	// Consume invite token
	if err := s.inviteRepo.ConsumeToken(ctx, tokenHash); err != nil {
		return "", fmt.Errorf("consume invite token: %w", err)
	}

	// Generate JWT token
	jwtToken, err := s.generateJWTToken(user.ID, user.Email)
	if err != nil {
		return "", fmt.Errorf("generate JWT token: %w", err)
	}

	return jwtToken, nil
}

// CreateInvite creates a new invite for a human user and returns plaintext token + URL.
func (s *InviteService) CreateInvite(ctx context.Context, email, displayName string) (string, string, error) {
	var userID string

	if existing, err := s.userRepo.GetByEmail(ctx, email); err == nil {
		userID = existing.ID
	} else {
		userID = uuid.New().String()
		human := &models.User{
			ID:           userID,
			Email:        email,
			DisplayName:  displayName,
			PasswordHash: "",
			CreatedAt:    time.Now(),
			UpdatedAt:    time.Now(),
		}
		if err := s.userRepo.Create(ctx, human); err != nil {
			return "", "", fmt.Errorf("create invite user: %w", err)
		}
	}

	token, tokenHash, err := s.generateInviteToken()
	if err != nil {
		return "", "", err
	}

	invite := &models.Invite{
		ID:        uuid.New().String(),
		UserID:    userID,
		Status:    models.InviteStatusPending,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour),
		CreatedAt: time.Now(),
	}
	if err := s.inviteRepo.Create(ctx, invite, tokenHash); err != nil {
		return "", "", fmt.Errorf("create invite: %w", err)
	}

	return token, s.createInviteURL(token), nil
}

// hashToken creates a SHA-256 hash of the token
func (s *InviteService) hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", hash)
}

func (s *InviteService) generateInviteToken() (string, string, error) {
	randomBytes := make([]byte, 32)
	if _, err := rand.Read(randomBytes); err != nil {
		return "", "", fmt.Errorf("generate random bytes: %w", err)
	}
	token := "inv_" + base64.URLEncoding.EncodeToString(randomBytes)
	hash := sha256.Sum256([]byte(token))
	return token, fmt.Sprintf("%x", hash), nil
}

func (s *InviteService) createInviteURL(token string) string {
	u, _ := url.Parse(s.baseURL)
	u.Path = "/invite"
	q := u.Query()
	q.Set("token", token)
	u.RawQuery = q.Encode()
	return u.String()
}

// generateJWTToken creates a JWT token for the user
func (s *InviteService) generateJWTToken(userID, email string) (string, error) {
	claims := &JWTClaims{
		UserID: userID,
		Email:  email,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.jwtSecret))
}
