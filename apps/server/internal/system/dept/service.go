package dept

import (
	"context"
	"errors"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable = errors.New("department service is not initialized")
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
	DeptName string
}

type Department struct {
	DeptID   int64         `json:"deptId"`
	ParentID int64         `json:"parentId"`
	DeptName string        `json:"deptName"`
	Leader   *string       `json:"leader,omitempty"`
	Phone    *string       `json:"phone,omitempty"`
	Email    *string       `json:"email,omitempty"`
	OrderNum int           `json:"orderNum"`
	Status   string        `json:"status"`
	Remark   *string       `json:"remark,omitempty"`
	Children []*Department `json:"children,omitempty"`
}

func (s *Service) ListDepartmentTree(ctx context.Context, opts QueryOptions) ([]*Department, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	records, err := s.repo.ListDepartments(ctx, ListOptions{
		Status:   opts.Status,
		DeptName: opts.DeptName,
	})
	if err != nil {
		return nil, err
	}

	return buildTree(records), nil
}

func buildTree(records []model.SysDept) []*Department {
	if len(records) == 0 {
		return []*Department{}
	}

	type wrapper struct {
		dept model.SysDept
		node *Department
	}

	cache := make(map[int64]*wrapper, len(records))
	ordered := make([]*wrapper, 0, len(records))

	for _, record := range records {
		node := &Department{
			DeptID:   record.DeptID,
			ParentID: record.ParentID,
			DeptName: record.DeptName,
			Leader:   record.Leader,
			Phone:    record.Phone,
			Email:    record.Email,
			OrderNum: record.OrderNum,
			Status:   record.Status,
		}
		w := &wrapper{dept: record, node: node}
		cache[record.DeptID] = w
		ordered = append(ordered, w)
	}

	roots := make([]*Department, 0)
	for _, w := range ordered {
		if w == nil {
			continue
		}
		if w.dept.ParentID == 0 {
			roots = append(roots, w.node)
			continue
		}
		parent := cache[w.dept.ParentID]
		if parent == nil {
			roots = append(roots, w.node)
			continue
		}
		parent.node.Children = append(parent.node.Children, w.node)
	}

	return roots
}
