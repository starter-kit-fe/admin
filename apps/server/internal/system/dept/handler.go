package dept

import (
	"errors"
	"strconv"
	"strings"

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

type createDepartmentRequest struct {
	DeptName string  `json:"deptName" binding:"required"`
	ParentID int64   `json:"parentId"`
	OrderNum *int    `json:"orderNum"`
	Leader   *string `json:"leader"`
	Phone    *string `json:"phone"`
	Email    *string `json:"email"`
	Status   string  `json:"status"`
	Remark   *string `json:"remark"`
}

type updateDepartmentRequest struct {
	DeptName *string `json:"deptName"`
	ParentID *int64  `json:"parentId"`
	OrderNum *int    `json:"orderNum"`
	Leader   *string `json:"leader"`
	Phone    *string `json:"phone"`
	Email    *string `json:"email"`
	Status   *string `json:"status"`
	Remark   *string `json:"remark"`
}

func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("department service unavailable"))
		return
	}

	items, err := h.service.ListDepartments(ctx.Request.Context(), QueryOptions{
		Status:   ctx.Query("status"),
		DeptName: ctx.Query("deptName"),
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load departments"))
		return
	}

	resp.OK(ctx, resp.WithData(items))
}

func (h *Handler) Tree(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("department service unavailable"))
		return
	}

	tree, err := h.service.ListDepartmentTree(ctx.Request.Context(), QueryOptions{
		Status:   ctx.Query("status"),
		DeptName: ctx.Query("deptName"),
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load departments"))
		return
	}

	resp.OK(ctx, resp.WithData(tree))
}

func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("department service unavailable"))
		return
	}

	id, err := parseDeptID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid department id"))
		return
	}

	dept, err := h.service.GetDepartment(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("department not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load department"))
		return
	}

	resp.OK(ctx, resp.WithData(dept))
}

func (h *Handler) Create(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("department service unavailable"))
		return
	}

	var payload createDepartmentRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid department payload"))
		return
	}

	orderNum := 0
	if payload.OrderNum != nil {
		orderNum = *payload.OrderNum
	}

	operator := resolveOperator(ctx)
	dept, err := h.service.CreateDepartment(ctx.Request.Context(), CreateDepartmentInput{
		DeptName: payload.DeptName,
		ParentID: payload.ParentID,
		OrderNum: orderNum,
		Leader:   payload.Leader,
		Phone:    payload.Phone,
		Email:    payload.Email,
		Status:   payload.Status,
		Remark:   payload.Remark,
		Operator: operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrDeptNameRequired),
			errors.Is(err, ErrInvalidDepartmentOrder),
			errors.Is(err, ErrInvalidParentDepartment),
			errors.Is(err, ErrInvalidDepartmentStatus):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicateDepartmentName):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create department"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(dept))
}

func (h *Handler) Update(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("department service unavailable"))
		return
	}

	id, err := parseDeptID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid department id"))
		return
	}

	var payload updateDepartmentRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid department payload"))
		return
	}

	operator := resolveOperator(ctx)
	dept, err := h.service.UpdateDepartment(ctx.Request.Context(), UpdateDepartmentInput{
		ID:       id,
		DeptName: payload.DeptName,
		ParentID: payload.ParentID,
		OrderNum: payload.OrderNum,
		Leader:   payload.Leader,
		Phone:    payload.Phone,
		Email:    payload.Email,
		Status:   payload.Status,
		Remark:   payload.Remark,
		Operator: operator,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("department not found"))
		case errors.Is(err, ErrDeptNameRequired),
			errors.Is(err, ErrInvalidDepartmentOrder),
			errors.Is(err, ErrInvalidDepartmentStatus),
			errors.Is(err, ErrInvalidParentDepartment):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		case errors.Is(err, ErrDuplicateDepartmentName):
			resp.Conflict(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update department"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(dept))
}

func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("department service unavailable"))
		return
	}

	id, err := parseDeptID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid department id"))
		return
	}

	operator := resolveOperator(ctx)
	if err := h.service.DeleteDepartment(ctx.Request.Context(), id, operator); err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("department not found"))
		case errors.Is(err, ErrDepartmentHasChildren),
			errors.Is(err, ErrDepartmentHasUsers):
			resp.BadRequest(ctx, resp.WithMessage(err.Error()))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to delete department"))
		}
		return
	}

	resp.NoContent(ctx)
}

func parseDeptID(raw string) (int64, error) {
	trimmed := strings.TrimSpace(raw)
	if trimmed == "" {
		return 0, errors.New("empty id")
	}
	return strconv.ParseInt(trimmed, 10, 64)
}

func resolveOperator(ctx *gin.Context) string {
	id, ok := middleware.GetUserID(ctx)
	if !ok {
		return ""
	}
	return strconv.FormatUint(uint64(id), 10)
}
