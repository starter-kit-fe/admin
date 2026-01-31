package notice

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("notice repository is not initialized")
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
	NoticeTitle string
	NoticeType  string
	Status      string
}

func (r *Repository) ListNotices(ctx context.Context, opts ListOptions) ([]model.SysNotice, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysNotice{})

	if title := strings.TrimSpace(opts.NoticeTitle); title != "" {
		query = query.Where("notice_title ILIKE ?", "%"+title+"%")
	}

	if noticeType := strings.TrimSpace(opts.NoticeType); noticeType != "" && !strings.EqualFold(noticeType, "all") {
		query = query.Where("notice_type = ?", noticeType)
	}

	if status := strings.TrimSpace(opts.Status); status != "" && !strings.EqualFold(status, "all") {
		query = query.Where("status = ?", status)
	}

	var records []model.SysNotice
	if err := query.Order("id DESC").Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}

func (r *Repository) GetNotice(ctx context.Context, id int64) (*model.SysNotice, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	var record model.SysNotice
	if err := r.db.WithContext(ctx).First(&record, id).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *Repository) CreateNotice(ctx context.Context, record *model.SysNotice) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("notice record is required")
	}
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *Repository) SaveNotice(ctx context.Context, record *model.SysNotice) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("notice record is required")
	}
	return r.db.WithContext(ctx).Save(record).Error
}

func (r *Repository) DeleteNotice(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	result := r.db.WithContext(ctx).Delete(&model.SysNotice{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
