package online

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("online user repository is not initialized")
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) *Repository {
	if db == nil {
		return nil
	}
	return &Repository{db: db}
}

type ListOptions struct {
	UserName string
	IPAddr   string
	Since    time.Time
}

func (r *Repository) ListOnlineUsers(ctx context.Context, opts ListOptions) ([]model.SysLogininfor, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

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
	if err := query.Order("login_time DESC").Limit(500).Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}
