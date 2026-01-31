package config

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("config repository is not initialized")
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
	ConfigName string
	ConfigKey  string
	ConfigType string
}

func (r *Repository) ListConfigs(ctx context.Context, opts ListOptions) ([]model.SysConfig, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysConfig{})

	if name := strings.TrimSpace(opts.ConfigName); name != "" {
		query = query.Where("config_name ILIKE ?", "%"+name+"%")
	}
	if key := strings.TrimSpace(opts.ConfigKey); key != "" {
		query = query.Where("config_key ILIKE ?", "%"+key+"%")
	}
	if cfgType := strings.TrimSpace(opts.ConfigType); cfgType != "" && !strings.EqualFold(cfgType, "all") {
		query = query.Where("config_type = ?", strings.ToUpper(cfgType))
	}

	var records []model.SysConfig
	if err := query.Order("id ASC").Find(&records).Error; err != nil {
		return nil, err
	}
	return records, nil
}

func (r *Repository) GetConfig(ctx context.Context, id int64) (*model.SysConfig, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	var record model.SysConfig
	if err := r.db.WithContext(ctx).First(&record, id).Error; err != nil {
		return nil, err
	}
	return &record, nil
}

func (r *Repository) ExistsByKey(ctx context.Context, key string, excludeID int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	var count int64
	query := r.db.WithContext(ctx).Model(&model.SysConfig{}).Where("config_key = ?", key)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repository) CreateConfig(ctx context.Context, record *model.SysConfig) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("config record is required")
	}
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *Repository) SaveConfig(ctx context.Context, record *model.SysConfig) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("config record is required")
	}
	return r.db.WithContext(ctx).Save(record).Error
}

func (r *Repository) DeleteConfig(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}

	result := r.db.WithContext(ctx).Delete(&model.SysConfig{}, id)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
