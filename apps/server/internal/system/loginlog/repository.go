package loginlog

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("login log repository is not initialized")
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
	PageNum  int
	PageSize int
	UserName string
	Status   string
	IPAddr   string
}

func (r *Repository) ListLoginLogs(ctx context.Context, opts ListOptions) ([]model.SysLogininfor, int64, error) {
	if r == nil || r.db == nil {
		return nil, 0, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysLogininfor{})

	if user := strings.TrimSpace(opts.UserName); user != "" {
		query = query.Where("user_name ILIKE ?", "%"+user+"%")
	}
	if status := strings.TrimSpace(opts.Status); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}
	if ip := strings.TrimSpace(opts.IPAddr); ip != "" {
		query = query.Where("ipaddr ILIKE ?", "%"+ip+"%")
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize <= 0 {
		pageSize = 10
	}

	var records []model.SysLogininfor
	if err := query.
		Order("login_time DESC").
		Offset((pageNum - 1) * pageSize).
		Limit(pageSize).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

func (r *Repository) GetLoginLog(ctx context.Context, id int64) (*model.SysLogininfor, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	var record model.SysLogininfor
	if err := r.db.WithContext(ctx).First(&record, id).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *Repository) DeleteLoginLog(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	result := r.db.WithContext(ctx).Delete(&model.SysLogininfor{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
