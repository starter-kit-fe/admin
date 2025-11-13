package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"

	"github.com/starter-kit-fe/admin/pkg/security"
)

var (
	// ErrSessionNotFound indicates the session no longer exists in Redis.
	ErrSessionNotFound = errors.New("auth session not found")
	// ErrSessionRevoked signals the session has been revoked manually.
	ErrSessionRevoked = errors.New("session revoked")
	// ErrRefreshTokenMissing indicates the session no longer tracks a refresh token.
	ErrRefreshTokenMissing = errors.New("refresh token missing")
	// ErrRefreshTokenMismatch indicates the provided refresh token is not valid.
	ErrRefreshTokenMismatch = errors.New("refresh token mismatch")
	// ErrInvalidRefreshToken is returned when the supplied refresh token has an invalid format.
	ErrInvalidRefreshToken = errors.New("invalid refresh token")
)

// Session models the persisted authentication state for a single device/login.
type Session struct {
	SessionID        string    `json:"session_id"`
	UserID           uint      `json:"user_id"`
	RefreshTokenHash string    `json:"refresh_token_hash"`
	CreatedAt        time.Time `json:"created_at"`
	LastSeen         time.Time `json:"last_seen"`
	Revoked          bool      `json:"revoked"`
}

// SessionStore encapsulates Redis operations for managing login sessions.
type SessionStore struct {
	cache          *redis.Client
	keyPrefix      string
	refreshTTL     time.Duration
	updateInterval time.Duration
}

type SessionStoreOptions struct {
	KeyPrefix      string
	RefreshTTL     time.Duration
	UpdateInterval time.Duration
}

func NewSessionStore(cache *redis.Client, opts SessionStoreOptions) *SessionStore {
	if cache == nil {
		return nil
	}
	prefix := strings.TrimSpace(opts.KeyPrefix)
	if prefix == "" {
		prefix = "auth"
	}
	refreshTTL := opts.RefreshTTL
	if refreshTTL <= 0 {
		refreshTTL = 30 * 24 * time.Hour
	}
	updateInterval := opts.UpdateInterval
	if updateInterval <= 0 {
		updateInterval = time.Minute
	}
	return &SessionStore{
		cache:          cache,
		keyPrefix:      prefix,
		refreshTTL:     refreshTTL,
		updateInterval: updateInterval,
	}
}

// Create registers a brand-new session and returns the persisted record alongside
// a plaintext refresh token the caller must return to the client.
func (s *SessionStore) Create(ctx context.Context, userID uint) (*Session, string, error) {
	if s == nil || s.cache == nil {
		return nil, "", errors.New("session store unavailable")
	}
	sessionID := uuid.NewString()
	refreshToken := uuid.NewString()
	refreshHash := security.SHA256Hex(refreshToken)
	now := time.Now()
	session := &Session{
		SessionID:        sessionID,
		UserID:           userID,
		RefreshTokenHash: refreshHash,
		CreatedAt:        now,
		LastSeen:         now,
		Revoked:          false,
	}
	if err := s.persistSession(ctx, session); err != nil {
		return nil, "", err
	}
	return session, refreshToken, nil
}

// Get returns the session record if it exists.
func (s *SessionStore) Get(ctx context.Context, sessionID string) (*Session, error) {
	if s == nil || s.cache == nil {
		return nil, errors.New("session store unavailable")
	}
	key := s.sessionKey(sessionID)
	payload, err := s.cache.Get(ctx, key).Bytes()
	if errors.Is(err, redis.Nil) {
		return nil, ErrSessionNotFound
	}
	if err != nil {
		return nil, err
	}
	var session Session
	if err := json.Unmarshal(payload, &session); err != nil {
		return nil, err
	}
	return &session, nil
}

