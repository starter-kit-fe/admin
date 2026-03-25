package user

import (
	"errors"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/internal/middleware"
	"github.com/starter-kit-fe/admin/internal/system/online"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type Handler struct {
	service *Service
	online  *online.Service
}

func NewHandler(service *Service, onlineSvc *online.Service) *Handler {
	if service == nil {
		return nil
	}
	return &Handler{service: service, online: onlineSvc}
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
	PostIDs     []int64 `json:"postIds"`
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
	PostIDs     *[]int64 `json:"postIds"`
}

type listOptionsQuery struct {
	Keyword string `form:"keyword"`
	Limit   int    `form:"limit"`
}

type resetPasswordRequest struct {
	Password string `json:"password" binding:"required"`
}

type profileUpdateRequest struct {
	NickName    string  `json:"nickName" binding:"required"`
	Email       string  `json:"email"`
	Phonenumber string  `json:"phonenumber"`
	Sex         string  `json:"sex"`
	Remark      *string `json:"remark"`
}

type changePasswordRequest struct {
	CurrentPassword string `json:"currentPassword" binding:"required"`
	NewPassword     string `json:"newPassword" binding:"required"`
}

// List godoc
// @Summary 获取用户列表
// @Description 按条件分页查询系统用户
// @Tags System/User
// @Security BearerAuth
// @Produce json
// @Param pageNum query int false "页码"
// @Param pageSize query int false "每页数量"
// @Param userName query string false "用户名"
// @Param status query string false "用户状态"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/users [get]
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

// ListDepartmentOptions godoc
// @Summary 部门选项
// @Description 查询可用的部门下拉数据
// @Tags System/User
// @Security BearerAuth
// @Produce json
// @Param keyword query string false "关键字"
// @Param limit query int false "返回数量"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/users/options/departments [get]
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

// ListRoleOptions godoc
// @Summary 角色选项
// @Description 查询可用的角色下拉数据
// @Tags System/User
// @Security BearerAuth
// @Produce json
// @Param keyword query string false "关键字"
// @Param limit query int false "返回数量"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/users/options/roles [get]
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

// ListPostOptions godoc
// @Summary 岗位选项
// @Description 查询可用的岗位下拉数据
// @Tags System/User
// @Security BearerAuth
// @Produce json
// @Param keyword query string false "关键字"
// @Param limit query int false "返回数量"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/users/options/posts [get]
func (h *Handler) ListPostOptions(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	var query listOptionsQuery
	if err := ctx.ShouldBindQuery(&query); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid query parameters"))
		return
	}

	options, err := h.service.ListPostOptions(ctx.Request.Context(), query.Keyword, query.Limit)
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load posts"))
		return
	}

	resp.OK(ctx, resp.WithData(options))
}

// Get godoc
// @Summary 获取用户详情
// @Description 根据用户ID查询详细信息
// @Tags System/User
// @Security BearerAuth
// @Produce json
// @Param id path int true "用户ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/users/{id} [get]
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

// Create godoc
// @Summary 新增用户
// @Description 创建系统用户
// @Tags System/User
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body createUserRequest true "用户参数"
// @Success 201 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/users [post]
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
		PostIDs:     payload.PostIDs,
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
		case errors.Is(err, ErrInvalidPostSelection):
			resp.BadRequest(ctx, resp.WithMessage("invalid post selection"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to create user"))
		}
		return
	}

	resp.Created(ctx, resp.WithData(user))
}

// Update godoc
// @Summary 修改用户
// @Description 根据用户ID更新信息
// @Tags System/User
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "用户ID"
// @Param request body updateUserRequest true "用户参数"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 409 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/users/{id} [put]
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
		PostIDs:     payload.PostIDs,
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
		case errors.Is(err, ErrInvalidPostSelection):
			resp.BadRequest(ctx, resp.WithMessage("invalid post selection"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update user"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(user))
}

// Delete godoc
// @Summary 删除用户
// @Description 根据用户ID删除用户
// @Tags System/User
// @Security BearerAuth
// @Produce json
// @Param id path int true "用户ID"
// @Success 204 {object} nil
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/users/{id} [delete]
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

// ResetPassword godoc
// @Summary 重置用户密码
// @Description 为指定用户设置新密码
// @Tags System/User
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "用户ID"
// @Param request body resetPasswordRequest true "新密码"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/system/users/{id}/reset-password [post]
func (h *Handler) ResetPassword(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	id, err := parseUserID(ctx.Param("id"))
	if err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid user id"))
		return
	}

	var payload resetPasswordRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid password payload"))
		return
	}

	operator := resolveOperator(ctx)
	if err := h.service.ResetPassword(ctx.Request.Context(), ResetPasswordInput{
		UserID:   id,
		Password: payload.Password,
		Operator: operator,
	}); err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("user not found"))
		case errors.Is(err, ErrPasswordRequired):
			resp.BadRequest(ctx, resp.WithMessage("password is required"))
		case errors.Is(err, ErrPasswordTooShort):
			resp.BadRequest(ctx, resp.WithMessage("password must be at least 6 characters"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to reset password"))
		}
		return
	}

	resp.OK(ctx, resp.WithMessage("password reset"))
}

