package role

import (
	"context"
	"errors"
	"sort"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
	"github.com/starter-kit-fe/admin/internal/system/menu"
)

var (
	ErrServiceUnavailable   = errors.New("role service is not initialized")
	ErrRoleNameRequired     = errors.New("role name is required")
	ErrRoleKeyRequired      = errors.New("role key is required")
	ErrInvalidStatus        = errors.New("invalid role status")
	ErrDuplicateRoleName    = errors.New("role name already exists")
	ErrDuplicateRoleKey     = errors.New("role key already exists")
	ErrInvalidDataScope     = errors.New("invalid data scope")
	ErrInvalidRoleSort      = errors.New("invalid role sort")
	ErrInvalidMenuSelection = errors.New("invalid menu selection")
	validStatuses           = map[string]struct{}{"0": {}, "1": {}}
	validDataScopes         = map[string]struct{}{"1": {}, "2": {}, "3": {}, "4": {}, "5": {}}
	defaultDataScope        = "1"
	defaultRoleSort         = 0
	maxRemarkLength         = 256
	maxRoleNameLength       = 50
	maxRoleKeyLength        = 100
	defaultOperator         = "system"
)

type Service struct {
	repo     *Repository
	menuRepo *menu.Repository
}

func NewService(repo *Repository, menuRepo *menu.Repository) *Service {
	if repo == nil {
		return nil
	}
	return &Service{repo: repo, menuRepo: menuRepo}
}

type QueryOptions struct {
	PageNum  int
	PageSize int
	RoleName string
	Status   string
}

type ListResult struct {
	List     []Role `json:"list"`
	Total    int64  `json:"total"`
	PageNum  int    `json:"pageNum"`
	PageSize int    `json:"pageSize"`
}

type Role struct {
	RoleID            int64      `json:"roleId"`
	RoleName          string     `json:"roleName"`
	RoleKey           string     `json:"roleKey"`
	RoleSort          int        `json:"roleSort"`
	DataScope         string     `json:"dataScope"`
	MenuCheckStrictly bool       `json:"menuCheckStrictly"`
	DeptCheckStrictly bool       `json:"deptCheckStrictly"`
	Status            string     `json:"status"`
	Remark            *string    `json:"remark,omitempty"`
	CreateBy          string     `json:"createBy"`
	CreatedAt         *time.Time `json:"createdAt,omitempty"`
	UpdateBy          string     `json:"updateBy"`
	UpdatedAt         *time.Time `json:"updatedAt,omitempty"`
	MenuIDs           []int64    `json:"menuIds"`
}

type CreateRoleInput struct {
	RoleName          string
	RoleKey           string
	RoleSort          *int
	DataScope         string
	MenuCheckStrictly bool
	DeptCheckStrictly bool
	Status            string
	Remark            *string
	Operator          string
	MenuIDs           []int64
}

type UpdateRoleInput struct {
	ID                int64
	RoleName          *string
	RoleKey           *string
	RoleSort          *int
	DataScope         *string
	MenuCheckStrictly *bool
	DeptCheckStrictly *bool
	Status            *string
	Remark            *string
	Operator          string
	MenuIDs           *[]int64
}

type DeleteRoleInput struct {
	ID       int64
	Operator string
}

func (s *Service) ListRoles(ctx context.Context, opts QueryOptions) (*ListResult, error) {
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

	records, total, err := s.repo.ListRoles(ctx, ListOptions{
		PageNum:  pageNum,
		PageSize: pageSize,
		RoleName: opts.RoleName,
		Status:   status,
	})
	if err != nil {
		return nil, err
	}

	roles := make([]Role, 0, len(records))
	for _, record := range records {
		role := Role{
			RoleID:            int64(record.ID),
			RoleName:          record.RoleName,
			RoleKey:           record.RoleKey,
			RoleSort:          record.RoleSort,
			DataScope:         record.DataScope,
			MenuCheckStrictly: record.MenuCheckStrictly,
			DeptCheckStrictly: record.DeptCheckStrictly,
			Status:            record.Status,
			Remark:            record.Remark,
			CreateBy:          record.CreateBy,
			CreatedAt:         &record.CreatedAt,
			UpdateBy:          record.UpdateBy,
			UpdatedAt:         &record.UpdatedAt,
			MenuIDs:           []int64{},
		}
		roles = append(roles, role)
	}

	return &ListResult{
		List:     roles,
		Total:    total,
		PageNum:  pageNum,
		PageSize: pageSize,
	}, nil
}

