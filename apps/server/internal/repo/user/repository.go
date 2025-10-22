package user

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("user repository is not initialized")
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

type ListUsersOptions struct {
	PageNum  int
	PageSize int
	UserName string
	Status   string
}

func (r *Repository) ListUsers(ctx context.Context, opts ListUsersOptions) ([]model.SysUser, int64, error) {
	if r == nil || r.db == nil {
		return nil, 0, ErrRepositoryUnavailable
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize < 0 {
		pageSize = 0
	}

	base := r.db.WithContext(ctx).Model(&model.SysUser{}).
		Where("del_flag = ?", "0")

	if userName := strings.TrimSpace(opts.UserName); userName != "" {
		base = base.Where("user_name ILIKE ?", "%"+userName+"%")
	}

	if status := strings.TrimSpace(opts.Status); status != "" {
		base = base.Where("status = ?", status)
	}

	var total int64
	countQuery := base.Session(&gorm.Session{})
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if total == 0 {
		return []model.SysUser{}, 0, nil
	}

	dataQuery := base.Session(&gorm.Session{})
	if pageSize > 0 {
		offset := (pageNum - 1) * pageSize
		dataQuery = dataQuery.Offset(offset).Limit(pageSize)
	}

	var users []model.SysUser
	if err := dataQuery.Order("create_time DESC, user_id DESC").Find(&users).Error; err != nil {
		return nil, 0, err
	}

	return users, total, nil
}

func (r *Repository) GetDepartments(ctx context.Context, ids []int64) (map[int64]model.SysDept, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	if len(ids) == 0 {
		return map[int64]model.SysDept{}, nil
	}

	unique := make(map[int64]struct{}, len(ids))
	finalIDs := make([]int64, 0, len(ids))
	for _, id := range ids {
		if id == 0 {
			continue
		}
		if _, exists := unique[id]; exists {
			continue
		}
		unique[id] = struct{}{}
		finalIDs = append(finalIDs, id)
	}

	if len(finalIDs) == 0 {
		return map[int64]model.SysDept{}, nil
	}

	var depts []model.SysDept
	if err := r.db.WithContext(ctx).
		Where("dept_id IN ?", finalIDs).
		Find(&depts).Error; err != nil {
		return nil, err
	}

	result := make(map[int64]model.SysDept, len(depts))
	for _, dept := range depts {
		result[dept.DeptID] = dept
	}
	return result, nil
}
