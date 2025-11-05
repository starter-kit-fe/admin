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
	ErrServiceUnavailable = errors.New("post service is not initialized")
	ErrPostCodeRequired   = errors.New("post code is required")
	ErrPostNameRequired   = errors.New("post name is required")
	ErrInvalidPostStatus  = errors.New("invalid post status")
	ErrInvalidPostSort    = errors.New("invalid post sort")
	ErrDuplicatePostCode  = errors.New("duplicate post code")
	ErrDuplicatePostName  = errors.New("duplicate post name")
)

var validStatuses = map[string]struct{}{
	"0": {},
	"1": {},
}

type Service struct {
	repo *Repository
}

func NewService(repo *Repository) *Service {
	if repo == nil {
		return nil
	}
	return &Service{repo: repo}
}

type QueryOptions struct {
	PageNum  int
	PageSize int
	Status   string
	PostName string
	PostCode string
}

type ListResult struct {
	Items    []Post `json:"items"`
	Total    int64  `json:"total"`
	PageNum  int    `json:"pageNum"`
	PageSize int    `json:"pageSize"`
}

type Post struct {
	PostID   int64   `json:"postId"`
	PostCode string  `json:"postCode"`
	PostName string  `json:"postName"`
	PostSort int     `json:"postSort"`
	Status   string  `json:"status"`
	Remark   *string `json:"remark,omitempty"`
}

type CreatePostInput struct {
	PostCode string
	PostName string
	PostSort int
	Status   string
	Remark   *string
	Operator string
}

type UpdatePostInput struct {
	ID       int64
	PostCode *string
	PostName *string
	PostSort *int
	Status   *string
	Remark   *string
	Operator string
}

func (s *Service) ListPosts(ctx context.Context, opts QueryOptions) (*ListResult, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	pageNum := opts.PageNum
	if pageNum <= 0 {
		pageNum = 1
	}
	pageSize := opts.PageSize
	if pageSize < 0 {
		pageSize = 0
	}

	status := strings.TrimSpace(opts.Status)
	if status == "all" {
		status = ""
	}

	records, total, err := s.repo.ListPosts(ctx, ListOptions{
		PageNum:  pageNum,
		PageSize: pageSize,
		Status:   status,
		PostName: opts.PostName,
		PostCode: opts.PostCode,
	})
	if err != nil {
		return nil, err
	}

	items := make([]Post, 0, len(records))
	for _, record := range records {
		items = append(items, Post{
			PostID:   record.PostID,
			PostCode: record.PostCode,
			PostName: record.PostName,
			PostSort: record.PostSort,
			Status:   record.Status,
			Remark:   record.Remark,
		})
	}

	return &ListResult{
		Items:    items,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
	}, nil
}

func (s *Service) GetPost(ctx context.Context, id int64) (*Post, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	record, err := s.repo.GetPost(ctx, id)
	if err != nil {
		return nil, err
	}
	return postFromModel(record), nil
}

func (s *Service) CreatePost(ctx context.Context, input CreatePostInput) (*Post, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	code := strings.TrimSpace(input.PostCode)
	if code == "" {
		return nil, ErrPostCodeRequired
	}

	name := strings.TrimSpace(input.PostName)
	if name == "" {
		return nil, ErrPostNameRequired
	}

	if input.PostSort < 0 {
		return nil, ErrInvalidPostSort
	}

	status := normalizeStatus(input.Status)
	if _, ok := validStatuses[status]; !ok {
		return nil, ErrInvalidPostStatus
	}

	if exists, err := s.repo.ExistsByCode(ctx, code, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrDuplicatePostCode
	}

	if exists, err := s.repo.ExistsByName(ctx, name, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrDuplicatePostName
	}

	remark := normalizeRemark(input.Remark)
	operator := sanitizeOperator(input.Operator)
	now := time.Now()

	record := &model.SysPost{
		PostCode:   code,
		PostName:   name,
		PostSort:   input.PostSort,
		Status:     status,
		Remark:     remark,
		CreateBy:   operator,
		UpdateBy:   operator,
		CreateTime: &now,
		UpdateTime: &now,
	}

	if err := s.repo.CreatePost(ctx, record); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, ErrDuplicatePostCode
		}
		return nil, err
	}

	return postFromModel(record), nil
}

func (s *Service) UpdatePost(ctx context.Context, input UpdatePostInput) (*Post, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	if input.ID <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	updates := make(map[string]interface{})

	if input.PostCode != nil {
		code := strings.TrimSpace(*input.PostCode)
		if code == "" {
			return nil, ErrPostCodeRequired
		}
		if exists, err := s.repo.ExistsByCode(ctx, code, input.ID); err != nil {
			return nil, err
		} else if exists {
			return nil, ErrDuplicatePostCode
		}
		updates["post_code"] = code
	}

	if input.PostName != nil {
		name := strings.TrimSpace(*input.PostName)
		if name == "" {
			return nil, ErrPostNameRequired
		}
		if exists, err := s.repo.ExistsByName(ctx, name, input.ID); err != nil {
			return nil, err
		} else if exists {
			return nil, ErrDuplicatePostName
		}
		updates["post_name"] = name
	}

	if input.PostSort != nil {
		if *input.PostSort < 0 {
			return nil, ErrInvalidPostSort
		}
		updates["post_sort"] = *input.PostSort
	}

	if input.Status != nil {
		status := normalizeStatus(*input.Status)
		if _, ok := validStatuses[status]; !ok {
			return nil, ErrInvalidPostStatus
		}
		updates["status"] = status
	}

	if input.Remark != nil {
		remark := normalizeRemark(input.Remark)
		if remark == nil {
			updates["remark"] = nil
		} else {
			updates["remark"] = *remark
		}
	}

	now := time.Now()
	updates["update_time"] = now
	if operator := sanitizeOperator(input.Operator); operator != "" {
		updates["update_by"] = operator
	}

	if err := s.repo.UpdatePost(ctx, input.ID, updates); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, ErrDuplicatePostCode
		}
		return nil, err
	}

	return s.GetPost(ctx, input.ID)
}

func (s *Service) DeletePost(ctx context.Context, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	if id <= 0 {
		return gorm.ErrRecordNotFound
	}
	return s.repo.DeletePost(ctx, id)
}

func normalizeStatus(status string) string {
	trimmed := strings.TrimSpace(status)
	if trimmed == "" {
		return "0"
	}
	return trimmed
}

func normalizeRemark(remark *string) *string {
	if remark == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*remark)
	if trimmed == "" {
		return nil
	}
	return &trimmed
}

func sanitizeOperator(operator string) string {
	return strings.TrimSpace(operator)
}

func postFromModel(record *model.SysPost) *Post {
	if record == nil {
		return nil
	}
	return &Post{
		PostID:   record.PostID,
		PostCode: record.PostCode,
		PostName: record.PostName,
		PostSort: record.PostSort,
		Status:   record.Status,
		Remark:   record.Remark,
	}
}