func (s *Service) GetRole(ctx context.Context, id int64) (*Role, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	if id <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	record, err := s.repo.GetRole(ctx, id)
	if err != nil {
		return nil, err
	}

	menuIDs, err := s.repo.GetMenuIDsByRole(ctx, id)
	if err != nil {
		return nil, err
	}

	return &Role{
		RoleID:            int64(record.ID),
		RoleName:          record.RoleName,
		RoleKey:           record.RoleKey,
		RoleSort:          record.RoleSort,
		DataScope:         record.DataScope,
		MenuCheckStrictly: record.MenuCheckStrictly,
		DeptCheckStrictly: record.DeptCheckStrictly,
		Status:            record.Status,
		Remark:            record.Remark,
		CreateBy:          record.CreateBy,
		CreatedAt:         &record.CreatedAt,
		UpdateBy:          record.UpdateBy,
		UpdatedAt:         &record.UpdatedAt,
		MenuIDs:           menuIDs,
	}, nil
}

func (s *Service) CreateRole(ctx context.Context, input CreateRoleInput) (*Role, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	roleName := sanitizeRoleName(input.RoleName)
	if roleName == "" {
		return nil, ErrRoleNameRequired
	}
	roleKey := sanitizeRoleKey(input.RoleKey)
	if roleKey == "" {
		return nil, ErrRoleKeyRequired
	}
	roleSort := defaultRoleSort
	if input.RoleSort != nil {
		roleSort = *input.RoleSort
		if roleSort < 0 {
			return nil, ErrInvalidRoleSort
		}
	}

	status := normalizeStatus(input.Status)
	if _, ok := validStatuses[status]; !ok {
		return nil, ErrInvalidStatus
	}

	dataScope := normalizeDataScope(input.DataScope)
	if _, ok := validDataScopes[dataScope]; !ok {
		return nil, ErrInvalidDataScope
	}

	if exists, err := s.repo.ExistsByName(ctx, roleName, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrDuplicateRoleName
	}

	if exists, err := s.repo.ExistsByKey(ctx, roleKey, 0); err != nil {
		return nil, err
	} else if exists {
		return nil, ErrDuplicateRoleKey
	}

	menuIDs, err := s.validateMenuIDs(ctx, input.MenuIDs)
	if err != nil {
		return nil, err
	}

	remark := normalizeRemark(input.Remark)
	operator := sanitizeOperator(input.Operator)

	record := &model.SysRole{
		RoleName:          roleName,
		RoleKey:           roleKey,
		RoleSort:          roleSort,
		DataScope:         dataScope,
		MenuCheckStrictly: input.MenuCheckStrictly,
		DeptCheckStrictly: input.DeptCheckStrictly,
		Status:            status,
		Remark:            remark,

		CreateBy: operator,
		UpdateBy: operator,
	}

	if err := s.repo.CreateRole(ctx, record); err != nil {
		if errors.Is(err, gorm.ErrDuplicatedKey) {
			return nil, ErrDuplicateRoleName
		}
		return nil, err
	}

	if err := s.repo.ReplaceRoleMenus(ctx, int64(record.ID), menuIDs); err != nil {
		return nil, err
	}

	return s.GetRole(ctx, int64(record.ID))
}

func (s *Service) UpdateRole(ctx context.Context, input UpdateRoleInput) (*Role, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	if input.ID <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	updates := make(map[string]interface{})

	if input.RoleName != nil {
		name := sanitizeRoleName(*input.RoleName)
		if name == "" {
			return nil, ErrRoleNameRequired
		}
		if exists, err := s.repo.ExistsByName(ctx, name, input.ID); err != nil {
			return nil, err
		} else if exists {
			return nil, ErrDuplicateRoleName
		}
		updates["role_name"] = name
	}

	if input.RoleKey != nil {
		key := sanitizeRoleKey(*input.RoleKey)
		if key == "" {
			return nil, ErrRoleKeyRequired
		}
		if exists, err := s.repo.ExistsByKey(ctx, key, input.ID); err != nil {
			return nil, err
		} else if exists {
			return nil, ErrDuplicateRoleKey
		}
		updates["role_key"] = key
	}

	if input.RoleSort != nil {
		if *input.RoleSort < 0 {
			return nil, ErrInvalidRoleSort
		}
		updates["role_sort"] = *input.RoleSort
	}

	if input.Status != nil {
		status := normalizeStatus(*input.Status)
		if _, ok := validStatuses[status]; !ok {
			return nil, ErrInvalidStatus
		}
		updates["status"] = status
	}

	if input.DataScope != nil {
		scope := normalizeDataScope(*input.DataScope)
		if _, ok := validDataScopes[scope]; !ok {
			return nil, ErrInvalidDataScope
		}
		updates["data_scope"] = scope
	}

	if input.MenuCheckStrictly != nil {
		updates["menu_check_strictly"] = *input.MenuCheckStrictly
	}

	if input.DeptCheckStrictly != nil {
		updates["dept_check_strictly"] = *input.DeptCheckStrictly
	}

	if input.Remark != nil {
		if trimmed := normalizeRemark(input.Remark); trimmed == nil {
			updates["remark"] = nil
		} else {
			updates["remark"] = *trimmed
		}
	}

	if len(updates) > 0 {
		operator := sanitizeOperator(input.Operator)
		now := time.Now()
		updates["update_by"] = operator
		updates["updated_at"] = now

		if err := s.repo.UpdateRole(ctx, input.ID, updates); err != nil {
			if errors.Is(err, gorm.ErrDuplicatedKey) {
				// database unique constraint could exist on role_name or role_key
				if input.RoleName != nil {
					return nil, ErrDuplicateRoleName
				}
				if input.RoleKey != nil {
					return nil, ErrDuplicateRoleKey
				}
			}
			return nil, err
		}
	}

	if input.MenuIDs != nil {
		menuIDs, err := s.validateMenuIDs(ctx, *input.MenuIDs)
		if err != nil {
			return nil, err
		}
		if err := s.repo.ReplaceRoleMenus(ctx, input.ID, menuIDs); err != nil {
			return nil, err
		}
	}

	return s.GetRole(ctx, input.ID)
}

