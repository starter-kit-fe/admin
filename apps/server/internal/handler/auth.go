package handler

import (
	"errors"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/middleware"
	"github.com/starter-kit-fe/admin/internal/model"
	authservice "github.com/starter-kit-fe/admin/internal/service/auth"
	captchaservice "github.com/starter-kit-fe/admin/internal/service/captcha"
	jwtpkg "github.com/starter-kit-fe/admin/pkg/jwt"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type AuthHandler struct {
	service        *authservice.Service
	captchaService *captchaservice.Service
	jwtMaker       *jwtpkg.JWTMaker
	secret         string
	tokenDuration  time.Duration
}

// LoginRequest 描述登录接口请求体
type LoginRequest struct {
	Username  string `json:"username" example:"admin"`
	Password  string `json:"password" example:"admin123"`
	Code      string `json:"code,omitempty" example:"8"`
	Captcha   string `json:"captcha,omitempty" example:"8"`
	UUID      string `json:"uuid,omitempty" example:"edbf2c533e8e44e4986b98f785bd40a4"`
	CaptchaID string `json:"captcha_id,omitempty" example:"edbf2c533e8e44e4986b98f785bd40a4"`
}

// LoginResponse 描述登录接口响应体
type LoginResponse struct {
	Code  int    `json:"code" example:"200"`
	Msg   string `json:"msg" example:"操作成功"`
	Token string `json:"token" example:"<jwt-token>"`
}

// CaptchaResponseData 描述验证码数据
type CaptchaResponseData struct {
	CaptchaID string `json:"captcha_id" example:"edbf2c533e8e44e4986b98f785bd40a4"`
	Image     string `json:"image" example:"data:image/png;base64,iVBORw0KGgoAAAANSUhEUg..."`
	ExpiresIn int    `json:"expires_in" example:"120"`
}

// CaptchaResponse 描述验证码接口响应
type CaptchaResponse struct {
	Code int                 `json:"code" example:"200"`
	Msg  string              `json:"msg" example:"OK"`
	Data CaptchaResponseData `json:"data"`
}

// CaptchaVerifyRequest 描述验证码校验请求
type CaptchaVerifyRequest struct {
	CaptchaID string `json:"captcha_id" example:"edbf2c533e8e44e4986b98f785bd40a4"`
	Answer    string `json:"answer" example:"8"`
}

// UserInfo 描述用户信息
type UserInfo struct {
	UserID      int64   `json:"userId" example:"1"`
	DeptID      *int64  `json:"deptId" example:"103"`
	UserName    string  `json:"userName" example:"admin"`
	NickName    string  `json:"nickName" example:"若依"`
	Email       string  `json:"email" example:"ry@163.com"`
	Phonenumber string  `json:"phonenumber" example:"15888888888"`
	Sex         string  `json:"sex" example:"1"`
	Avatar      string  `json:"avatar" example:""`
	Status      string  `json:"status" example:"0"`
	Remark      *string `json:"remark"`
}

// GetInfoResponse 描述获取用户信息响应体
type GetInfoResponse struct {
	Code        int      `json:"code" example:"200"`
	Msg         string   `json:"msg" example:"操作成功"`
	Permissions []string `json:"permissions" example:"system:user:list"`
	Roles       []string `json:"roles" example:"admin"`
	User        UserInfo `json:"user"`
}

type MenuNode struct {
	ID        int64       `json:"id"`
	ParentID  int64       `json:"parent_id"`
	Title     string      `json:"title"`
	RouteName string      `json:"route_name"`
	Path      string      `json:"path"`
	MenuType  string      `json:"menu_type"`
	Icon      string      `json:"icon,omitempty"`
	External  bool        `json:"external"`
	Visible   string      `json:"visible"`
	Children  []*MenuNode `json:"children,omitempty"`
}

func NewAuthHandler(service *authservice.Service, captcha *captchaservice.Service, secret string, duration time.Duration) *AuthHandler {
	if service == nil || secret == "" {
		return nil
	}
	if duration <= 0 {
		duration = constant.JWT_EXP
	}
	return &AuthHandler{
		service:        service,
		captchaService: captcha,
		jwtMaker:       jwtpkg.NewJWTMaker(),
		secret:         secret,
		tokenDuration:  duration,
	}
}

// Login godoc
// @Summary 用户登录
// @Description 校验用户名、密码、验证码并生成 JWT
// @Tags Auth
// @Accept json
// @Produce json
// @Param request body LoginRequest true "登录请求"
// @Success 200 {object} LoginResponse
// @Failure 400 {object} resp.Response
// @Failure 401 {object} resp.Response
// @Failure 403 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Router /v1/auth/login [post]
func (h *AuthHandler) Login(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		return
	}

	var payload LoginRequest

	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid credentials payload"))
		return
	}

	if h.captchaService != nil {
		answer := strings.TrimSpace(payload.Code)
		if answer == "" {
			answer = strings.TrimSpace(payload.Captcha)
		}

		captchaID := strings.TrimSpace(payload.UUID)
		if captchaID == "" {
			captchaID = strings.TrimSpace(payload.CaptchaID)
		}

		if captchaID == "" || answer == "" || !h.captchaService.Verify(ctx.Request.Context(), captchaID, answer, true) {
			resp.Forbidden(ctx, resp.WithMessage("captcha verification failed"))
			return
		}
	}

	user, err := h.service.Authenticate(ctx.Request.Context(), payload.Username, payload.Password)
	if err != nil {
		switch {
		case errors.Is(err, authservice.ErrInvalidCredentials):
			resp.Unauthorized(ctx, resp.WithMessage("invalid username or password"))
		case errors.Is(err, authservice.ErrAccountDisabled):
			resp.Forbidden(ctx, resp.WithMessage("account disabled"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to authenticate"))
		}
		return
	}

	token, err := h.jwtMaker.CreateToken(uint(user.UserID), h.secret, h.tokenDuration)
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to issue token"))
		return
	}

	ctx.JSON(200, gin.H{
		"code":  200,
		"msg":   "操作成功",
		"token": token,
	})
}

