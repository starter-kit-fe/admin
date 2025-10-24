package handler

import (
	"errors"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	roleservice "github.com/starter-kit-fe/admin/internal/service/role"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type RoleHandler struct {
	service *roleservice.Service
}

func NewRoleHandler(service *roleservice.Service) *RoleHandler {
	if service == nil {
		return nil
	}
	return &RoleHandler{service: service}
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

func (h *RoleHandler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("role service unavailable"))
		return
	}

	var query listRolesQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	result, err := h.service.ListRoles(ctx.Request.Context(), roleservice.ListOptions{
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

func (h *RoleHandler) Get(ctx *gin.Context) {
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

func (h *RoleHandler) Create(ctx *gin.Context) {
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
	role, err := h.service.CreateRole(ctx.Request.Context(), roleservice.CreateRoleInput{
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
		case errors.Is(err, roleservice.ErrRoleNameRequired):
			resp.BadRequest(ctx, resp.WithMessage("role name is required"))
		case errors.Is(err, roleservice.ErrRoleKeyRequired):
			resp.BadRequest(ctx, resp.WithMessage("role key is required"))
		case errors.Is(err, roleservice.ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid role status"))
		case errors.Is(err, roleservice.ErrInvalidDataScope):
			resp.BadRequest(ctx, resp.WithMessage("invalid data scope"))
		case errors.Is(err, roleservice.ErrInvalidRoleSort):
			resp.BadRequest(ctx, resp.WithMessage("invalid role sort"))
		case errors.Is(err, roleservice.ErrDuplicateRoleName):
			resp.Conflict(ctx, resp.WithMessage("role name already exists"))
		case errors.Is(err, roleservice.ErrDuplicateRoleKey):
			resp.Conflict(ctx, resp.WithMessage("role key already exists"))
		case errors.Is(err, roleservice.ErrInvalidMenuSelection):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu selection"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create role"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(role))
}

func (h *RoleHandler) Update(ctx *gin.Context) {
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
	role, err := h.service.UpdateRole(ctx.Request.Context(), roleservice.UpdateRoleInput{
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
		case errors.Is(err, roleservice.ErrRoleNameRequired):
			resp.BadRequest(ctx, resp.WithMessage("role name is required"))
		case errors.Is(err, roleservice.ErrRoleKeyRequired):
			resp.BadRequest(ctx, resp.WithMessage("role key is required"))
		case errors.Is(err, roleservice.ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid role status"))
		case errors.Is(err, roleservice.ErrInvalidDataScope):
			resp.BadRequest(ctx, resp.WithMessage("invalid data scope"))
		case errors.Is(err, roleservice.ErrInvalidRoleSort):
			resp.BadRequest(ctx, resp.WithMessage("invalid role sort"))
		case errors.Is(err, roleservice.ErrDuplicateRoleName):
			resp.Conflict(ctx, resp.WithMessage("role name already exists"))
		case errors.Is(err, roleservice.ErrDuplicateRoleKey):
			resp.Conflict(ctx, resp.WithMessage("role key already exists"))
		case errors.Is(err, roleservice.ErrInvalidMenuSelection):
			resp.BadRequest(ctx, resp.WithMessage("invalid menu selection"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update role"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(role))
}

func (h *RoleHandler) Delete(ctx *gin.Context) {
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
	err = h.service.DeleteRole(ctx.Request.Context(), roleservice.DeleteRoleInput{
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

func parseRoleID(raw string) (int64, error) {
	id, err := strconv.ParseInt(raw, 10, 64)
	if err != nil || id <= 0 {
		return 0, errors.New("invalid id")
	}
	return id, nil
}
