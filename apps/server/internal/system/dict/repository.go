package dict

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("dictionary repository is not initialized")
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
	DictName string
	DictType string
}

func (r *Repository) ListDictTypes(ctx context.Context, opts ListOptions) ([]model.SysDictType, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysDictType{})

	if status := strings.TrimSpace(opts.Status); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if name := strings.TrimSpace(opts.DictName); name != "" {
		query = query.Where("dict_name ILIKE ?", "%"+name+"%")
	}

	if dictType := strings.TrimSpace(opts.DictType); dictType != "" {
		query = query.Where("dict_type ILIKE ?", "%"+dictType+"%")
	}

	var types []model.SysDictType
	if err := query.Order("dict_id ASC").Find(&types).Error; err != nil {
		return nil, err
	}

	return types, nil
}