// ValidateRefresh ensures the provided refresh token matches the stored hash and the session is active.
func (s *SessionStore) ValidateRefresh(ctx context.Context, sessionID, refreshToken string) (*Session, error) {
	if strings.TrimSpace(sessionID) == "" {
		var err error
		sessionID, err = s.sessionIDByRefresh(ctx, refreshToken)
		if err != nil {
			return nil, err
		}
	}
	session, err := s.Get(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	if session.Revoked {
		return nil, ErrSessionRevoked
	}
	if session.RefreshTokenHash == "" {
		return nil, ErrRefreshTokenMissing
	}
	if security.SHA256Hex(refreshToken) != session.RefreshTokenHash {
		return nil, ErrRefreshTokenMismatch
	}
	return session, nil
}

// UpdateLastSeen touches the session if the update window elapsed.
func (s *SessionStore) UpdateLastSeen(ctx context.Context, session *Session) error {
	if s == nil || session == nil {
		return nil
	}
	now := time.Now()
	if now.Sub(session.LastSeen) < s.updateInterval {
		return nil
	}
	session.LastSeen = now
	return s.persistSession(ctx, session)
}

// Revoke marks the session as revoked and removes it from helper indexes.
func (s *SessionStore) Revoke(ctx context.Context, session *Session) error {
	if s == nil || session == nil {
		return nil
	}
	session.Revoked = true
	key := s.sessionKey(session.SessionID)
	userSet := s.userSessionsKey(session.UserID)
	pipe := s.cache.TxPipeline()
	data, _ := json.Marshal(session)
	pipe.Set(ctx, key, data, s.refreshTTL)
	pipe.SRem(ctx, userSet, session.SessionID)
	if session.RefreshTokenHash != "" {
		pipe.Del(ctx, s.refreshIndexKey(session.RefreshTokenHash))
	}
	pipe.ZRem(ctx, s.onlineKey(), session.SessionID)
	_, err := pipe.Exec(ctx)
	return err
}

// RevokeAll removes all active sessions for a user.
func (s *SessionStore) RevokeAll(ctx context.Context, userID uint) (int, error) {
	if s == nil {
		return 0, errors.New("session store unavailable")
	}
	userSet := s.userSessionsKey(userID)
	ids, err := s.cache.SMembers(ctx, userSet).Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return 0, err
	}
	count := 0
	for _, id := range ids {
		session, err := s.Get(ctx, id)
		if err != nil {
			continue
		}
		if err := s.Revoke(ctx, session); err == nil {
			count++
		}
	}
	return count, nil
}

// OnlineSince lists sessions active within the provided time window.
func (s *SessionStore) OnlineSince(ctx context.Context, window time.Duration) ([]Session, error) {
	if s == nil || s.cache == nil {
		return nil, errors.New("session store unavailable")
	}
	now := time.Now().Unix()
	min := float64(now - int64(window.Seconds()))
	max := float64(now)
	ids, err := s.cache.ZRangeByScore(ctx, s.onlineKey(), &redis.ZRangeBy{
		Min: fmt.Sprintf("%f", min),
		Max: fmt.Sprintf("%f", max),
	}).Result()
	if err != nil && !errors.Is(err, redis.Nil) {
		return nil, err
	}
	sessions := make([]Session, 0, len(ids))
	for _, id := range ids {
		session, err := s.Get(ctx, id)
		if err != nil || session == nil || session.Revoked {
			continue
		}
		sessions = append(sessions, *session)
	}
	return sessions, nil
}

func (s *SessionStore) persistSession(ctx context.Context, session *Session) error {
	data, err := json.Marshal(session)
	if err != nil {
		return err
	}
	key := s.sessionKey(session.SessionID)
	userSet := s.userSessionsKey(session.UserID)
	pipe := s.cache.TxPipeline()
	pipe.Set(ctx, key, data, s.refreshTTL)
	pipe.SAdd(ctx, userSet, session.SessionID)
	pipe.Expire(ctx, userSet, s.refreshTTL)
	pipe.ZAdd(ctx, s.onlineKey(), redis.Z{Score: float64(session.LastSeen.Unix()), Member: session.SessionID})
	if session.RefreshTokenHash != "" {
		pipe.Set(ctx, s.refreshIndexKey(session.RefreshTokenHash), session.SessionID, s.refreshTTL)
	}
	_, err = pipe.Exec(ctx)
	return err
}

func (s *SessionStore) sessionKey(sessionID string) string {
	return fmt.Sprintf("%s:session:%s", s.keyPrefix, strings.TrimSpace(sessionID))
}

func (s *SessionStore) userSessionsKey(userID uint) string {
	return fmt.Sprintf("%s:user_sessions:%d", s.keyPrefix, userID)
}

func (s *SessionStore) onlineKey() string {
	return fmt.Sprintf("%s:online_sessions", s.keyPrefix)
}

func (s *SessionStore) refreshIndexKey(hash string) string {
	return fmt.Sprintf("%s:refresh:%s", s.keyPrefix, strings.TrimSpace(hash))
}

func (s *SessionStore) sessionIDByRefresh(ctx context.Context, refreshToken string) (string, error) {
	hash := security.SHA256Hex(refreshToken)
	if hash == "" {
		return "", ErrInvalidRefreshToken
	}
	key := s.refreshIndexKey(hash)
	id, err := s.cache.Get(ctx, key).Result()
	if errors.Is(err, redis.Nil) {
		return "", ErrSessionNotFound
	}
	return id, err
}
