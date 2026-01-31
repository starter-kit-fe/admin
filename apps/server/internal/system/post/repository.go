package post

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("post repository is not initialized")
	ErrInvalidPostPayload    = errors.New("post payload is invalid")
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
	PageNum  int
	PageSize int
	Status   string
	PostName string
	PostCode string
}

func (r *Repository) ListPosts(ctx context.Context, opts ListOptions) ([]model.SysPost, int64, error) {
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

	base := r.db.WithContext(ctx).Model(&model.SysPost{})

	if status := strings.TrimSpace(opts.Status); status != "" && status != "all" {
		base = base.Where("status = ?", status)
	}

	if name := strings.TrimSpace(opts.PostName); name != "" {
		base = base.Where("post_name ILIKE ?", "%"+name+"%")
	}

	if code := strings.TrimSpace(opts.PostCode); code != "" {
		base = base.Where("post_code ILIKE ?", "%"+code+"%")
	}

	var total int64
	countQuery := base.Session(&gorm.Session{})
	if err := countQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if total == 0 {
		return []model.SysPost{}, 0, nil
	}

	dataQuery := base.Session(&gorm.Session{})
	if pageSize > 0 {
		offset := (pageNum - 1) * pageSize
		dataQuery = dataQuery.Offset(offset).Limit(pageSize)
	}

	var posts []model.SysPost
	if err := dataQuery.Order("post_sort ASC, id ASC").Find(&posts).Error; err != nil {
		return nil, 0, err
	}
	return posts, total, nil
}

func (r *Repository) GetPost(ctx context.Context, id int64) (*model.SysPost, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}
	if id <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var post model.SysPost
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(&post).Error; err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *Repository) CreatePost(ctx context.Context, post *model.SysPost) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if post == nil {
		return ErrInvalidPostPayload
	}
	return r.db.WithContext(ctx).Create(post).Error
}

func (r *Repository) UpdatePost(ctx context.Context, id int64, updates map[string]interface{}) error {
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
		Model(&model.SysPost{}).
		Where("id = ?", id).
		Updates(updates)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) DeletePost(ctx context.Context, id int64) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if id <= 0 {
		return gorm.ErrRecordNotFound
	}

	result := r.db.WithContext(ctx).Where("id = ?", id).Delete(&model.SysPost{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return gorm.ErrRecordNotFound
	}
	return nil
}

func (r *Repository) ExistsByCode(ctx context.Context, code string, excludeID int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	trimmed := strings.TrimSpace(code)
	if trimmed == "" {
		return false, nil
	}

	query := r.db.WithContext(ctx).
		Model(&model.SysPost{}).
		Where("post_code = ?", trimmed)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repository) ExistsByName(ctx context.Context, name string, excludeID int64) (bool, error) {
	if r == nil || r.db == nil {
		return false, ErrRepositoryUnavailable
	}

	trimmed := strings.TrimSpace(name)
	if trimmed == "" {
		return false, nil
	}

	query := r.db.WithContext(ctx).
		Model(&model.SysPost{}).
		Where("post_name = ?", trimmed)
	if excludeID > 0 {
		query = query.Where("id <> ?", excludeID)
	}

	var count int64
	if err := query.Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repository) TouchPost(ctx context.Context, id int64, operator string, at time.Time) error {
	if r == nil || r.db == nil {
		return ErrRepositoryUnavailable
	}
	if id <= 0 {
		return gorm.ErrRecordNotFound
	}

	updates := map[string]interface{}{
		"update_time": at,
	}
	if trimmed := strings.TrimSpace(operator); trimmed != "" {
		updates["update_by"] = trimmed
	}

	return r.UpdatePost(ctx, id, updates)
}
