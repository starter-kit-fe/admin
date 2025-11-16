package app

import (
	"context"

	"github.com/starter-kit-fe/admin/internal/middleware"
	"github.com/starter-kit-fe/admin/internal/system/auth"
	"github.com/starter-kit-fe/admin/internal/system/online"
)

type sessionValidatorAdapter struct {
	store  *auth.SessionStore
	online *online.Service
}

func newSessionValidator(store *auth.SessionStore, onlineSvc *online.Service) middleware.SessionValidator {
	if store == nil {
		return nil
	}
	return &sessionValidatorAdapter{store: store, online: onlineSvc}
}

func (a *sessionValidatorAdapter) GetSession(ctx context.Context, sessionID string) (middleware.SessionMetadata, error) {
	if a == nil || a.store == nil {
		return middleware.SessionMetadata{}, auth.ErrSessionNotFound
	}
	session, err := a.store.Get(ctx, sessionID)
	if err != nil {
		return middleware.SessionMetadata{}, err
	}
	return middleware.SessionMetadata{UserID: session.UserID, Revoked: session.Revoked}, nil
}

func (a *sessionValidatorAdapter) UpdateLastSeen(ctx context.Context, sessionID string) error {
	if a == nil || a.store == nil {
		return nil
	}
	session, err := a.store.Get(ctx, sessionID)
	if err != nil {
		return err
	}
	prev := session.LastSeen
	if err := a.store.UpdateLastSeen(ctx, session); err != nil {
		return err
	}
	if a.online != nil && session.LastSeen.After(prev) {
		_ = a.online.UpdateLastSeen(ctx, sessionID, session.LastSeen)
	}
	return nil
}

type sessionManagerAdapter struct {
	store *auth.SessionStore
}

func newSessionManager(store *auth.SessionStore) online.SessionManager {
	if store == nil {
		return nil
	}
	return &sessionManagerAdapter{store: store}
}

func (a *sessionManagerAdapter) RevokeSession(ctx context.Context, sessionID string) error {
	if a == nil || a.store == nil {
		return nil
	}
	session, err := a.store.Get(ctx, sessionID)
	if err != nil {
		return err
	}
	return a.store.Revoke(ctx, session)
}
