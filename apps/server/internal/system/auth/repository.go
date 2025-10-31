package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("auth repository is not initialized")
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

func (r *Repository) LoadPermissions(ctx context.Context, userID uint) ([]string, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	var permissions []string
	menuTable := model.SysMenu{}.TableName()
	roleMenuTable := model.SysRoleMenu{}.TableName()
	userRoleTable := model.SysUserRole{}.TableName()

	query := r.db.WithContext(ctx).
		Table(menuTable).
		Select(fmt.Sprintf("DISTINCT %s.perms", menuTable)).
		Joins(fmt.Sprintf("JOIN %s ON %s.menu_id = %s.menu_id", roleMenuTable, menuTable, roleMenuTable)).
		Joins(fmt.Sprintf("JOIN %s ON %s.role_id = %s.role_id", userRoleTable, roleMenuTable, userRoleTable)).
		Where(fmt.Sprintf("%s.user_id = ? AND %s.perms IS NOT NULL AND %s.perms <> ''", userRoleTable, menuTable, menuTable), userID)

	if err := query.Pluck(fmt.Sprintf("%s.perms", menuTable), &permissions).Error; err != nil {
		return nil, err
	}

	for i := range permissions {
		permissions[i] = strings.TrimSpace(permissions[i])
	}

	return permissions, nil
}

func (r *Repository) GetUserByUsername(ctx context.Context, username string) (*model.SysUser, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	username = strings.TrimSpace(username)
	if username == "" {
		return nil, gorm.ErrRecordNotFound
	}

	var user model.SysUser
	err := r.db.WithContext(ctx).
		Where("user_name = ?", username).
		First(&user).Error
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) GetUserByID(ctx context.Context, userID uint) (*model.SysUser, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	var user model.SysUser
	err := r.db.WithContext(ctx).
		Where("user_id = ?", userID).
		First(&user).
		Error
	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (r *Repository) GetRoles(ctx context.Context, userID uint) ([]string, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	roleTable := model.SysRole{}.TableName()
	userRoleTable := model.SysUserRole{}.TableName()

	var roles []string
	err := r.db.WithContext(ctx).
		Table(roleTable).
		Select(fmt.Sprintf("%s.role_key", roleTable)).
		Joins(fmt.Sprintf("JOIN %s ON %s.role_id = %s.role_id", userRoleTable, roleTable, userRoleTable)).
		Where(fmt.Sprintf("%s.user_id = ?", userRoleTable), userID).
		Pluck(fmt.Sprintf("%s.role_key", roleTable), &roles).
		Error
	if err != nil {
		return nil, err
	}

	return roles, nil
}

func (r *Repository) GetMenus(ctx context.Context, userID uint) ([]model.SysMenu, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	menuTable := model.SysMenu{}.TableName()
	roleMenuTable := model.SysRoleMenu{}.TableName()
	userRoleTable := model.SysUserRole{}.TableName()

	baseQuery := r.db.WithContext(ctx).
		Table(menuTable).
		Distinct(fmt.Sprintf("%s.*", menuTable)).
		Order(fmt.Sprintf("%s.parent_id ASC, %s.order_num ASC, %s.menu_id ASC", menuTable, menuTable, menuTable))

	if userID != 0 {
		baseQuery = baseQuery.
			Joins(fmt.Sprintf("JOIN %s ON %s.menu_id = %s.menu_id", roleMenuTable, menuTable, roleMenuTable)).
			Joins(fmt.Sprintf("JOIN %s ON %s.role_id = %s.role_id", userRoleTable, roleMenuTable, userRoleTable)).
			Where(fmt.Sprintf("%s.user_id = ?", userRoleTable), userID)
	}

	baseQuery = baseQuery.
		Where(fmt.Sprintf("%s.status = ?", menuTable), "0").
		Where(fmt.Sprintf("%s.menu_type IN ?", menuTable), []string{"M", "C"}).
		Where(fmt.Sprintf("%s.visible = ?", menuTable), "0")

	var menus []model.SysMenu
	if err := baseQuery.Find(&menus).Error; err != nil {
		return nil, err
	}

	return menus, nil
}
