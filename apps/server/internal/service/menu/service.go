package menu

import (
	"context"
	"errors"

	"github.com/starter-kit-fe/admin/internal/model"
	menurepo "github.com/starter-kit-fe/admin/internal/repo/menu"
)

var (
	ErrServiceUnavailable = errors.New("menu service is not initialized")
)

type Service struct {
	repo *menurepo.Repository
}

func New(repo *menurepo.Repository) *Service {
	if repo == nil {
		return nil
	}
	return &Service{repo: repo}
}

type ListOptions struct {
	Status   string
	MenuName string
}

type Menu struct {
	MenuID    int64   `json:"menuId"`
	MenuName  string  `json:"menuName"`
	ParentID  int64   `json:"parentId"`
	OrderNum  int     `json:"orderNum"`
	Path      string  `json:"path"`
	Component *string `json:"component,omitempty"`
	Query     *string `json:"query,omitempty"`
	RouteName string  `json:"routeName"`
	IsFrame   bool    `json:"isFrame"`
	IsCache   bool    `json:"isCache"`
	MenuType  string  `json:"menuType"`
	Visible   string  `json:"visible"`
	Status    string  `json:"status"`
	Perms     *string `json:"perms,omitempty"`
	Icon      string  `json:"icon"`
	Remark    string  `json:"remark"`
	Children  []*Menu `json:"children,omitempty"`
}

func (s *Service) ListMenuTree(ctx context.Context, opts ListOptions) ([]*Menu, error) {
	if s == nil || s.repo == nil {
		return nil, ErrServiceUnavailable
	}

	menus, err := s.repo.ListMenus(ctx, menurepo.ListOptions{
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
			MenuID:    menu.MenuID,
			MenuName:  menu.MenuName,
			ParentID:  menu.ParentID,
			OrderNum:  menu.OrderNum,
			Path:      menu.Path,
			Component: menu.Component,
			Query:     menu.Query,
			RouteName: menu.RouteName,
			IsFrame:   menu.IsFrame,
			IsCache:   menu.IsCache,
			MenuType:  menu.MenuType,
			Visible:   menu.Visible,
			Status:    menu.Status,
			Perms:     menu.Perms,
			Icon:      menu.Icon,
			Remark:    menu.Remark,
		}
		w := &wrapper{
			menu: menu,
			node: node,
		}
		cache[menu.MenuID] = w
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
