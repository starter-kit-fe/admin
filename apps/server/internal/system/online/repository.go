package online

import (
	"context"
	"encoding/json"
	"errors"
	"strconv"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("online repository is not initialized")
	ErrSessionNotFound       = errors.New("online session not found")
)

const (
	defaultKeyPrefix     = "admin:online"
	defaultPageSize      = 10
	defaultSessionTTL    = 24 * time.Hour
	maxFallbackBatchSize = 500
)

type Repository struct {
	db        *gorm.DB
	cache     *redis.Client
	keyPrefix string
}

type Option func(*Repository)

func WithKeyPrefix(prefix string) Option {
	return func(r *Repository) {
		prefix = strings.TrimSpace(prefix)
		if prefix != "" {
			r.keyPrefix = prefix
		}
	}
}

func NewRepository(db *gorm.DB, cache *redis.Client, opts ...Option) *Repository {
	if db == nil && cache == nil {
		return nil
	}
	repo := &Repository{
		db:        db,
		cache:     cache,
		keyPrefix: defaultKeyPrefix,
	}
	for _, opt := range opts {
		if opt != nil {
			opt(repo)
		}
	}
	return repo
}

type ListOptions struct {
	PageNum  int
	PageSize int
	UserName string
	IPAddr   string
	Since    time.Time
}

type Session struct {
	SessionID      string    `json:"sessionId"`
	TokenHash      string    `json:"tokenHash"`
	UserID         int64     `json:"userId"`
	UserName       string    `json:"userName"`
	NickName       string    `json:"nickName,omitempty"`
	DeptName       string    `json:"deptName,omitempty"`
	IPAddr         string    `json:"ipaddr,omitempty"`
	LoginLocation  string    `json:"loginLocation,omitempty"`
	Browser        string    `json:"browser,omitempty"`
	OS             string    `json:"os,omitempty"`
	Status         string    `json:"status,omitempty"`
	Msg            string    `json:"msg,omitempty"`
	LoginTime      time.Time `json:"loginTime"`
	LastAccessTime time.Time `json:"lastAccessTime"`
	ExpiresAt      time.Time `json:"expiresAt"`
}

func (r *Repository) SaveSession(ctx context.Context, session *Session) error {
	if r == nil || r.cache == nil {
		return ErrRepositoryUnavailable
	}
	if session == nil || strings.TrimSpace(session.SessionID) == "" || strings.TrimSpace(session.TokenHash) == "" {
		return errors.New("invalid session payload")
	}

	ttl := time.Until(session.ExpiresAt)
	if ttl <= 0 {
		ttl = defaultSessionTTL
		session.ExpiresAt = time.Now().Add(ttl)
	}
	if session.LastAccessTime.IsZero() {
		session.LastAccessTime = session.LoginTime
	}

	payload, err := json.Marshal(session)
	if err != nil {
		return err
	}

	pipe := r.cache.TxPipeline()
	pipe.Set(ctx, r.sessionKey(session.SessionID), payload, ttl)
	pipe.ZAdd(ctx, r.indexKey(), redis.Z{Score: float64(session.LoginTime.UnixNano()), Member: session.SessionID})
	pipe.Set(ctx, r.tokenKey(session.TokenHash), session.SessionID, ttl)
	_, err = pipe.Exec(ctx)
	return err
}

func (r *Repository) GetSession(ctx context.Context, sessionID string) (*Session, error) {
	if r == nil {
		return nil, ErrRepositoryUnavailable
	}
	sessionID = strings.TrimSpace(sessionID)
	if sessionID == "" {
		return nil, ErrSessionNotFound
	}

	if r.cache != nil {
		data, err := r.cache.Get(ctx, r.sessionKey(sessionID)).Bytes()
		if errors.Is(err, redis.Nil) {
			return nil, ErrSessionNotFound
		}
		if err != nil {
			return nil, err
		}

		var session Session
		if err := json.Unmarshal(data, &session); err != nil {
			return nil, err
		}
		return &session, nil
	}

	// Fallback to database query
	if r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	var record model.SysLogininfor
	err := r.db.WithContext(ctx).
		Where("info_id = ?", sessionID).
		Where("status = ?", "0").
		Order("login_time DESC").
		First(&record).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, ErrSessionNotFound
		}
		return nil, err
	}
	return sessionFromModel(&record), nil
}

