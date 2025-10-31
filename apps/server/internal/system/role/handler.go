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
