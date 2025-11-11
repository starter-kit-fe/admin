package dept

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable        = errors.New("department service is not initialized")
	ErrDeptNameRequired          = errors.New("department name is required")
	ErrInvalidDepartmentStatus   = errors.New("invalid department status")
	ErrInvalidDepartmentOrder    = errors.New("invalid department order")
	ErrInvalidParentDepartment   = errors.New("invalid parent department")
	ErrDuplicateDepartmentName   = errors.New("duplicate department name")
	ErrDepartmentHasChildren     = errors.New("department has child departments")
	ErrDepartmentHasUsers        = errors.New("department has linked users")
	defaultAncestor              = "0"
	validDepartmentStatusOptions = map[string]struct{}{
		"0": {},
		"1": {},
	}
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

type CreateDepartmentInput struct {
	DeptName string
	ParentID int64
	OrderNum int
	Leader   *string
	Phone    *string
	Email    *string
	Status   string
	Remark   *string
	Operator string
}

type UpdateDepartmentInput struct {
	ID       int64
	DeptName *string
	ParentID *int64
	OrderNum *int
	Leader   *string
	Phone    *string
	Email    *string
	Status   *string
	Remark   *string
	Operator string
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

func (s *Service) ListDepartments(ctx context.Context, opts QueryOptions) ([]*Department, error) {
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

	items := make([]*Department, 0, len(records))
	for i := range records {
		items = append(items, departmentFromModel(&records[i]))
	}
	return items, nil
}

func (s *Service) GetDepartment(ctx context.Context, id int64) (*Department, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	record, err := s.repo.GetDepartment(ctx, id)
	if err != nil {
		return nil, err
	}
	return departmentFromModel(record), nil
}

func (s *Service) CreateDepartment(ctx context.Context, input CreateDepartmentInput) (*Department, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	name := strings.TrimSpace(input.DeptName)
	if name == "" {
		return nil, ErrDeptNameRequired
	}

	if input.OrderNum < 0 {
		return nil, ErrInvalidDepartmentOrder
	}

	status := normalizeStatus(input.Status)
	if _, ok := validDepartmentStatusOptions[status]; !ok {
		return nil, ErrInvalidDepartmentStatus
	}

	if input.ParentID < 0 {
		return nil, ErrInvalidParentDepartment
	}

	var ancestors string
	if input.ParentID == 0 {
		ancestors = defaultAncestor
	} else {
		parent, err := s.repo.GetDepartment(ctx, input.ParentID)
		if err != nil {
			return nil, err
		}
		ancestors = composeAncestors(parent.Ancestors, parent.DeptID)
	}

	if exists, err := s.repo.ExistsByName(ctx, input.ParentID, name, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrDuplicateDepartmentName
	}

	leader := normalizeOptionalStringPtr(input.Leader)
	phone := normalizeOptionalStringPtr(input.Phone)
	email := normalizeOptionalStringPtr(input.Email)
	remark := normalizeOptionalStringPtr(input.Remark)
	operator := sanitizeOperator(input.Operator)
	now := time.Now()

	record := &model.SysDept{
		ParentID:   input.ParentID,
		Ancestors:  ancestors,
		DeptName:   name,
		OrderNum:   input.OrderNum,
		Leader:     leader,
		Phone:      phone,
		Email:      email,
		Status:     status,
		Remark:     remark,
		DelFlag:    "0",
		CreateBy:   operator,
		UpdateBy:   operator,
		CreateTime: &now,
		UpdateTime: &now,
	}

	if err := s.repo.CreateDepartment(ctx, record); err != nil {
		return nil, err
	}

	return departmentFromModel(record), nil
}

func (s *Service) UpdateDepartment(ctx context.Context, input UpdateDepartmentInput) (*Department, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	if input.ID <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	current, err := s.repo.GetDepartment(ctx, input.ID)
	if err != nil {
		return nil, err
	}

	updates := make(map[string]interface{})
	operator := sanitizeOperator(input.Operator)
	now := time.Now()

	effectiveParentID := current.ParentID
	newAncestors := current.Ancestors
	oldAncestors := current.Ancestors
	parentChanged := false

	if input.ParentID != nil && *input.ParentID != current.ParentID {
		candidate := *input.ParentID
		if candidate == input.ID {
			return nil, ErrInvalidParentDepartment
		}
		if candidate < 0 {
			return nil, ErrInvalidParentDepartment
		}
		var parent *model.SysDept
		if candidate != 0 {
			parent, err = s.repo.GetDepartment(ctx, candidate)
			if err != nil {
				return nil, err
			}
			if candidate == current.DeptID || ancestorsContains(parent.Ancestors, current.DeptID) {
				return nil, ErrInvalidParentDepartment
			}
		}
		if candidate == 0 {
			newAncestors = defaultAncestor
		} else {
			newAncestors = composeAncestors(parent.Ancestors, parent.DeptID)
		}
		effectiveParentID = candidate
		parentChanged = true
		updates["parent_id"] = candidate
		updates["ancestors"] = newAncestors
	}

	effectiveName := current.DeptName
	if input.DeptName != nil {
		name := strings.TrimSpace(*input.DeptName)
		if name == "" {
			return nil, ErrDeptNameRequired
		}
		effectiveName = name
		updates["dept_name"] = name
	}

	if parentChanged || input.DeptName != nil {
		exists, err := s.repo.ExistsByName(ctx, effectiveParentID, effectiveName, current.DeptID)
		if err != nil {
			return nil, err
		}
		if exists {
			return nil, ErrDuplicateDepartmentName
		}
	}

	if input.OrderNum != nil {
		if *input.OrderNum < 0 {
			return nil, ErrInvalidDepartmentOrder
		}
		updates["order_num"] = *input.OrderNum
	}

	if input.Status != nil {
		status := normalizeStatus(*input.Status)
		if _, ok := validDepartmentStatusOptions[status]; !ok {
			return nil, ErrInvalidDepartmentStatus
		}
		updates["status"] = status
	}

	if input.Leader != nil {
		updates["leader"] = normalizeOptionalStringValue(input.Leader)
	}
	if input.Phone != nil {
		updates["phone"] = normalizeOptionalStringValue(input.Phone)
	}
	if input.Email != nil {
		updates["email"] = normalizeOptionalStringValue(input.Email)
	}
	if input.Remark != nil {
		updates["remark"] = normalizeOptionalStringValue(input.Remark)
	}

	updates["update_by"] = operator
	updates["update_time"] = now

	if err := s.repo.UpdateDepartment(ctx, input.ID, updates); err != nil {
		return nil, err
	}

	if parentChanged {
		if err := s.repo.UpdateDescendantAncestors(ctx, oldAncestors, newAncestors, current.DeptID, operator, now); err != nil {
			return nil, err
		}
	}

	updated, err := s.repo.GetDepartment(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	return departmentFromModel(updated), nil
}

func (s *Service) DeleteDepartment(ctx context.Context, id int64, operator string) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	if id <= 0 {
		return gorm.ErrRecordNotFound
	}

	if _, err := s.repo.GetDepartment(ctx, id); err != nil {
		return err
	}

	if children, err := s.repo.CountChildren(ctx, id); err != nil {
		return err
	} else if children > 0 {
		return ErrDepartmentHasChildren
	}

	if users, err := s.repo.CountUsersByDept(ctx, id); err != nil {
		return err
	} else if users > 0 {
		return ErrDepartmentHasUsers
	}

	now := time.Now()
	return s.repo.SoftDeleteDepartment(ctx, id, sanitizeOperator(operator), now)
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
		copy := record
		node := departmentFromModel(&copy)
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

func departmentFromModel(record *model.SysDept) *Department {
	if record == nil {
		return nil
	}
	return &Department{
		DeptID:   record.DeptID,
		ParentID: record.ParentID,
		DeptName: record.DeptName,
		Leader:   record.Leader,
		Phone:    record.Phone,
		Email:    record.Email,
		OrderNum: record.OrderNum,
		Status:   record.Status,
		Remark:   record.Remark,
	}
}

func normalizeStatus(value string) string {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return "0"
	}
	return trimmed
}

func composeAncestors(parentAncestors string, parentID int64) string {
	base := strings.Trim(parentAncestors, ", ")
	if base == "" {
		base = defaultAncestor
	}
	if parentID == 0 {
		return base
	}
	return fmt.Sprintf("%s,%d", base, parentID)
}

func normalizeOptionalStringPtr(value *string) *string {
	if value == nil {
		return nil
	}
	trimmed := strings.TrimSpace(*value)
	if trimmed == "" {
		return nil
	}
	result := trimmed
	return &result
}

func normalizeOptionalStringValue(value *string) interface{} {
	normalized := normalizeOptionalStringPtr(value)
	if normalized == nil {
		return nil
	}
	return *normalized
}

func ancestorsContains(ancestors string, target int64) bool {
	if strings.TrimSpace(ancestors) == "" {
		return false
	}
	parts := strings.Split(ancestors, ",")
	targetStr := strconv.FormatInt(target, 10)
	for _, part := range parts {
		if strings.TrimSpace(part) == targetStr {
			return true
		}
	}
	return false
}

func sanitizeOperator(operator string) string {
	return strings.TrimSpace(operator)
}
