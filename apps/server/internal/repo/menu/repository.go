package menu

import (
	"context"
	"errors"
	"strings"
	"time"

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

func (r *Repository) GetMenu(ctx context.Context, id int64) (*model.SysMenu, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	if id <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var menu model.SysMenu
	if err := r.db.WithContext(ctx).
		Where("menu_id = ?", id).
		First(&menu).Error; err != nil {
		return nil, err
	}
	return &menu, nil
}

func (r *Repository) CreateMenu(ctx context.Context, menu *model.SysMenu) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if menu == nil {
		return errors.New("menu payload is invalid")
	}

	return r.db.WithContext(ctx).Create(menu).Error
}

func (r *Repository) UpdateMenu(ctx context.Context, id int64, updates map[string]interface{}) error {
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
		Model(&model.SysMenu{}).
		Where("menu_id = ?", id).
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) DeleteMenu(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if id <= 0 {
		return gorm.ErrRecordNotFound
	}

	result := r.db.WithContext(ctx).
		Where("menu_id = ?", id).
		Delete(&model.SysMenu{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

type OrderUpdate struct {
	MenuID   int64
	ParentID int64
	OrderNum int
	Operator string
	At       time.Time
}

func (r *Repository) UpdateMenuOrders(ctx context.Context, updates []OrderUpdate) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if len(updates) == 0 {
		return nil
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, update := range updates {
			data := map[string]interface{}{
				"order_num":   update.OrderNum,
				"parent_id":   update.ParentID,
				"update_time": update.At,
			}
			if trimmed := strings.TrimSpace(update.Operator); trimmed != "" {
				data["update_by"] = trimmed
			}

			result := tx.Model(&model.SysMenu{}).
				Where("menu_id = ?", update.MenuID).
				Updates(data)
			if result.Error != nil {
				return result.Error
			}
			if result.RowsAffected == 0 {
				return gorm.ErrRecordNotFound
			}
		}
		return nil
	})
}
