package post

import (
	"context"
	"errors"

	postrepo "github.com/starter-kit-fe/admin/internal/repo/post"
)

var (
	ErrServiceUnavailable = errors.New("post service is not initialized")
)

type Service struct {
	repo *postrepo.Repository
}

func New(repo *postrepo.Repository) *Service {
	if repo == nil {
		return nil
	}
	return &Service{repo: repo}
}

type ListOptions struct {
	Status   string
	PostName string
	PostCode string
}

type Post struct {
	PostID   int64   `json:"postId"`
	PostCode string  `json:"postCode"`
	PostName string  `json:"postName"`
	PostSort int     `json:"postSort"`
	Status   string  `json:"status"`
	Remark   *string `json:"remark,omitempty"`
}

func (s *Service) ListPosts(ctx context.Context, opts ListOptions) ([]Post, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	records, err := s.repo.ListPosts(ctx, postrepo.ListOptions{
		Status:   opts.Status,
		PostName: opts.PostName,
		PostCode: opts.PostCode,
	})
	if err != nil {
		return nil, err
	}

	result := make([]Post, 0, len(records))
	for _, record := range records {
		result = append(result, Post{
			PostID:   record.PostID,
			PostCode: record.PostCode,
			PostName: record.PostName,
			PostSort: record.PostSort,
			Status:   record.Status,
			Remark:   record.Remark,
		})
	}
	return result, nil
}
