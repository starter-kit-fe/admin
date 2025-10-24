package dept

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("department repository is not initialized")
)

type Repository struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Repository {
	if db == nil {
		return nil
	}
	return &Repository{db: db}
}

type ListOptions struct {
	Status   string
	DeptName string
}

func (r *Repository) ListDepartments(ctx context.Context, opts ListOptions) ([]model.SysDept, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysDept{}).
		Where("del_flag = ?", "0")

	if status := strings.TrimSpace(opts.Status); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if name := strings.TrimSpace(opts.DeptName); name != "" {
		query = query.Where("dept_name ILIKE ?", "%"+name+"%")
	}

	var depts []model.SysDept
	if err := query.Order("parent_id ASC, order_num ASC, dept_id ASC").Find(&depts).Error; err != nil {
		return nil, err
	}
	return depts, nil
}