func (r *Repository) DeleteSession(ctx context.Context, sessionID string) (*Session, error) {
	if r == nil {
		return nil, ErrRepositoryUnavailable
	}
	sessionID = strings.TrimSpace(sessionID)
	if sessionID == "" {
		return nil, ErrSessionNotFound
	}

	session, err := r.GetSession(ctx, sessionID)
	if err != nil {
		return nil, err
	}

	if r.cache != nil {
		r.removeSessionRecords(ctx, session)
	}

	return session, nil
}

func (r *Repository) DeleteSessions(ctx context.Context, sessionIDs []string) ([]Session, error) {
	if r == nil {
		return nil, ErrRepositoryUnavailable
	}

	removed := make([]Session, 0, len(sessionIDs))
	for _, id := range sessionIDs {
		session, err := r.DeleteSession(ctx, id)
		if err != nil {
			if errors.Is(err, ErrSessionNotFound) {
				continue
			}
			return nil, err
		}
		if session != nil {
			removed = append(removed, *session)
		}
	}
	return removed, nil
}

func (r *Repository) DeleteSessionByTokenHash(ctx context.Context, tokenHash string) (*Session, error) {
	if r == nil {
		return nil, ErrRepositoryUnavailable
	}
	tokenHash = strings.TrimSpace(tokenHash)
	if tokenHash == "" {
		return nil, ErrSessionNotFound
	}

	if r.cache == nil {
		return nil, ErrRepositoryUnavailable
	}

	sessionID, err := r.cache.Get(ctx, r.tokenKey(tokenHash)).Result()
	if errors.Is(err, redis.Nil) {
		return nil, ErrSessionNotFound
	}
	if err != nil {
		return nil, err
	}

	return r.DeleteSession(ctx, sessionID)
}

func (r *Repository) BlockToken(ctx context.Context, tokenHash string, ttl time.Duration) error {
	if r == nil || r.cache == nil {
		return ErrRepositoryUnavailable
	}
	tokenHash = strings.TrimSpace(tokenHash)
	if tokenHash == "" {
		return errors.New("token hash is required")
	}
	if ttl <= 0 {
		ttl = defaultSessionTTL
	}
	return r.cache.Set(ctx, r.blockKey(tokenHash), "1", ttl).Err()
}

func (r *Repository) IsTokenBlocked(ctx context.Context, tokenHash string) (bool, error) {
	if r == nil || r.cache == nil {
		return false, ErrRepositoryUnavailable
	}
	tokenHash = strings.TrimSpace(tokenHash)
	if tokenHash == "" {
		return false, nil
	}
	exists, err := r.cache.Exists(ctx, r.blockKey(tokenHash)).Result()
	if err != nil {
		return false, err
	}
	return exists > 0, nil
}

func (r *Repository) ListOnlineUsers(ctx context.Context, opts ListOptions) ([]Session, int, error) {
	if r == nil {
		return nil, 0, ErrRepositoryUnavailable
	}

	if r.cache != nil {
		return r.listFromCache(ctx, opts)
	}

	if r.db == nil {
		return nil, 0, ErrRepositoryUnavailable
	}
	return r.listFromDatabase(ctx, opts)
}

func (r *Repository) listFromCache(ctx context.Context, opts ListOptions) ([]Session, int, error) {
	ids, err := r.cache.ZRevRange(ctx, r.indexKey(), 0, -1).Result()
	if err != nil {
		return nil, 0, err
	}
	if len(ids) == 0 {
		return []Session{}, 0, nil
	}

	now := time.Now()
	filtered := make([]Session, 0, len(ids))
	var expired []string

	for _, id := range ids {
		data, err := r.cache.Get(ctx, r.sessionKey(id)).Bytes()
		if errors.Is(err, redis.Nil) {
			expired = append(expired, id)
			continue
		}
		if err != nil {
			return nil, 0, err
		}

		var session Session
		if err := json.Unmarshal(data, &session); err != nil {
			expired = append(expired, id)
			continue
		}

		if !session.ExpiresAt.IsZero() && session.ExpiresAt.Before(now) {
			expired = append(expired, id)
			continue
		}

		if !opts.Since.IsZero() && session.LoginTime.Before(opts.Since) {
			continue
		}

		if user := strings.TrimSpace(opts.UserName); user != "" {
			if !strings.Contains(strings.ToLower(session.UserName), strings.ToLower(user)) {
				continue
			}
		}

		if ip := strings.TrimSpace(opts.IPAddr); ip != "" {
			if !strings.Contains(strings.ToLower(session.IPAddr), strings.ToLower(ip)) {
				continue
			}
		}

		filtered = append(filtered, session)
	}

	if len(expired) > 0 {
		for _, id := range expired {
			session := &Session{SessionID: id}
			r.removeSessionRecords(ctx, session)
		}
	}

	total := len(filtered)
	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize <= 0 {
		pageSize = defaultPageSize
	}

	start := (pageNum - 1) * pageSize
	if start >= total {
		return []Session{}, total, nil
	}
	end := start + pageSize
	if end > total {
		end = total
	}

	return filtered[start:end], total, nil
}

