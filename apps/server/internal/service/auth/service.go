package auth

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable = errors.New("auth service is not initialized")
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrAccountDisabled    = errors.New("account disabled")
)

type Service struct {
	db *gorm.DB
}

func New(db *gorm.DB) *Service {
	if db == nil {
		return nil
	}
	return &Service{db: db}
}

func (s *Service) LoadPermissions(ctx context.Context, userID uint) ([]string, error) {
	if s == nil || s.db == nil {
		return nil, ErrServiceUnavailable
	}

	var permissions []string
	menuTable := model.SysMenu{}.TableName()
	roleMenuTable := model.SysRoleMenu{}.TableName()
	userRoleTable := model.SysUserRole{}.TableName()

	query := s.db.WithContext(ctx).
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

func (s *Service) Authenticate(ctx context.Context, username, password string) (*model.SysUser, error) {
	if s == nil || s.db == nil {
		return nil, ErrServiceUnavailable
	}

	username = strings.TrimSpace(username)
	if username == "" || password == "" {
		return nil, ErrInvalidCredentials
	}

	var user model.SysUser
	err := s.db.WithContext(ctx).
		Where("user_name = ?", username).
		First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, err
	}

	if user.Status != "0" {
		return nil, ErrAccountDisabled
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		return nil, ErrInvalidCredentials
	}

	return &user, nil
}

func (s *Service) Profile(ctx context.Context, userID uint) (*model.SysUser, []string, []string, error) {
	if s == nil || s.db == nil {
		return nil, nil, nil, ErrServiceUnavailable
	}

	var user model.SysUser
	err := s.db.WithContext(ctx).
		Where("user_id = ?", userID).
		First(&user).
		Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil, nil, ErrInvalidCredentials
	}
	if err != nil {
		return nil, nil, nil, err
	}

	roles, err := s.loadRoles(ctx, userID)
	if err != nil {
		return nil, nil, nil, err
	}

	perms, err := s.LoadPermissions(ctx, userID)
	if err != nil {
		return nil, nil, nil, err
	}

	return &user, roles, perms, nil
}

func (s *Service) loadRoles(ctx context.Context, userID uint) ([]string, error) {
	if s == nil || s.db == nil {
		return nil, ErrServiceUnavailable
	}

	roleTable := model.SysRole{}.TableName()
	userRoleTable := model.SysUserRole{}.TableName()

	var roles []string
	err := s.db.WithContext(ctx).
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
