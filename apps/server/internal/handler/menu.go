package handler

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	menuservice "github.com/starter-kit-fe/admin/internal/service/menu"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type MenuHandler struct {
	service *menuservice.Service
}

func NewMenuHandler(service *menuservice.Service) *MenuHandler {
	if service == nil {
		return nil
	}
	return &MenuHandler{service: service}
}

type createMenuRequest struct {
	MenuName  string  `json:"menuName" binding:"required"`
	ParentID  int64   `json:"parentId"`
	OrderNum  *int    `json:"orderNum"`
	Path      string  `json:"path"`
	Component *string `json:"component"`
	Query     *string `json:"query"`
	RouteName string  `json:"routeName" binding:"required"`
	IsFrame   bool    `json:"isFrame"`
	IsCache   bool    `json:"isCache"`
	MenuType  string  `json:"menuType" binding:"required"`
	Visible   string  `json:"visible"`
	Status    string  `json:"status"`
	Perms     *string `json:"perms"`
	Icon      string  `json:"icon"`
	Remark    *string `json:"remark"`
}

type updateMenuRequest struct {
	MenuName  *string `json:"menuName"`
	ParentID  *int64  `json:"parentId"`
	OrderNum  *int    `json:"orderNum"`
	Path      *string `json:"path"`
	Component *string `json:"component"`
	Query     *string `json:"query"`
	RouteName *string `json:"routeName"`
	IsFrame   *bool   `json:"isFrame"`
	IsCache   *bool   `json:"isCache"`
	MenuType  *string `json:"menuType"`
	Visible   *string `json:"visible"`
	Status    *string `json:"status"`
	Perms     *string `json:"perms"`
	Icon      *string `json:"icon"`
	Remark    *string `json:"remark"`
}

type reorderMenuItem struct {
	MenuID   int64 `json:"menuId"`
	ParentID int64 `json:"parentId"`
	OrderNum int   `json:"orderNum"`
}

type reorderMenuRequest struct {
	Items []reorderMenuItem `json:"items"`
}

func (h *MenuHandler) Tree(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("menu service unavailable"))
		return
	}

	status := ctx.Query("status")
	name := ctx.Query("menuName")

	tree, err := h.service.ListMenuTree(ctx.Request.Context(), menuservice.ListOptions{
		Status:   status,
		MenuName: name,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load menu tree"))
		return
	}

	resp.OK(ctx, resp.WithData(tree))
}

func (h *MenuHandler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("menu service unavailable"))
		return
	}

	id, err := parseMenuID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid menu id"))
		return
	}

	menu, err := h.service.GetMenu(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("menu not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load menu"))
		return
	}

	resp.OK(ctx, resp.WithData(menu))
}

func (h *MenuHandler) Create(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("menu service unavailable"))
		return
	}

	var payload createMenuRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid menu payload"))
		return
	}

	operator := resolveOperator(ctx)
	menu, err := h.service.CreateMenu(ctx.Request.Context(), menuservice.CreateMenuInput{
		MenuName:  payload.MenuName,
		ParentID:  payload.ParentID,
		OrderNum:  payload.OrderNum,
		Path:      payload.Path,
		Component: payload.Component,
		Query:     payload.Query,
		RouteName: payload.RouteName,
		IsFrame:   payload.IsFrame,
		IsCache:   payload.IsCache,
		MenuType:  payload.MenuType,
		Visible:   payload.Visible,
		Status:    payload.Status,
		Perms:     payload.Perms,
		Icon:      payload.Icon,
		Remark:    payload.Remark,
		Operator:  operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, menuservice.ErrMenuNameRequired):
			resp.BadRequest(ctx, resp.WithMessage("menu name is required"))
		case errors.Is(err, menuservice.ErrInvalidMenuType):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu type"))
		case errors.Is(err, menuservice.ErrInvalidMenuStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu status"))
		case errors.Is(err, menuservice.ErrInvalidMenuVisible):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu visibility"))
		case errors.Is(err, menuservice.ErrInvalidParentMenu):
			resp.BadRequest(ctx, resp.WithMessage("invalid parent menu"))
		case errors.Is(err, menuservice.ErrInvalidRouteName):
			resp.BadRequest(ctx, resp.WithMessage("route name is required"))
		case errors.Is(err, menuservice.ErrInvalidMenuOrder):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu order"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create menu"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(menu))
}

func (h *MenuHandler) Update(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("menu service unavailable"))
		return
	}

	id, err := parseMenuID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid menu id"))
		return
	}

	var payload updateMenuRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid menu payload"))
		return
	}

	operator := resolveOperator(ctx)
	menu, err := h.service.UpdateMenu(ctx.Request.Context(), menuservice.UpdateMenuInput{
		ID:        id,
		MenuName:  payload.MenuName,
		ParentID:  payload.ParentID,
		OrderNum:  payload.OrderNum,
		Path:      payload.Path,
		Component: payload.Component,
		Query:     payload.Query,
		RouteName: payload.RouteName,
		IsFrame:   payload.IsFrame,
		IsCache:   payload.IsCache,
		MenuType:  payload.MenuType,
		Visible:   payload.Visible,
		Status:    payload.Status,
		Perms:     payload.Perms,
		Icon:      payload.Icon,
		Remark:    payload.Remark,
		Operator:  operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("menu not found"))
		case errors.Is(err, menuservice.ErrMenuNameRequired):
			resp.BadRequest(ctx, resp.WithMessage("menu name is required"))
		case errors.Is(err, menuservice.ErrInvalidMenuType):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu type"))
		case errors.Is(err, menuservice.ErrInvalidMenuStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu status"))
		case errors.Is(err, menuservice.ErrInvalidMenuVisible):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu visibility"))
		case errors.Is(err, menuservice.ErrInvalidParentMenu):
			resp.BadRequest(ctx, resp.WithMessage("invalid parent menu"))
		case errors.Is(err, menuservice.ErrInvalidRouteName):
			resp.BadRequest(ctx, resp.WithMessage("route name is required"))
		case errors.Is(err, menuservice.ErrInvalidMenuOrder):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu order"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update menu"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(menu))
}

func (h *MenuHandler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("menu service unavailable"))
		return
	}

	id, err := parseMenuID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid menu id"))
		return
	}

	if err := h.service.DeleteMenu(ctx.Request.Context(), id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("menu not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete menu"))
		return
	}

	resp.NoContent(ctx)
}

func (h *MenuHandler) Reorder(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("menu service unavailable"))
		return
	}

	var payload reorderMenuRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid reorder payload"))
		return
	}

	if len(payload.Items) == 0 {
		resp.NoContent(ctx)
		return
	}

	operator := resolveOperator(ctx)
	items := make([]menuservice.MenuOrderItem, 0, len(payload.Items))
	for _, item := range payload.Items {
		items = append(items, menuservice.MenuOrderItem{
			MenuID:   item.MenuID,
			ParentID: item.ParentID,
			OrderNum: item.OrderNum,
		})
	}

	if err := h.service.ReorderMenus(ctx.Request.Context(), menuservice.ReorderMenusInput{
		Items:    items,
		Operator: operator,
	}); err != nil {
		switch {
		case errors.Is(err, menuservice.ErrInvalidMenuOrder):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu order"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to reorder menus"))
		}
		return
	}

	resp.NoContent(ctx)
}

func parseMenuID(param string) (int64, error) {
	return strconv.ParseInt(strings.TrimSpace(param), 10, 64)
}
