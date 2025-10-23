package user

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("user repository is not initialized")
	ErrInvalidUserPayload    = errors.New("user payload is invalid")
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

func (r *Repository) GetUser(ctx context.Context, id int64) (*model.SysUser, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	if id <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var user model.SysUser
	err := r.db.WithContext(ctx).
		Where("user_id = ? AND del_flag <> ?", id, "2").
		First(&user).Error
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) CreateUser(ctx context.Context, user *model.SysUser) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if user == nil {
		return ErrInvalidUserPayload
	}

	return r.db.WithContext(ctx).Create(user).Error
}

func (r *Repository) UpdateUser(ctx context.Context, userID int64, updates map[string]interface{}) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if userID <= 0 {
		return gorm.ErrRecordNotFound
	}
	if len(updates) == 0 {
		return nil
	}

	result := r.db.WithContext(ctx).
		Model(&model.SysUser{}).
		Where("user_id = ? AND del_flag <> ?", userID, "2").
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) SoftDeleteUser(ctx context.Context, userID int64, operator string, at time.Time) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if userID <= 0 {
		return gorm.ErrRecordNotFound
	}

	updates := map[string]interface{}{
		"del_flag":    "2",
		"update_time": at,
	}
	if strings.TrimSpace(operator) != "" {
		updates["update_by"] = strings.TrimSpace(operator)
	}

	result := r.db.WithContext(ctx).
		Model(&model.SysUser{}).
		Where("user_id = ? AND del_flag <> ?", userID, "2").
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) ExistsByUsername(ctx context.Context, username string, excludeID int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	username = strings.TrimSpace(username)
	if username == "" {
		return false, nil
	}

	query := r.db.WithContext(ctx).
		Model(&model.SysUser{}).
		Where("user_name = ?", username).
		Where("del_flag <> ?", "2")

	if excludeID > 0 {
		query = query.Where("user_id <> ?", excludeID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}
