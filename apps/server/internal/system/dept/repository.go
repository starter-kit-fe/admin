package dept

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("department repository is not initialized")
	ErrInvalidDepartmentData = errors.New("department payload is invalid")
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
	Status   string
	DeptName string
}

func (r *Repository) ListDepartments(ctx context.Context, opts ListOptions) ([]model.SysDept, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysDept{})

	if status := strings.TrimSpace(opts.Status); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if name := strings.TrimSpace(opts.DeptName); name != "" {
		query = query.Where("dept_name ILIKE ?", "%"+name+"%")
	}

	var depts []model.SysDept
	if err := query.Order("parent_id ASC, order_num ASC, id ASC").Find(&depts).Error; err != nil {
		return nil, err
	}
	return depts, nil
}

func (r *Repository) GetDepartment(ctx context.Context, id int64) (*model.SysDept, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	if id <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var dept model.SysDept
	if err := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&dept).Error; err != nil {
		return nil, err
	}
	return &dept, nil
}

func (r *Repository) CreateDepartment(ctx context.Context, dept *model.SysDept) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if dept == nil {
		return ErrInvalidDepartmentData
	}

	return r.db.WithContext(ctx).Create(dept).Error
}

func (r *Repository) UpdateDepartment(ctx context.Context, id int64, updates map[string]interface{}) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if id <= 0 {
		return gorm.ErrRecordNotFound
	}
	if len(updates) == 0 {
		return nil
	}

	result := r.db.WithContext(ctx).
		Model(&model.SysDept{}).
		Where("id = ?", id).
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) UpdateDescendantAncestors(
	ctx context.Context,
	oldPrefix string,
	newPrefix string,
	deptID int64,
	operator string,
	ts time.Time,
) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if deptID <= 0 {
		return gorm.ErrRecordNotFound
	}
	if strings.TrimSpace(oldPrefix) == "" || strings.TrimSpace(newPrefix) == "" || oldPrefix == newPrefix {
		return nil
	}

	oldPath := fmt.Sprintf("%s,%d", oldPrefix, deptID)
	newPath := fmt.Sprintf("%s,%d", newPrefix, deptID)

	result := r.db.WithContext(ctx).
		Model(&model.SysDept{}).
		Where("ancestors LIKE ?", oldPath+"%").
		Updates(map[string]interface{}{
			"ancestors":   gorm.Expr("REPLACE(ancestors, ?, ?)", oldPath, newPath),
			"update_by":   operator,
			"update_time": ts,
		})
	return result.Error
}

func (r *Repository) SoftDeleteDepartment(ctx context.Context, id int64, operator string, ts time.Time) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if id <= 0 {
		return gorm.ErrRecordNotFound
	}

	result := r.db.WithContext(ctx).
		Model(&model.SysDept{}).
		Where("id = ?", id).
		Updates(map[string]interface{}{
			"update_by":   operator,
			"update_time": ts,
		})
	if result.Error != nil {
		return result.Error
	}

	result = r.db.WithContext(ctx).Delete(&model.SysDept{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) CountChildren(ctx context.Context, parentID int64) (int64, error) {
	if r == nil || r.db == nil {
		return 0, ErrRepositoryUnavailable
	}
	if parentID <= 0 {
		return 0, nil
	}

	var total int64
	err := r.db.WithContext(ctx).
		Model(&model.SysDept{}).
		Where("parent_id = ?", parentID).
		Count(&total).Error
	return total, err
}

func (r *Repository) CountUsersByDept(ctx context.Context, deptID int64) (int64, error) {
	if r == nil || r.db == nil {
		return 0, ErrRepositoryUnavailable
	}
	if deptID <= 0 {
		return 0, nil
	}

	var total int64
	err := r.db.WithContext(ctx).
		Model(&model.SysUser{}).
		Where("dept_id = ?", deptID).
		Count(&total).Error
	return total, err
}

func (r *Repository) ExistsByName(ctx context.Context, parentID int64, name string, excludeID int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return false, nil
	}

	query := r.db.WithContext(ctx).
		Model(&model.SysDept{}).
		Where("dept_name = ? AND parent_id = ?", trimmed, parentID)

	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}
