package menu

import (
	"context"
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/model"
)

var (
	ErrServiceUnavailable = errors.New("menu service is not initialized")
	ErrMenuNameRequired   = errors.New("menu name is required")
	ErrInvalidMenuType    = errors.New("invalid menu type")
	ErrInvalidMenuStatus  = errors.New("invalid menu status")
	ErrInvalidMenuVisible = errors.New("invalid menu visibility")
	ErrInvalidParentMenu  = errors.New("invalid parent menu")
	ErrInvalidMenuOrder   = errors.New("invalid menu order")
	validMenuTypes        = map[string]struct{}{"M": {}, "C": {}, "F": {}}
	validStatusValues     = map[string]struct{}{"0": {}, "1": {}}
	defaultOperator       = "system"
	maxMenuNameLength     = 50
	maxPathLength         = 200
	maxQueryLength        = 255
	maxPermLength         = 100
	maxIconLength         = 100
	maxRemarkLength       = 500
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
	MenuName string
}

type Menu struct {
	ID       int64   `json:"id"`
	MenuName string  `json:"menuName"`
	ParentID int64   `json:"parentId"`
	OrderNum int     `json:"orderNum"`
	Path     string  `json:"path"`
	Query    *string `json:"query,omitempty"`
	IsFrame  bool    `json:"isFrame"`
	IsCache  bool    `json:"isCache"`
	MenuType string  `json:"menuType"`
	Visible  string  `json:"visible"`
	Status   string  `json:"status"`
	Perms    *string `json:"perms,omitempty"`
	Icon     string  `json:"icon"`
	Remark   string  `json:"remark"`
	Children []*Menu `json:"children,omitempty"`
}

type CreateMenuInput struct {
	MenuName string
	ParentID int64
	OrderNum *int
	Path     string
	Query    *string
	IsFrame  bool
	IsCache  bool
	MenuType string
	Visible  string
	Status   string
	Perms    *string
	Icon     string
	Remark   *string
	Operator string
}

type UpdateMenuInput struct {
	ID       int64
	MenuName *string
	ParentID *int64
	OrderNum *int
	Path     *string
	Query    *string
	IsFrame  *bool
	IsCache  *bool
	MenuType *string
	Visible  *string
	Status   *string
	Perms    *string
	Icon     *string
	Remark   *string
	Operator string
}

type MenuOrderItem struct {
	MenuID   int64
	ParentID int64
	OrderNum int
}

type ReorderMenusInput struct {
	Items    []MenuOrderItem
	Operator string
}

func (s *Service) ListMenuTree(ctx context.Context, opts QueryOptions) ([]*Menu, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	menus, err := s.repo.ListMenus(ctx, ListOptions{
		Status:   opts.Status,
		MenuName: opts.MenuName,
	})
	if err != nil {
		return nil, err
	}

	return buildMenuTree(menus), nil
}

func (s *Service) GetMenusByIDs(ctx context.Context, ids []int64) (map[int64]model.SysMenu, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	return s.repo.GetMenusByIDs(ctx, ids)
}

func (s *Service) GetMenu(ctx context.Context, id int64) (*Menu, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	record, err := s.repo.GetMenu(ctx, id)
	if err != nil {
		return nil, err
	}
	return menuFromModel(record), nil
}

func (s *Service) CreateMenu(ctx context.Context, input CreateMenuInput) (*Menu, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	name := strings.TrimSpace(input.MenuName)
	if name == "" {
		return nil, ErrMenuNameRequired
	}
	if len(name) > maxMenuNameLength {
		name = name[:maxMenuNameLength]
	}

	menuType := strings.TrimSpace(input.MenuType)
	if _, ok := validMenuTypes[menuType]; !ok {
		return nil, ErrInvalidMenuType
	}

	visible := strings.TrimSpace(input.Visible)
	if _, ok := validStatusValues[visible]; !ok {
		return nil, ErrInvalidMenuVisible
	}

	status := strings.TrimSpace(input.Status)
	if _, ok := validStatusValues[status]; !ok {
		return nil, ErrInvalidMenuStatus
	}

	var (
		parent *model.SysMenu
		err    error
	)
	if input.ParentID > 0 {
		parent, err = s.repo.GetMenu(ctx, input.ParentID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, ErrInvalidParentMenu
			}
			return nil, err
		}
	}
	if err := validateParentMenu(menuType, parent, input.ParentID); err != nil {
		return nil, err
	}

	orderNum := 0
	if input.OrderNum != nil {
		if *input.OrderNum < 0 {
			return nil, ErrInvalidMenuOrder
		}
		orderNum = *input.OrderNum
	}

	operator := strings.TrimSpace(input.Operator)
	if operator == "" {
		operator = defaultOperator
	}

	record := &model.SysMenu{
		MenuName: name,
		ParentID: input.ParentID,
		OrderNum: orderNum,
		Path:     truncate(strings.TrimSpace(input.Path), maxPathLength),
		IsFrame:  input.IsFrame,
		IsCache:  input.IsCache,
		MenuType: menuType,
		Visible:  visible,
		Status:   status,
		Icon:     truncate(strings.TrimSpace(input.Icon), maxIconLength),
		Remark:   truncate(strings.TrimSpace(pointerValue(input.Remark)), maxRemarkLength),
		CreateBy: operator,
		UpdateBy: operator,
	}

	if query := strings.TrimSpace(pointerValue(input.Query)); query != "" {
		record.Query = &query
	}
	if perms := strings.TrimSpace(pointerValue(input.Perms)); perms != "" {
		record.Perms = &perms
	}

	if err := s.repo.CreateMenu(ctx, record); err != nil {
		return nil, err
	}

	created, err := s.repo.GetMenu(ctx, int64(record.ID))
	if err != nil {
		return nil, err
	}
	return menuFromModel(created), nil
}

