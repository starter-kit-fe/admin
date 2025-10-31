package dict

import (
	"context"
	"errors"
)

var (
	ErrServiceUnavailable = errors.New("dictionary service is not initialized")
)

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

func (s *Service) ListDictTypes(ctx context.Context, opts QueryOptions) ([]DictType, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	records, err := s.repo.ListDictTypes(ctx, ListOptions{
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
