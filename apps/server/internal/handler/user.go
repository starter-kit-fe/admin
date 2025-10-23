package handler

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/middleware"
	userservice "github.com/starter-kit-fe/admin/internal/service/user"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type UserHandler struct {
	service *userservice.Service
}

func NewUserHandler(service *userservice.Service) *UserHandler {
	if service == nil {
		return nil
	}
	return &UserHandler{service: service}
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
}

type updateUserRequest struct {
	UserName    *string `json:"userName"`
	NickName    *string `json:"nickName"`
	DeptID      *int64  `json:"deptId"`
	Email       *string `json:"email"`
	Phonenumber *string `json:"phonenumber"`
	Sex         *string `json:"sex"`
	Status      *string `json:"status"`
	Remark      *string `json:"remark"`
}

func (h *UserHandler) List(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	var query listUsersQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	result, err := h.service.ListUsers(ctx.Request.Context(), userservice.ListOptions{
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

func (h *UserHandler) Get(ctx *gin.Context) {
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

func (h *UserHandler) Create(ctx *gin.Context) {
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
	user, err := h.service.CreateUser(ctx.Request.Context(), userservice.CreateUserInput{
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
	})
	if err != nil {
		switch {
		case errors.Is(err, userservice.ErrDuplicateUsername):
			resp.Conflict(ctx, resp.WithMessage("username already exists"))
		case errors.Is(err, userservice.ErrPasswordRequired):
			resp.BadRequest(ctx, resp.WithMessage("password is required"))
		case errors.Is(err, userservice.ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid user status"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create user"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(user))
}

func (h *UserHandler) Update(ctx *gin.Context) {
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
	user, err := h.service.UpdateUser(ctx.Request.Context(), userservice.UpdateUserInput{
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
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("user not found"))
		case errors.Is(err, userservice.ErrDuplicateUsername):
			resp.Conflict(ctx, resp.WithMessage("username already exists"))
		case errors.Is(err, userservice.ErrInvalidStatus):
			resp.BadRequest(ctx, resp.WithMessage("invalid user status"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update user"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(user))
}

func (h *UserHandler) Delete(ctx *gin.Context) {
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
	if err := h.service.DeleteUser(ctx.Request.Context(), userservice.DeleteUserInput{
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
