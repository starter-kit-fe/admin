package role

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("role repository is not initialized")
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
	PageNum  int
	PageSize int
	RoleName string
	Status   string
}

func (r *Repository) ListRoles(ctx context.Context, opts ListOptions) ([]model.SysRole, int64, error) {
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

	query := r.db.WithContext(ctx).
		Model(&model.SysRole{}).
		Where("del_flag = ?", "0")

	if name := strings.TrimSpace(opts.RoleName); name != "" {
		query = query.Where("role_name ILIKE ?", "%"+name+"%")
	}

	if status := strings.TrimSpace(opts.Status); status != "" {
		query = query.Where("status = ?", status)
	}

	var total int64
	countQuery := query.Session(&gorm.Session{})
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if total == 0 {
		return []model.SysRole{}, 0, nil
	}

	dataQuery := query.Session(&gorm.Session{})
	if pageSize > 0 {
		offset := (pageNum - 1) * pageSize
		dataQuery = dataQuery.Offset(offset).Limit(pageSize)
	}

	var roles []model.SysRole
	if err := dataQuery.Order("role_sort ASC, role_id ASC").Find(&roles).Error; err != nil {
		return nil, 0, err
	}

	return roles, total, nil
}

func (r *Repository) GetRole(ctx context.Context, id int64) (*model.SysRole, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	if id <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var role model.SysRole
	err := r.db.WithContext(ctx).
		Where("role_id = ? AND del_flag <> ?", id, "2").
		First(&role).Error
	if err != nil {
		return nil, err
	}

	return &role, nil
}

func (r *Repository) CreateRole(ctx context.Context, role *model.SysRole) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if role == nil {
		return errors.New("role payload is invalid")
	}

	return r.db.WithContext(ctx).Create(role).Error
}

func (r *Repository) UpdateRole(ctx context.Context, roleID int64, updates map[string]interface{}) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if roleID <= 0 {
		return gorm.ErrRecordNotFound
	}
	if len(updates) == 0 {
		return nil
	}

	result := r.db.WithContext(ctx).
		Model(&model.SysRole{}).
		Where("role_id = ? AND del_flag <> ?", roleID, "2").
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}

	return nil
}

func (r *Repository) SoftDeleteRole(ctx context.Context, roleID int64, operator string, at time.Time) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if roleID <= 0 {
		return gorm.ErrRecordNotFound
	}

	updates := map[string]interface{}{
		"del_flag":    "2",
		"update_time": at,
	}
	if trimmed := strings.TrimSpace(operator); trimmed != "" {
		updates["update_by"] = trimmed
	}

	result := r.db.WithContext(ctx).
		Model(&model.SysRole{}).
		Where("role_id = ? AND del_flag <> ?", roleID, "2").
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) ExistsByName(ctx context.Context, roleName string, excludeID int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	name := strings.TrimSpace(roleName)
	if name == "" {
		return false, nil
	}

	query := r.db.WithContext(ctx).
		Model(&model.SysRole{}).
		Where("role_name = ?", name).
		Where("del_flag <> ?", "2")
	if excludeID > 0 {
		query = query.Where("role_id <> ?", excludeID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *Repository) ExistsByKey(ctx context.Context, roleKey string, excludeID int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}
	key := strings.TrimSpace(roleKey)
	if key == "" {
		return false, nil
	}

	query := r.db.WithContext(ctx).
		Model(&model.SysRole{}).
		Where("role_key = ?", key).
		Where("del_flag <> ?", "2")
	if excludeID > 0 {
		query = query.Where("role_id <> ?", excludeID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}

	return count > 0, nil
}

func (r *Repository) GetMenuIDsByRole(ctx context.Context, roleID int64) ([]int64, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	if roleID <= 0 {
		return []int64{}, nil
	}

	var entries []model.SysRoleMenu
	if err := r.db.WithContext(ctx).
		Where("role_id = ?", roleID).
		Find(&entries).Error; err != nil {
		return nil, err
	}

	ids := make([]int64, 0, len(entries))
	for _, entry := range entries {
		ids = append(ids, entry.MenuID)
	}
	return ids, nil
}

func (r *Repository) ReplaceRoleMenus(ctx context.Context, roleID int64, menuIDs []int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if roleID <= 0 {
		return gorm.ErrRecordNotFound
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("role_id = ?", roleID).Delete(&model.SysRoleMenu{}).Error; err != nil {
			return err
		}
		if len(menuIDs) == 0 {
			return nil
		}

		entries := make([]model.SysRoleMenu, 0, len(menuIDs))
		for _, id := range menuIDs {
			entries = append(entries, model.SysRoleMenu{RoleID: roleID, MenuID: id})
		}

		if err := tx.Create(&entries).Error; err != nil {
			return err
		}
		return nil
	})
}
