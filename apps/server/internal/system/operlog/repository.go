package operlog

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("oper log repository is not initialized")
)

const defaultOperLogWorkMem = "16MB"

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
	PageNum       int
	PageSize      int
	Title         string
	BusinessType  string
	Status        string
	OperName      string
	RequestMethod string
}

func (r *Repository) ListOperLogs(ctx context.Context, opts ListOptions) ([]model.SysOperLog, int64, error) {
	if r == nil || r.db == nil {
		return nil, 0, ErrRepositoryUnavailable
	}

	var (
		records []model.SysOperLog
		total   int64
	)

	err := r.withLimitedWorkMem(ctx, func(tx *gorm.DB) error {
		query := tx.Model(&model.SysOperLog{})

		if title := strings.TrimSpace(opts.Title); title != "" {
			query = query.Where("title ILIKE ?", "%"+title+"%")
		}

		if businessType := strings.TrimSpace(opts.BusinessType); businessType != "" && businessType != "all" {
			query = query.Where("business_type = ?", businessType)
		}

		if status := strings.TrimSpace(opts.Status); status != "" && status != "all" {
			query = query.Where("status = ?", status)
		}

		if operName := strings.TrimSpace(opts.OperName); operName != "" {
			query = query.Where("oper_name ILIKE ?", "%"+operName+"%")
		}

		if method := strings.TrimSpace(opts.RequestMethod); method != "" && method != "all" {
			query = query.Where("request_method = ?", method)
		}

		if err := query.Count(&total).Error; err != nil {
			return err
		}

		pageNum := opts.PageNum
		if pageNum <= 0 {
			pageNum = 1
		}
		pageSize := opts.PageSize
		if pageSize <= 0 {
			pageSize = 10
		}

		return query.
			Order("oper_time DESC").
			Offset((pageNum - 1) * pageSize).
			Limit(pageSize).
			Find(&records).Error
	})
	if err != nil {
		return nil, 0, err
	}

	return records, total, nil
}

func (r *Repository) GetOperLog(ctx context.Context, id int64) (*model.SysOperLog, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	var record model.SysOperLog
	if err := r.db.WithContext(ctx).First(&record, id).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *Repository) DeleteOperLog(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}

	result := r.db.WithContext(ctx).Delete(&model.SysOperLog{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) CreateOperLog(ctx context.Context, record *model.SysOperLog) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("oper log payload is nil")
	}
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *Repository) withLimitedWorkMem(ctx context.Context, fn func(tx *gorm.DB) error) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Exec(fmt.Sprintf("SET LOCAL work_mem = '%s'", defaultOperLogWorkMem)).Error; err != nil {
			return err
		}
		return fn(tx)
	})
}
