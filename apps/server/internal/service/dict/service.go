package dict

import (
	"context"
	"errors"

	dictrepo "github.com/starter-kit-fe/admin/internal/repo/dict"
)

var (
	ErrServiceUnavailable = errors.New("dictionary service is not initialized")
)

type Service struct {
	repo *dictrepo.Repository
}

func New(repo *dictrepo.Repository) *Service {
	if repo == nil {
		return nil
	}
	return &Service{repo: repo}
}

type ListOptions struct {
	Status   string
	DictName string
	DictType string
}

type DictType struct {
	DictID   int64   `json:"dictId"`
	DictName string  `json:"dictName"`
	DictType string  `json:"dictType"`
	Status   string  `json:"status"`
	Remark   *string `json:"remark,omitempty"`
}

func (s *Service) ListDictTypes(ctx context.Context, opts ListOptions) ([]DictType, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	records, err := s.repo.ListDictTypes(ctx, dictrepo.ListOptions{
		Status:   opts.Status,
		DictName: opts.DictName,
		DictType: opts.DictType,
	})
	if err != nil {
		return nil, err
	}

	result := make([]DictType, 0, len(records))
	for _, record := range records {
		result = append(result, DictType{
			DictID:   record.DictID,
			DictName: record.DictName,
			DictType: record.DictType,
			Status:   record.Status,
			Remark:   record.Remark,
		})
	}
	return result, nil
}