func (r *Repository) listFromDatabase(ctx context.Context, opts ListOptions) ([]Session, int, error) {
	query := r.db.WithContext(ctx).
		Model(&model.SysLogininfor{}).
		Where("status = ?", "0")

	if !opts.Since.IsZero() {
		query = query.Where("login_time >= ?", opts.Since)
	}

	if user := strings.TrimSpace(opts.UserName); user != "" {
		query = query.Where("user_name ILIKE ?", "%"+user+"%")
	}

	if ip := strings.TrimSpace(opts.IPAddr); ip != "" {
		query = query.Where("ipaddr ILIKE ?", "%"+ip+"%")
	}

	var records []model.SysLogininfor
	if err := query.
		Order("login_time DESC").
		Limit(maxFallbackBatchSize).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}

	sessions := make([]Session, 0, len(records))
	for i := range records {
		record := sessionFromModel(&records[i])
		if record != nil {
			sessions = append(sessions, *record)
		}
	}

	total := len(sessions)
	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize <= 0 {
		pageSize = defaultPageSize
	}

	start := (pageNum - 1) * pageSize
	if start >= total {
		return []Session{}, total, nil
	}
	end := start + pageSize
	if end > total {
		end = total
	}

	return sessions[start:end], total, nil
}

func (r *Repository) removeSessionRecords(ctx context.Context, session *Session) {
	if r == nil || r.cache == nil || session == nil {
		return
	}
	pipe := r.cache.TxPipeline()
	if session.SessionID != "" {
		pipe.Del(ctx, r.sessionKey(session.SessionID))
		pipe.ZRem(ctx, r.indexKey(), session.SessionID)
	}
	if session.TokenHash != "" {
		pipe.Del(ctx, r.tokenKey(session.TokenHash))
	}
	_, _ = pipe.Exec(ctx)
}

func (r *Repository) sessionKey(sessionID string) string {
	return strings.TrimSpace(r.keyPrefix) + ":session:" + strings.TrimSpace(sessionID)
}

func (r *Repository) tokenKey(tokenHash string) string {
	return strings.TrimSpace(r.keyPrefix) + ":token:" + strings.TrimSpace(tokenHash)
}

func (r *Repository) blockKey(tokenHash string) string {
	return strings.TrimSpace(r.keyPrefix) + ":block:" + strings.TrimSpace(tokenHash)
}

func (r *Repository) indexKey() string {
	return strings.TrimSpace(r.keyPrefix) + ":index"
}

func sessionFromModel(record *model.SysLogininfor) *Session {
	if record == nil {
		return nil
	}

	loginTime := time.Now()
	if record.LoginTime != nil {
		loginTime = *record.LoginTime
	}

	return &Session{
		SessionID:      strconv.FormatInt(record.InfoID, 10),
		UserID:         record.InfoID,
		UserName:       record.UserName,
		NickName:       record.UserName,
		DeptName:       "",
		IPAddr:         record.IPAddr,
		LoginLocation:  record.LoginLocation,
		Browser:        record.Browser,
		OS:             record.OS,
		Status:         record.Status,
		Msg:            record.Msg,
		LoginTime:      loginTime,
		LastAccessTime: loginTime,
		ExpiresAt:      loginTime.Add(defaultSessionTTL),
	}
}
