package menu

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("menu repository is not initialized")
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
	MenuName string
}

func (r *Repository) ListMenus(ctx context.Context, opts ListOptions) ([]model.SysMenu, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysMenu{})

	if status := strings.TrimSpace(opts.Status); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if name := strings.TrimSpace(opts.MenuName); name != "" {
		query = query.Where("menu_name ILIKE ?", "%"+name+"%")
	}

	var menus []model.SysMenu
	if err := query.Order("parent_id ASC, order_num ASC, menu_id ASC").Find(&menus).Error; err != nil {
		return nil, err
	}

	return menus, nil
}

func (r *Repository) GetMenusByIDs(ctx context.Context, ids []int64) (map[int64]model.SysMenu, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	if len(ids) == 0 {
		return map[int64]model.SysMenu{}, nil
	}

	var menus []model.SysMenu
	if err := r.db.WithContext(ctx).
		Where("menu_id IN ?", ids).
		Find(&menus).Error; err != nil {
		return nil, err
	}

	result := make(map[int64]model.SysMenu, len(menus))
	for _, menu := range menus {
		result[menu.MenuID] = menu
	}
	return result, nil
}
