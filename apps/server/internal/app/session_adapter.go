package app

import (
	"context"

	"github.com/starter-kit-fe/admin/internal/system/auth"
	"github.com/starter-kit-fe/admin/internal/system/online"
	"github.com/starter-kit-fe/admin/middleware"
)

type sessionValidatorAdapter struct {
	store *auth.SessionStore
}

func newSessionValidator(store *auth.SessionStore) middleware.SessionValidator {
	if store == nil {
		return nil
	}
	return &sessionValidatorAdapter{store: store}
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
	return a.store.UpdateLastSeen(ctx, session)
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
