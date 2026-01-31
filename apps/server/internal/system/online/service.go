package online

import (
	"context"
	"errors"
	"strings"
	"time"
)

var (
	ErrServiceUnavailable = errors.New("online service is not initialized")
)

type SessionManager interface {
	RevokeSession(ctx context.Context, sessionID string) error
}

type Service struct {
	repo           *Repository
	sessionManager SessionManager
}

func NewService(repo *Repository, manager SessionManager) *Service {
	if repo == nil {
		return nil
	}
	return &Service{repo: repo, sessionManager: manager}
}

type ListResult struct {
	List     []OnlineUser `json:"list"`
	Total    int          `json:"total"`
	PageNum  int          `json:"pageNum"`
	PageSize int          `json:"pageSize"`
}

type OnlineUser struct {
	SessionID      string `json:"sessionId"`
	TokenID        string `json:"tokenId"`
	UserID         int64  `json:"userId"`
	UserName       string `json:"userName"`
	NickName       string `json:"nickName,omitempty"`
	DeptName       string `json:"deptName,omitempty"`
	IPAddr         string `json:"ipaddr,omitempty"`
	LoginLocation  string `json:"loginLocation,omitempty"`
	Browser        string `json:"browser,omitempty"`
	OS             string `json:"os,omitempty"`
	Status         string `json:"status,omitempty"`
	Msg            string `json:"msg,omitempty"`
	LoginTime      string `json:"loginTime,omitempty"`
	LastAccessTime string `json:"lastAccessTime,omitempty"`
}

func (s *Service) ListOnlineUsers(ctx context.Context, opts ListOptions) (*ListResult, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize <= 0 {
		pageSize = defaultPageSize
	}

	opts.PageNum = pageNum
	opts.PageSize = pageSize

	items, total, err := s.repo.ListOnlineUsers(ctx, opts)
	if err != nil {
		return nil, err
	}

	users := make([]OnlineUser, 0, len(items))
	for i := range items {
		users = append(users, onlineUserFromSession(&items[i]))
	}

	return &ListResult{
		List:     users,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
	}, nil
}

func (s *Service) GetOnlineUser(ctx context.Context, sessionID string) (*OnlineUser, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	session, err := s.repo.GetSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}
	user := onlineUserFromSession(session)
	return &user, nil
}

func (s *Service) ForceLogout(ctx context.Context, sessionID string) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}

	session, err := s.repo.DeleteSession(ctx, sessionID)
	if err != nil {
		return err
	}
	if s.sessionManager != nil {
		_ = s.sessionManager.RevokeSession(ctx, sessionID)
	}

	s.blockTokenIfNeeded(ctx, session)
	return nil
}

func (s *Service) BatchForceLogout(ctx context.Context, sessionIDs []string) (int, error) {
	if s == nil || s.repo == nil {
		return 0, ErrServiceUnavailable
	}

	removed, err := s.repo.DeleteSessions(ctx, sessionIDs)
	if err != nil {
		return 0, err
	}

	for i := range removed {
		if s.sessionManager != nil {
			_ = s.sessionManager.RevokeSession(ctx, removed[i].SessionID)
		}
		s.blockTokenIfNeeded(ctx, &removed[i])
	}
	return len(removed), nil
}

func (s *Service) RecordSession(ctx context.Context, session Session) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	return s.repo.SaveSession(ctx, &session)
}

func (s *Service) RemoveSessionByTokenHash(ctx context.Context, tokenHash string) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	_, err := s.repo.DeleteSessionByTokenHash(ctx, tokenHash)
	if err != nil && !errors.Is(err, ErrSessionNotFound) {
		return err
	}
	return nil
}

func (s *Service) IsTokenBlocked(ctx context.Context, tokenHash string) (bool, error) {
	if s == nil || s.repo == nil {
		return false, ErrServiceUnavailable
	}
	return s.repo.IsTokenBlocked(ctx, tokenHash)
}

func (s *Service) UpdateLastSeen(ctx context.Context, sessionID string, lastSeen time.Time) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	return s.repo.UpdateLastSeen(ctx, sessionID, lastSeen)
}

func (s *Service) blockTokenIfNeeded(ctx context.Context, session *Session) {
	if session == nil || strings.TrimSpace(session.TokenHash) == "" {
		return
	}
	if s.repo == nil {
		return
	}

	ttl := time.Until(session.ExpiresAt)
	if ttl <= 0 {
		ttl = defaultSessionTTL
	}
	_ = s.repo.BlockToken(ctx, session.TokenHash, ttl)
}

func onlineUserFromSession(session *Session) OnlineUser {
	if session == nil {
		return OnlineUser{}
	}

	return OnlineUser{
		SessionID:      session.SessionID,
		TokenID:        session.SessionID,
		UserID:         session.UserID,
		UserName:       session.UserName,
		NickName:       session.NickName,
		DeptName:       session.DeptName,
		IPAddr:         session.IPAddr,
		LoginLocation:  session.LoginLocation,
		Browser:        session.Browser,
		OS:             session.OS,
		Status:         session.Status,
		Msg:            session.Msg,
		LoginTime:      formatTimestamp(session.LoginTime),
		LastAccessTime: formatTimestamp(session.LastAccessTime),
	}
}

func formatTimestamp(value time.Time) string {
	if value.IsZero() {
		return ""
	}
	return value.Format("2006-01-02 15:04:05")
}
