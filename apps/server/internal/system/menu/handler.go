package menu

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/middleware"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type Handler struct {
	service *Service
}

func NewHandler(service *Service) *Handler {
	if service == nil {
		return nil
	}
	return &Handler{service: service}
}

type createMenuRequest struct {
	MenuName string  `json:"menuName" binding:"required"`
	ParentID int64   `json:"parentId"`
	OrderNum *int    `json:"orderNum"`
	Path     string  `json:"path"`
	Query    *string `json:"query"`
	IsFrame  bool    `json:"isFrame"`
	IsCache  bool    `json:"isCache"`
	MenuType string  `json:"menuType" binding:"required"`
	Visible  string  `json:"visible"`
	Status   string  `json:"status"`
	Perms    *string `json:"perms"`
	Icon     string  `json:"icon"`
	Remark   *string `json:"remark"`
}

type updateMenuRequest struct {
	MenuName *string `json:"menuName"`
	ParentID *int64  `json:"parentId"`
	OrderNum *int    `json:"orderNum"`
	Path     *string `json:"path"`
	Query    *string `json:"query"`
	IsFrame  *bool   `json:"isFrame"`
	IsCache  *bool   `json:"isCache"`
	MenuType *string `json:"menuType"`
	Visible  *string `json:"visible"`
	Status   *string `json:"status"`
	Perms    *string `json:"perms"`
	Icon     *string `json:"icon"`
	Remark   *string `json:"remark"`
}

type reorderMenuItem struct {
	MenuID   int64 `json:"menuId"`
	ParentID int64 `json:"parentId"`
	OrderNum int   `json:"orderNum"`
}

type reorderMenuRequest struct {
	Items []reorderMenuItem `json:"items"`
}

// Tree godoc
// @Summary 获取菜单树
// @Description 查询菜单树形结构
// @Tags System/Menu
// @Security BearerAuth
// @Produce json
// @Param status query string false "菜单状态"
// @Param menuName query string false "菜单名称"
// @Success 200 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/menus/tree [get]
func (h *Handler) Tree(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("menu service unavailable"))
		return
	}

	status := ctx.Query("status")
	name := ctx.Query("menuName")

	tree, err := h.service.ListMenuTree(ctx.Request.Context(), QueryOptions{
		Status:   status,
		MenuName: name,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load menu tree"))
		return
	}

	resp.OK(ctx, resp.WithData(tree))
}

// Get godoc
// @Summary 获取菜单详情
// @Description 根据ID查询菜单
// @Tags System/Menu
// @Security BearerAuth
// @Produce json
// @Param id path int true "菜单ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/menus/{id} [get]
func (h *Handler) Get(ctx *gin.Context) {
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

// Create godoc
// @Summary 新增菜单
// @Description 创建菜单资源
// @Tags System/Menu
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body createMenuRequest true "菜单参数"
// @Success 201 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/menus [post]
func (h *Handler) Create(ctx *gin.Context) {
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
	menu, err := h.service.CreateMenu(ctx.Request.Context(), CreateMenuInput{
		MenuName: payload.MenuName,
		ParentID: payload.ParentID,
		OrderNum: payload.OrderNum,
		Path:     payload.Path,
		Query:    payload.Query,
		IsFrame:  payload.IsFrame,
		IsCache:  payload.IsCache,
		MenuType: payload.MenuType,
		Visible:  payload.Visible,
		Status:   payload.Status,
		Perms:    payload.Perms,
		Icon:     payload.Icon,
		Remark:   payload.Remark,
		Operator: operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrMenuNameRequired):
			resp.BadRequest(ctx, resp.WithMessage("menu name is required"))
		case errors.Is(err, ErrInvalidMenuType):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu type"))
		case errors.Is(err, ErrInvalidMenuStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu status"))
		case errors.Is(err, ErrInvalidMenuVisible):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu visibility"))
		case errors.Is(err, ErrInvalidParentMenu):
			resp.BadRequest(ctx, resp.WithMessage("invalid parent menu"))
		case errors.Is(err, ErrInvalidMenuOrder):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu order"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create menu"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(menu))
}

// Update godoc
// @Summary 修改菜单
// @Description 更新菜单信息
// @Tags System/Menu
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "菜单ID"
// @Param request body updateMenuRequest true "菜单参数"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/menus/{id} [put]
func (h *Handler) Update(ctx *gin.Context) {
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
	menu, err := h.service.UpdateMenu(ctx.Request.Context(), UpdateMenuInput{
		ID:       id,
		MenuName: payload.MenuName,
		ParentID: payload.ParentID,
		OrderNum: payload.OrderNum,
		Path:     payload.Path,
		Query:    payload.Query,
		IsFrame:  payload.IsFrame,
		IsCache:  payload.IsCache,
		MenuType: payload.MenuType,
		Visible:  payload.Visible,
		Status:   payload.Status,
		Perms:    payload.Perms,
		Icon:     payload.Icon,
		Remark:   payload.Remark,
		Operator: operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("menu not found"))
		case errors.Is(err, ErrMenuNameRequired):
			resp.BadRequest(ctx, resp.WithMessage("menu name is required"))
		case errors.Is(err, ErrInvalidMenuType):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu type"))
		case errors.Is(err, ErrInvalidMenuStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu status"))
		case errors.Is(err, ErrInvalidMenuVisible):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu visibility"))
		case errors.Is(err, ErrInvalidParentMenu):
			resp.BadRequest(ctx, resp.WithMessage("invalid parent menu"))
		case errors.Is(err, ErrInvalidMenuOrder):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu order"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update menu"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(menu))
}

// Delete godoc
// @Summary 删除菜单
// @Description 根据ID删除菜单
// @Tags System/Menu
// @Security BearerAuth
// @Produce json
// @Param id path int true "菜单ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/menus/{id} [delete]
func (h *Handler) Delete(ctx *gin.Context) {
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

// Reorder godoc
// @Summary 菜单排序
// @Description 批量更新菜单顺序
// @Tags System/Menu
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body reorderMenuRequest true "排序参数"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/menus/reorder [put]
func (h *Handler) Reorder(ctx *gin.Context) {
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
	items := make([]MenuOrderItem, 0, len(payload.Items))
	for _, item := range payload.Items {
		items = append(items, MenuOrderItem{
			MenuID:   item.MenuID,
			ParentID: item.ParentID,
			OrderNum: item.OrderNum,
		})
	}

	if err := h.service.ReorderMenus(ctx.Request.Context(), ReorderMenusInput{
		Items:    items,
		Operator: operator,
	}); err != nil {
		switch {
		case errors.Is(err, ErrInvalidMenuOrder):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu order"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to reorder menus"))
		}
		return
	}

	resp.NoContent(ctx)
}

func resolveOperator(ctx *gin.Context) string {
	id, ok := middleware.GetUserID(ctx)
	if !ok {
		return ""
	}
	return strconv.FormatUint(uint64(id), 10)
}

func parseMenuID(param string) (int64, error) {
	return strconv.ParseInt(strings.TrimSpace(param), 10, 64)
}
