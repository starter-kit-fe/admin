package post

import (
	"context"
	"errors"
	"strings"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrRepositoryUnavailable = errors.New("post repository is not initialized")
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
	PostName string
	PostCode string
}

func (r *Repository) ListPosts(ctx context.Context, opts ListOptions) ([]model.SysPost, error) {
	if r == nil || r.db == nil {
		return nil, ErrRepositoryUnavailable
	}

	query := r.db.WithContext(ctx).Model(&model.SysPost{})

	if status := strings.TrimSpace(opts.Status); status != "" && status != "all" {
		query = query.Where("status = ?", status)
	}

	if name := strings.TrimSpace(opts.PostName); name != "" {
		query = query.Where("post_name ILIKE ?", "%"+name+"%")
	}

	if code := strings.TrimSpace(opts.PostCode); code != "" {
		query = query.Where("post_code ILIKE ?", "%"+code+"%")
	}

	var posts []model.SysPost
	if err := query.Order("post_sort ASC, post_id ASC").Find(&posts).Error; err != nil {
		return nil, err
	}
	return posts, nil
}