func (s *Service) UpdateMenu(ctx context.Context, input UpdateMenuInput) (*Menu, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}
	if input.ID <= 0 {
		return nil, gorm.ErrRecordNotFound
	}

	var err error
	if input.ParentID != nil || input.MenuType != nil {
		current, err := s.repo.GetMenu(ctx, input.ID)
		if err != nil {
			return nil, err
		}
		targetMenuType := current.MenuType
		if input.MenuType != nil {
			targetMenuType = strings.TrimSpace(*input.MenuType)
		}
		targetParentID := current.ParentID
		if input.ParentID != nil {
			targetParentID = *input.ParentID
		}
		var parent *model.SysMenu
		if targetParentID > 0 {
			parent, err = s.repo.GetMenu(ctx, targetParentID)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return nil, ErrInvalidParentMenu
				}
				return nil, err
			}
		}
		if err := validateParentMenu(targetMenuType, parent, targetParentID); err != nil {
			return nil, err
		}
	}

	updates := make(map[string]interface{})

	if input.MenuName != nil {
		name := strings.TrimSpace(*input.MenuName)
		if name == "" {
			return nil, ErrMenuNameRequired
		}
		if len(name) > maxMenuNameLength {
			name = name[:maxMenuNameLength]
		}
		updates["menu_name"] = name
	}

	if input.MenuType != nil {
		menuType := strings.TrimSpace(*input.MenuType)
		if _, ok := validMenuTypes[menuType]; !ok {
			return nil, ErrInvalidMenuType
		}
		updates["menu_type"] = menuType
	}

	if input.Visible != nil {
		visible := strings.TrimSpace(*input.Visible)
		if _, ok := validStatusValues[visible]; !ok {
			return nil, ErrInvalidMenuVisible
		}
		updates["visible"] = visible
	}

	if input.Status != nil {
		status := strings.TrimSpace(*input.Status)
		if _, ok := validStatusValues[status]; !ok {
			return nil, ErrInvalidMenuStatus
		}
		updates["status"] = status
	}

	if input.OrderNum != nil {
		if *input.OrderNum < 0 {
			return nil, ErrInvalidMenuOrder
		}
		updates["order_num"] = *input.OrderNum
	}

	if input.Path != nil {
		updates["path"] = truncate(strings.TrimSpace(*input.Path), maxPathLength)
	}
	if input.Query != nil {
		query := strings.TrimSpace(*input.Query)
		if query == "" {
			updates["query"] = nil
		} else {
			updates["query"] = truncate(query, maxQueryLength)
		}
	}
	if input.Perms != nil {
		perms := strings.TrimSpace(*input.Perms)
		if perms == "" {
			updates["perms"] = nil
		} else {
			updates["perms"] = truncate(perms, maxPermLength)
		}
	}
	if input.Icon != nil {
		updates["icon"] = truncate(strings.TrimSpace(*input.Icon), maxIconLength)
	}
	if input.Remark != nil {
		updates["remark"] = truncate(strings.TrimSpace(*input.Remark), maxRemarkLength)
	}
	if input.IsFrame != nil {
		updates["is_frame"] = *input.IsFrame
	}
	if input.IsCache != nil {
		updates["is_cache"] = *input.IsCache
	}

	if input.ParentID != nil {
		if *input.ParentID == input.ID {
			return nil, ErrInvalidParentMenu
		}
		if *input.ParentID > 0 {
			parent, err := s.repo.GetMenu(ctx, *input.ParentID)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return nil, ErrInvalidParentMenu
				}
				return nil, err
			}
			if parent.MenuType == "F" {
				return nil, ErrInvalidParentMenu
			}
		}
		updates["parent_id"] = *input.ParentID
	}

	operator := strings.TrimSpace(input.Operator)
	if operator == "" {
		operator = defaultOperator
	}
	updates["update_by"] = operator
	updates["updated_at"] = time.Now()

	if err := s.repo.UpdateMenu(ctx, input.ID, updates); err != nil {
		return nil, err
	}

	updated, err := s.repo.GetMenu(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	return menuFromModel(updated), nil
}

