package job

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("job repository is not initialized")
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
	PageNum   int
	PageSize  int
	JobName   string
	JobGroup  string
	Status    string
	StartTime time.Time
	EndTime   time.Time
}

func (r *Repository) ListJobs(ctx context.Context, opts ListOptions) ([]model.SysJob, int64, error) {
	if r == nil || r.db == nil {
		return nil, 0, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysJob{})

	if name := strings.TrimSpace(opts.JobName); name != "" {
		query = query.Where("job_name ILIKE ?", "%"+name+"%")
	}

	if group := strings.TrimSpace(opts.JobGroup); group != "" {
		query = query.Where("job_group = ?", group)
	}

	if status := strings.TrimSpace(opts.Status); status != "" {
		query = query.Where("status = ?", status)
	}

	if !opts.StartTime.IsZero() {
		query = query.Where("create_time >= ?", opts.StartTime)
	}

	if !opts.EndTime.IsZero() {
		query = query.Where("create_time <= ?", opts.EndTime)
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

	var records []model.SysJob
	if err := query.
		Order("create_time DESC, job_id DESC").
		Offset((pageNum - 1) * pageSize).
		Limit(pageSize).
		Find(&records).Error; err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

func (r *Repository) GetJob(ctx context.Context, id int64) (*model.SysJob, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	var record model.SysJob
	if err := r.db.WithContext(ctx).First(&record, id).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *Repository) CreateJob(ctx context.Context, record *model.SysJob) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("job record is required")
	}
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *Repository) UpdateJob(ctx context.Context, id int64, values map[string]interface{}) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if len(values) == 0 {
		return nil
	}
	return r.db.WithContext(ctx).
		Model(&model.SysJob{}).
		Where("job_id = ?", id).
		Updates(values).Error
}

func (r *Repository) DeleteJob(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	result := r.db.WithContext(ctx).Delete(&model.SysJob{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) UpdateJobStatus(ctx context.Context, id int64, status string) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	return r.db.WithContext(ctx).
		Model(&model.SysJob{}).
		Where("job_id = ?", id).
		Update("status", status).Error
}