// GetProfile godoc
// @Summary 获取个人资料
// @Description 获取当前登录用户的基本资料
// @Tags System/Profile
// @Security BearerAuth
// @Produce json
// @Success 200 {object} resp.Response
// @Failure 401 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Router /v1/profile [get]
func (h *Handler) GetProfile(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	user, err := h.service.GetUser(ctx.Request.Context(), int64(userID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("user not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load profile"))
		return
	}

	resp.OK(ctx, resp.WithData(user))
}

// UpdateProfile godoc
// @Summary 更新个人资料
// @Description 修改当前登录用户的昵称、邮箱、手机号等信息
// @Tags System/Profile
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body profileUpdateRequest true "个人资料"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 401 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Router /v1/profile [put]
func (h *Handler) UpdateProfile(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	var payload profileUpdateRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid profile payload"))
		return
	}

	user, err := h.service.UpdateProfile(ctx.Request.Context(), UpdateProfileInput{
		UserID:      int64(userID),
		NickName:    payload.NickName,
		Email:       payload.Email,
		Phonenumber: payload.Phonenumber,
		Sex:         payload.Sex,
		Remark:      payload.Remark,
	})
	if err != nil {
		switch {
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("user not found"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update profile"))
		}
		return
	}

	resp.OK(ctx, resp.WithData(user))
}

// ChangePassword godoc
// @Summary 修改个人密码
// @Description 校验旧密码并设置新密码
// @Tags System/Profile
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body changePasswordRequest true "密码信息"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 401 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Router /v1/profile/password [put]
func (h *Handler) ChangePassword(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	var payload changePasswordRequest
	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid password payload"))
		return
	}

	if strings.TrimSpace(payload.NewPassword) == "" {
		resp.BadRequest(ctx, resp.WithMessage("new password is required"))
		return
	}

	if err := h.service.ChangePassword(ctx.Request.Context(), ChangePasswordInput{
		UserID:          int64(userID),
		CurrentPassword: payload.CurrentPassword,
		NewPassword:     payload.NewPassword,
	}); err != nil {
		switch {
		case errors.Is(err, ErrPasswordMismatch):
			resp.BadRequest(ctx, resp.WithMessage("当前密码不正确"))
		case errors.Is(err, ErrPasswordTooShort):
			resp.BadRequest(ctx, resp.WithMessage("新密码至少 6 位"))
		case errors.Is(err, ErrPasswordRequired):
			resp.BadRequest(ctx, resp.WithMessage("密码不能为空"))
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.NotFound(ctx, resp.WithMessage("user not found"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to update password"))
		}
		return
	}

	resp.OK(ctx, resp.WithMessage("password updated"))
}

// ListSelfSessions godoc
// @Summary 获取当前用户的登录会话
// @Description 查看当前登录用户的在线会话并支持自助管理
// @Tags System/Profile
// @Security BearerAuth
// @Produce json
// @Success 200 {object} resp.Response
// @Failure 401 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/profile/sessions [get]
func (h *Handler) ListSelfSessions(ctx *gin.Context) {
	if h == nil || h.service == nil || h.online == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	user, err := h.service.GetUser(ctx.Request.Context(), int64(userID))
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			resp.NotFound(ctx, resp.WithMessage("user not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load profile"))
		return
	}

	result, err := h.online.ListOnlineUsers(ctx.Request.Context(), online.ListOptions{
		PageNum:  1,
		PageSize: 200,
		UserName: user.UserName,
	})
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load sessions"))
		return
	}

	resp.OK(ctx, resp.WithData(result))
}

// ForceLogoutSelfSession godoc
// @Summary 自助强制下线单个会话
// @Description 当前用户可在此处注销自己的其他登录会话
// @Tags System/Profile
// @Security BearerAuth
// @Produce json
// @Param id path string true "会话ID"
// @Success 200 {object} resp.Response
// @Failure 400 {object} resp.Response
// @Failure 401 {object} resp.Response
// @Failure 403 {object} resp.Response
// @Failure 404 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Failure 503 {object} resp.Response
// @Router /v1/profile/sessions/{id}/force-logout [post]
func (h *Handler) ForceLogoutSelfSession(ctx *gin.Context) {
	if h == nil || h.service == nil || h.online == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("user service unavailable"))
		return
	}

	sessionID := strings.TrimSpace(ctx.Param("id"))
	if sessionID == "" {
		resp.BadRequest(ctx, resp.WithMessage("invalid session id"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	session, err := h.online.GetOnlineUser(ctx.Request.Context(), sessionID)
	if err != nil {
		if errors.Is(err, online.ErrSessionNotFound) {
			resp.NotFound(ctx, resp.WithMessage("session not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to load session"))
		return
	}

	if session.UserID != int64(userID) {
		resp.Forbidden(ctx, resp.WithMessage("cannot manage session"))
		return
	}

	if err := h.online.ForceLogout(ctx.Request.Context(), sessionID); err != nil {
		if errors.Is(err, online.ErrSessionNotFound) {
			resp.NotFound(ctx, resp.WithMessage("session not found"))
			return
		}
		resp.InternalServerError(ctx, resp.WithMessage("failed to force logout session"))
		return
	}

	resp.Success(ctx, true)
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