func (s *Service) DeleteMenu(ctx context.Context, id int64) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	return s.repo.DeleteMenu(ctx, id)
}

func (s *Service) ReorderMenus(ctx context.Context, input ReorderMenusInput) error {
	if s == nil || s.repo == nil {
		return ErrServiceUnavailable
	}
	if len(input.Items) == 0 {
		return nil
	}
	now := time.Now()
	operator := strings.TrimSpace(input.Operator)
	if operator == "" {
		operator = defaultOperator
	}

	updates := make([]OrderUpdate, 0, len(input.Items))
	for _, item := range input.Items {
		if item.MenuID <= 0 || item.OrderNum < 0 {
			return ErrInvalidMenuOrder
		}
		updates = append(updates, OrderUpdate{
			MenuID:   item.MenuID,
			ParentID: item.ParentID,
			OrderNum: item.OrderNum,
			Operator: operator,
			At:       now,
		})
	}

	return s.repo.UpdateMenuOrders(ctx, updates)
}

func menuFromModel(menu *model.SysMenu) *Menu {
	if menu == nil {
		return nil
	}
	result := &Menu{
		ID:       int64(menu.ID),
		MenuName: menu.MenuName,
		ParentID: menu.ParentID,
		OrderNum: menu.OrderNum,
		Path:     menu.Path,
		Query:    menu.Query,
		IsFrame:  menu.IsFrame,
		IsCache:  menu.IsCache,
		MenuType: menu.MenuType,
		Visible:  menu.Visible,
		Status:   menu.Status,
		Perms:    menu.Perms,
		Icon:     menu.Icon,
		Remark:   menu.Remark,
	}
	return result
}

func buildMenuTree(menus []model.SysMenu) []*Menu {
	if len(menus) == 0 {
		return []*Menu{}
	}

	root := &Menu{Children: []*Menu{}}

	type wrapper struct {
		menu model.SysMenu
		node *Menu
	}

	cache := make(map[int64]*wrapper, len(menus))
	ordered := make([]*wrapper, 0, len(menus))

	for _, menu := range menus {
		node := &Menu{
			ID:       int64(menu.ID),
			MenuName: menu.MenuName,
			ParentID: menu.ParentID,
			OrderNum: menu.OrderNum,
			Path:     menu.Path,
			Query:    menu.Query,
			IsFrame:  menu.IsFrame,
			IsCache:  menu.IsCache,
			MenuType: menu.MenuType,
			Visible:  menu.Visible,
			Status:   menu.Status,
			Perms:    menu.Perms,
			Icon:     menu.Icon,
			Remark:   menu.Remark,
		}
		w := &wrapper{
			menu: menu,
			node: node,
		}
		cache[int64(menu.ID)] = w
		ordered = append(ordered, w)
	}

	for _, w := range ordered {
		if w == nil {
			continue
		}
		if w.menu.ParentID == 0 {
			root.Children = append(root.Children, w.node)
			continue
		}
		parent := cache[w.menu.ParentID]
		if parent == nil {
			root.Children = append(root.Children, w.node)
			continue
		}
		parent.node.Children = append(parent.node.Children, w.node)
	}
	return root.Children
}

func validateParentMenu(menuType string, parent *model.SysMenu, parentID int64) error {
	switch menuType {
	case "F":
		if parentID == 0 {
			return ErrInvalidParentMenu
		}
		if parent == nil || parent.MenuType != "C" {
			return ErrInvalidParentMenu
		}
	case "C", "M":
		if parentID == 0 {
			return nil
		}
		if parent == nil || parent.MenuType != "M" {
			return ErrInvalidParentMenu
		}
	default:
		return ErrInvalidMenuType
	}
	return nil
}

func pointerValue(value *string) string {
	if value == nil {
		return ""
	}
	return *value
}

func truncate(value string, max int) string {
	if max <= 0 || len(value) <= max {
		return value
	}
	return value[:max]
}
