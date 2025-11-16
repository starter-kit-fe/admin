package role

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/middleware"
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

type listRolesQuery struct {
	PageNum  int    `form:"pageNum"`
	PageSize int    `form:"pageSize"`
	RoleName string `form:"roleName"`
	Status   string `form:"status"`
}

type createRoleRequest struct {
	RoleName          string  `json:"roleName" binding:"required"`
	RoleKey           string  `json:"roleKey" binding:"required"`
	RoleSort          *int    `json:"roleSort"`
	DataScope         string  `json:"dataScope"`
	MenuCheckStrictly bool    `json:"menuCheckStrictly"`
	DeptCheckStrictly bool    `json:"deptCheckStrictly"`
	Status            string  `json:"status"`
	Remark            *string `json:"remark"`
	MenuIDs           []int64 `json:"menuIds"`
}

type updateRoleRequest struct {
	RoleName          *string  `json:"roleName"`
	RoleKey           *string  `json:"roleKey"`
	RoleSort          *int     `json:"roleSort"`
	DataScope         *string  `json:"dataScope"`
	MenuCheckStrictly *bool    `json:"menuCheckStrictly"`
	DeptCheckStrictly *bool    `json:"deptCheckStrictly"`
	Status            *string  `json:"status"`
	Remark            *string  `json:"remark"`
	MenuIDs           *[]int64 `json:"menuIds"`
}

// List godoc
// @Summary 获取角色列表
// @Description 按条件分页查询角色
// @Tags System/Role
// @Security BearerAuth
// @Produce json
// @Param pageNum query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param roleName query string false "角色名称"
// @Param status query string false "角色状态"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/roles [get]
func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("role service unavailable"))
		return
	}

	var query listRolesQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	result, err := h.service.ListRoles(ctx.Request.Context(), QueryOptions{
		PageNum:  query.PageNum,
		PageSize: query.PageSize,
		RoleName: query.RoleName,
		Status:   query.Status,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load roles"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

// Get godoc
// @Summary 获取角色详情
// @Description 根据ID查询角色信息
// @Tags System/Role
// @Security BearerAuth
// @Produce json
// @Param id path int true "角色ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/roles/{id} [get]
func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("role service unavailable"))
		return
	}

	id, err := parseRoleID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid role id"))
		return
	}

	role, err := h.service.GetRole(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("role not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load role"))
		return
	}

	resp.OK(ctx, resp.WithData(role))
}

// Create godoc
// @Summary 新增角色
// @Description 创建系统角色
// @Tags System/Role
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body createRoleRequest true "角色参数"
// @Success 201 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/roles [post]
func (h *Handler) Create(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("role service unavailable"))
		return
	}

	var payload createRoleRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid role payload"))
		return
	}

	operator := resolveOperator(ctx)
	role, err := h.service.CreateRole(ctx.Request.Context(), CreateRoleInput{
		RoleName:          payload.RoleName,
		RoleKey:           payload.RoleKey,
		RoleSort:          payload.RoleSort,
		DataScope:         payload.DataScope,
		MenuCheckStrictly: payload.MenuCheckStrictly,
		DeptCheckStrictly: payload.DeptCheckStrictly,
		Status:            payload.Status,
		Remark:            payload.Remark,
		Operator:          operator,
		MenuIDs:           payload.MenuIDs,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrRoleNameRequired):
			resp.BadRequest(ctx, resp.WithMessage("role name is required"))
		case errors.Is(err, ErrRoleKeyRequired):
			resp.BadRequest(ctx, resp.WithMessage("role key is required"))
		case errors.Is(err, ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid role status"))
		case errors.Is(err, ErrInvalidDataScope):
			resp.BadRequest(ctx, resp.WithMessage("invalid data scope"))
		case errors.Is(err, ErrInvalidRoleSort):
			resp.BadRequest(ctx, resp.WithMessage("invalid role sort"))
		case errors.Is(err, ErrDuplicateRoleName):
			resp.Conflict(ctx, resp.WithMessage("role name already exists"))
		case errors.Is(err, ErrDuplicateRoleKey):
			resp.Conflict(ctx, resp.WithMessage("role key already exists"))
		case errors.Is(err, ErrInvalidMenuSelection):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu selection"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create role"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(role))
}

// Update godoc
// @Summary 修改角色
// @Description 更新角色信息
// @Tags System/Role
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "角色ID"
// @Param request body updateRoleRequest true "角色参数"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/roles/{id} [put]
func (h *Handler) Update(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("role service unavailable"))
		return
	}

	id, err := parseRoleID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid role id"))
		return
	}

	var payload updateRoleRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid role payload"))
		return
	}

	operator := resolveOperator(ctx)
	role, err := h.service.UpdateRole(ctx.Request.Context(), UpdateRoleInput{
		ID:                id,
		RoleName:          payload.RoleName,
		RoleKey:           payload.RoleKey,
		RoleSort:          payload.RoleSort,
		DataScope:         payload.DataScope,
		MenuCheckStrictly: payload.MenuCheckStrictly,
		DeptCheckStrictly: payload.DeptCheckStrictly,
		Status:            payload.Status,
		Remark:            payload.Remark,
		Operator:          operator,
		MenuIDs:           payload.MenuIDs,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("role not found"))
		case errors.Is(err, ErrRoleNameRequired):
			resp.BadRequest(ctx, resp.WithMessage("role name is required"))
		case errors.Is(err, ErrRoleKeyRequired):
			resp.BadRequest(ctx, resp.WithMessage("role key is required"))
		case errors.Is(err, ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid role status"))
		case errors.Is(err, ErrInvalidDataScope):
			resp.BadRequest(ctx, resp.WithMessage("invalid data scope"))
		case errors.Is(err, ErrInvalidRoleSort):
			resp.BadRequest(ctx, resp.WithMessage("invalid role sort"))
		case errors.Is(err, ErrDuplicateRoleName):
			resp.Conflict(ctx, resp.WithMessage("role name already exists"))
		case errors.Is(err, ErrDuplicateRoleKey):
			resp.Conflict(ctx, resp.WithMessage("role key already exists"))
		case errors.Is(err, ErrInvalidMenuSelection):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu selection"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update role"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(role))
}

// Delete godoc
// @Summary 删除角色
// @Description 根据ID删除角色
// @Tags System/Role
// @Security BearerAuth
// @Produce json
// @Param id path int true "角色ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/roles/{id} [delete]
func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("role service unavailable"))
		return
	}

	id, err := parseRoleID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid role id"))
		return
	}

	operator := resolveOperator(ctx)
	err = h.service.DeleteRole(ctx.Request.Context(), DeleteRoleInput{
		ID:       id,
		Operator: operator,
	})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("role not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete role"))
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

func parseRoleID(raw string) (int64, error) {
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}
	return id, nil
}