// GetInfo godoc
// @Summary 获取当前用户信息
// @Description 通过 JWT Token 获取当前用户详情、角色、权限
// @Tags Auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} GetInfoResponse
// @Failure 401 {object} resp.Response
// @Failure 403 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Router /v1/getInfo [get]
// @Router /v1/auth/me [get]
func (h *AuthHandler) GetInfo(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	user, roles, permissions, err := h.service.Profile(ctx.Request.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, authservice.ErrInvalidCredentials):
			resp.Unauthorized(ctx, resp.WithMessage("user not found"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to load user profile"))
		}
		return
	}

	if len(roles) == 0 {
		roles = []string{"common"}
	}

	ctx.JSON(200, gin.H{
		"code":        200,
		"msg":         "操作成功",
		"permissions": permissions,
		"roles":       roles,
		"user": gin.H{
			"userId":      user.UserID,
			"deptId":      user.DeptID,
			"userName":    user.UserName,
			"nickName":    user.NickName,
			"email":       user.Email,
			"phonenumber": user.Phonenumber,
			"sex":         user.Sex,
			"avatar":      user.Avatar,
			"status":      user.Status,
			"remark":      user.Remark,
		},
	})
}

// GetMenus godoc
// @Summary 获取当前用户可访问的菜单树
// @Description 根据当前登录用户角色返回可访问的菜单树
// @Tags Auth
// @Produce json
// @Security BearerAuth
// @Success 200 {object} resp.Response
// @Failure 401 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Router /v1/auth/menus [get]
func (h *AuthHandler) GetMenus(ctx *gin.Context) {
	if h == nil || h.service == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	menus, err := h.service.Menus(ctx.Request.Context(), userID)
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to load menus"))
		return
	}

	nodes := buildMenuTree(menus)

	ctx.JSON(200, gin.H{
		"code": 200,
		"msg":  "操作成功",
		"data": nodes,
	})
}

func buildMenuTree(menus []model.SysMenu) []*MenuNode {
	if len(menus) == 0 {
		return []*MenuNode{}
	}

	cache := make(map[int64]*MenuNode, len(menus))
	ordered := make([]*MenuNode, 0, len(menus))

	for _, menu := range menus {
		node := &MenuNode{
			ID:        menu.MenuID,
			ParentID:  menu.ParentID,
			Title:     menu.MenuName,
			RouteName: menu.RouteName,
			Path:      strings.TrimSpace(menu.Path),
			MenuType:  menu.MenuType,
			Icon:      strings.TrimSpace(menu.Icon),
			External:  menu.IsFrame,
			Visible:   menu.Visible,
		}
		cache[menu.MenuID] = node
		ordered = append(ordered, node)
	}

	roots := make([]*MenuNode, 0)
	for _, menu := range menus {
		node := cache[menu.MenuID]
		if node == nil {
			continue
		}

		if menu.ParentID == 0 {
			roots = append(roots, node)
			continue
		}

		parent := cache[menu.ParentID]
		if parent == nil {
			roots = append(roots, node)
			continue
		}
		parent.Children = append(parent.Children, node)
	}

	return roots
}