func (s *Service) DeleteRole(ctx context.Context, input DeleteRoleInput) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	if input.ID <= 0 {
		return gorm.ErrRecordNotFound
	}

	operator := sanitizeOperator(input.Operator)
	if err := s.repo.SoftDeleteRole(ctx, input.ID, operator, time.Now()); err != nil {
		return err
	}
	return s.repo.ReplaceRoleMenus(ctx, input.ID, nil)
}

func sanitizeRoleName(name string) string {
	value := strings.TrimSpace(name)
	if value == "" {
		return ""
	}
	if len([]rune(value)) > maxRoleNameLength {
		return string([]rune(value)[:maxRoleNameLength])
	}
	return value
}

func sanitizeRoleKey(key string) string {
	value := strings.TrimSpace(key)
	if value == "" {
		return ""
	}
	if len([]rune(value)) > maxRoleKeyLength {
		return string([]rune(value)[:maxRoleKeyLength])
	}
	return value
}

func normalizeStatus(status string) string {
	value := strings.TrimSpace(status)
	if value == "" {
		return "0"
	}
	return value
}

func normalizeDataScope(scope string) string {
	value := strings.TrimSpace(scope)
	if value == "" {
		return defaultDataScope
	}
	return value
}

func sanitizeOperator(operator string) string {
	value := strings.TrimSpace(operator)
	if value == "" {
		return defaultOperator
	}
	if len(value) > 64 {
		return value[:64]
	}
	return value
}

func normalizeRemark(remark *string) *string {
	if remark == nil {
		return nil
	}
	value := strings.TrimSpace(*remark)
	if value == "" {
		return nil
	}
	runes := []rune(value)
	if len(runes) > maxRemarkLength {
		value = string(runes[:maxRemarkLength])
	}
	return &value
}

func (s *Service) validateMenuIDs(ctx context.Context, ids []int64) ([]int64, error) {
	if len(ids) == 0 {
		return []int64{}, nil
	}

	sanitized := sanitizeMenuIDs(ids)
	if len(sanitized) == 0 {
		return []int64{}, nil
	}

	if s.menuRepo == nil {
		return sanitized, nil
	}

	menuMap, err := s.menuRepo.GetMenusByIDs(ctx, sanitized)
	if err != nil {
		return nil, err
	}

	if len(menuMap) == len(sanitized) {
		return sanitized, nil
	}

	valid := make([]int64, 0, len(menuMap))
	for _, id := range sanitized {
		if _, exists := menuMap[id]; exists {
			valid = append(valid, id)
		}
	}
	if len(valid) == 0 {
		return nil, ErrInvalidMenuSelection
	}
	return valid, nil
}

func sanitizeMenuIDs(ids []int64) []int64 {
	if len(ids) == 0 {
		return []int64{}
	}
	unique := make(map[int64]struct{}, len(ids))
	result := make([]int64, 0, len(ids))
	for _, id := range ids {
		if id <= 0 {
			continue
		}
		if _, exists := unique[id]; exists {
			continue
		}
		unique[id] = struct{}{}
		result = append(result, id)
	}
	sort.Slice(result, func(i, j int) bool { return result[i] < result[j] })
	return result
}
