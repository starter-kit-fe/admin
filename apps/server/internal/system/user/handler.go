package user

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

type listUsersQuery struct {
	PageNum  int    `form:"pageNum"`
	PageSize int    `form:"pageSize"`
	UserName string `form:"userName"`
	Status   string `form:"status"`
}

type createUserRequest struct {
	UserName    string  `json:"userName" binding:"required"`
	NickName    string  `json:"nickName" binding:"required"`
	DeptID      *int64  `json:"deptId"`
	Email       string  `json:"email"`
	Phonenumber string  `json:"phonenumber"`
	Sex         string  `json:"sex"`
	Status      string  `json:"status"`
	Password    string  `json:"password" binding:"required"`
	Remark      *string `json:"remark"`
	RoleIDs     []int64 `json:"roleIds"`
}

type updateUserRequest struct {
	UserName    *string  `json:"userName"`
	NickName    *string  `json:"nickName"`
	DeptID      *int64   `json:"deptId"`
	Email       *string  `json:"email"`
	Phonenumber *string  `json:"phonenumber"`
	Sex         *string  `json:"sex"`
	Status      *string  `json:"status"`
	Remark      *string  `json:"remark"`
	RoleIDs     *[]int64 `json:"roleIds"`
}

type listOptionsQuery struct {
	Keyword string `form:"keyword"`
	Limit   int    `form:"limit"`
}

func (h *Handler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	var query listUsersQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	result, err := h.service.ListUsers(ctx.Request.Context(), ListOptions{
		PageNum:  query.PageNum,
		PageSize: query.PageSize,
		UserName: query.UserName,
		Status:   query.Status,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load users"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

func (h *Handler) ListDepartmentOptions(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	var query listOptionsQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	options, err := h.service.ListDepartmentOptions(ctx.Request.Context(), query.Keyword, query.Limit)
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load departments"))
		return
	}

	resp.OK(ctx, resp.WithData(options))
}

func (h *Handler) ListRoleOptions(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	var query listOptionsQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	options, err := h.service.ListRoleOptions(ctx.Request.Context(), query.Keyword, query.Limit)
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load roles"))
		return
	}

	resp.OK(ctx, resp.WithData(options))
}

func (h *Handler) Get(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	id, err := parseUserID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid user id"))
		return
	}

	user, err := h.service.GetUser(ctx.Request.Context(), id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("user not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load user"))
		return
	}

	resp.OK(ctx, resp.WithData(user))
}

func (h *Handler) Create(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	var payload createUserRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid user payload"))
		return
	}

	operator := resolveOperator(ctx)
	user, err := h.service.CreateUser(ctx.Request.Context(), CreateUserInput{
		UserName:    payload.UserName,
		NickName:    payload.NickName,
		DeptID:      payload.DeptID,
		Email:       payload.Email,
		Phonenumber: payload.Phonenumber,
		Sex:         payload.Sex,
		Status:      payload.Status,
		Password:    payload.Password,
		Remark:      payload.Remark,
		Operator:    operator,
		RoleIDs:     payload.RoleIDs,
	})
	if err != nil {
		switch {
		case errors.Is(err, ErrDuplicateUsername):
			resp.Conflict(ctx, resp.WithMessage("username already exists"))
		case errors.Is(err, ErrPasswordRequired):
			resp.BadRequest(ctx, resp.WithMessage("password is required"))
		case errors.Is(err, ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid user status"))
		case errors.Is(err, ErrInvalidRoleSelection):
			resp.BadRequest(ctx, resp.WithMessage("invalid role selection"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create user"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(user))
}

func (h *Handler) Update(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	id, err := parseUserID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid user id"))
		return
	}

	var payload updateUserRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid user payload"))
		return
	}

	operator := resolveOperator(ctx)
	user, err := h.service.UpdateUser(ctx.Request.Context(), UpdateUserInput{
		ID:          id,
		UserName:    payload.UserName,
		NickName:    payload.NickName,
		DeptID:      payload.DeptID,
		Email:       payload.Email,
		Phonenumber: payload.Phonenumber,
		Sex:         payload.Sex,
		Status:      payload.Status,
		Remark:      payload.Remark,
		Operator:    operator,
		RoleIDs:     payload.RoleIDs,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("user not found"))
		case errors.Is(err, ErrDuplicateUsername):
			resp.Conflict(ctx, resp.WithMessage("username already exists"))
		case errors.Is(err, ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid user status"))
		case errors.Is(err, ErrInvalidRoleSelection):
			resp.BadRequest(ctx, resp.WithMessage("invalid role selection"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update user"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(user))
}

func (h *Handler) Delete(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	id, err := parseUserID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid user id"))
		return
	}

	operator := resolveOperator(ctx)
	if err := h.service.DeleteUser(ctx.Request.Context(), DeleteUserInput{
		ID:       id,
		Operator: operator,
	}); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("user not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to delete user"))
		return
	}

	resp.NoContent(ctx)
}

func parseUserID(param string) (int64, error) {
	return strconv.ParseInt(strings.TrimSpace(param), 10, 64)
}

func resolveOperator(ctx *gin.Context) string {
	id, ok := middleware.GetUserID(ctx)
	if !ok {
		return ""
	}
	return strconv.FormatUint(uint64(id), 10)
}
