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
	if err := query.Order("id ASC").Find(&types).Error; err != nil {
		return nil, err
	}

	return types, nil
}

type ListDataOptions struct {
	DictType  string
	Status    string
	DictLabel string
	DictValue string
}

func (r *Repository) ListDictData(ctx context.Context, opts ListDataOptions) ([]model.SysDictData, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysDictData{}).Where("dict_type = ?", opts.DictType)

	if status := strings.TrimSpace(opts.Status); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if label := strings.TrimSpace(opts.DictLabel); label != "" {
		query = query.Where("dict_label ILIKE ?", "%"+label+"%")
	}

	if value := strings.TrimSpace(opts.DictValue); value != "" {
		query = query.Where("dict_value ILIKE ?", "%"+value+"%")
	}

	var items []model.SysDictData
	if err := query.Order("dict_sort ASC, id ASC").Find(&items).Error; err != nil {
		return nil, err
	}

	return items, nil
}

func (r *Repository) GetDictType(ctx context.Context, id int64) (*model.SysDictType, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	var dictType model.SysDictType
	if err := r.db.WithContext(ctx).First(&dictType, id).Error; err != nil {
		return nil, err
	}

	return &dictType, nil
}

func (r *Repository) ExistsDictType(ctx context.Context, dictType string, excludeID int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	var count int64
	query := r.db.WithContext(ctx).Model(&model.SysDictType{}).Where("dict_type = ?", dictType)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repository) CreateDictType(ctx context.Context, dictType *model.SysDictType) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if dictType == nil {
		return errors.New("dict type record is required")
	}
	return r.db.WithContext(ctx).Create(dictType).Error
}

func (r *Repository) SaveDictType(ctx context.Context, dictType *model.SysDictType) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if dictType == nil {
		return errors.New("dict type record is required")
	}
	return r.db.WithContext(ctx).Save(dictType).Error
}

func (r *Repository) DeleteDictType(ctx context.Context, id int64, dictType string) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("dict_type = ?", dictType).Delete(&model.SysDictData{}).Error; err != nil {
			return err
		}

		result := tx.Delete(&model.SysDictType{}, id)
		if result.Error != nil {
			return result.Error
		}
		if result.RowsAffected == 0 {
			return gorm.ErrRecordNotFound
		}
		return nil
	})
}

func (r *Repository) GetDictData(ctx context.Context, code int64) (*model.SysDictData, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	var record model.SysDictData
	if err := r.db.WithContext(ctx).First(&record, code).Error; err != nil {
		return nil, err
	}

	return &record, nil
}

func (r *Repository) ExistsDictDataByLabel(ctx context.Context, dictType, label string, excludeCode int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	var count int64
	query := r.db.WithContext(ctx).
		Model(&model.SysDictData{}).
		Where("dict_type = ? AND dict_label = ?", dictType, label)
	if excludeCode > 0 {
		query = query.Where("id <> ?", excludeCode)
	}
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repository) ExistsDictDataByValue(ctx context.Context, dictType, value string, excludeCode int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	var count int64
	query := r.db.WithContext(ctx).
		Model(&model.SysDictData{}).
		Where("dict_type = ? AND dict_value = ?", dictType, value)
	if excludeCode > 0 {
		query = query.Where("id <> ?", excludeCode)
	}
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repository) CreateDictData(ctx context.Context, record *model.SysDictData) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("dict data record is required")
	}
	return r.db.WithContext(ctx).Create(record).Error
}

func (r *Repository) SaveDictData(ctx context.Context, record *model.SysDictData) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if record == nil {
		return errors.New("dict data record is required")
	}
	return r.db.WithContext(ctx).Save(record).Error
}

func (r *Repository) DeleteDictData(ctx context.Context, code int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}

	result := r.db.WithContext(ctx).Delete(&model.SysDictData{}, code)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}
