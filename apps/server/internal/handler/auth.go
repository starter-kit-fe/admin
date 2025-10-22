package handler

import (
	"errors"
	"net"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/middleware"
	"github.com/starter-kit-fe/admin/internal/model"
	authrepo "github.com/starter-kit-fe/admin/internal/repo/auth"
	captchaservice "github.com/starter-kit-fe/admin/internal/service/captcha"
	jwtpkg "github.com/starter-kit-fe/admin/pkg/jwt"
	"github.com/starter-kit-fe/admin/pkg/resp"
)

type AuthHandler struct {
	repo           *authrepo.Repository
	captchaService *captchaservice.Service
	jwtMaker       *jwtpkg.JWTMaker
	secret         string
	tokenDuration  time.Duration
	cookieName     string
	cookieDomain   string
	cookiePath     string
	cookieSecure   bool
	cookieHTTPOnly bool
	cookieSameSite http.SameSite
}

type AuthOptions struct {
	Secret         string
	TokenDuration  time.Duration
	CookieName     string
	CookieDomain   string
	CookiePath     string
	CookieSecure   bool
	CookieHTTPOnly bool
	CookieSameSite string
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

type MenuMeta struct {
	Title   string  `json:"title"`
	Icon    string  `json:"icon,omitempty"`
	NoCache bool    `json:"noCache"`
	Link    *string `json:"link"`
}

type MenuNode struct {
	Name       string      `json:"name"`
	Path       string      `json:"path"`
	Hidden     bool        `json:"hidden"`
	Redirect   string      `json:"redirect,omitempty"`
	Component  string      `json:"component"`
	AlwaysShow bool        `json:"alwaysShow"`
	Meta       MenuMeta    `json:"meta"`
	Children   []*MenuNode `json:"children,omitempty"`
}

func NewAuthHandler(repo *authrepo.Repository, captcha *captchaservice.Service, opts AuthOptions) *AuthHandler {
	opts.Secret = strings.TrimSpace(opts.Secret)
	if repo == nil || opts.Secret == "" {
		return nil
	}

	duration := opts.TokenDuration
	if duration <= 0 {
		duration = constant.JWT_EXP
	}

	cookieName := strings.TrimSpace(opts.CookieName)
	if cookieName == "" {
		cookieName = "token"
	}

	cookiePath := strings.TrimSpace(opts.CookiePath)
	if cookiePath == "" {
		cookiePath = "/"
	}

	cookieDomain := sanitizeCookieDomain(opts.CookieDomain)
	cookieSameSite := parseSameSiteOption(opts.CookieSameSite)
	cookieHTTPOnly := opts.CookieHTTPOnly
	if !cookieHTTPOnly {
		cookieHTTPOnly = true
	}

	return &AuthHandler{
		repo:           repo,
		captchaService: captcha,
		jwtMaker:       jwtpkg.NewJWTMaker(),
		secret:         opts.Secret,
		tokenDuration:  duration,
		cookieName:     cookieName,
		cookieDomain:   cookieDomain,
		cookiePath:     cookiePath,
		cookieSecure:   opts.CookieSecure,
		cookieHTTPOnly: cookieHTTPOnly,
		cookieSameSite: cookieSameSite,
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
	if h == nil || h.repo == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		return
	}

	var payload LoginRequest

	if err := ctx.ShouldBindJSON(&payload); err != nil {
		resp.BadRequest(ctx, resp.WithMessage("invalid credentials payload"))
		return
	}

	username := strings.TrimSpace(payload.Username)
	password := payload.Password
	if username == "" || password == "" {
		resp.Forbidden(ctx, resp.WithMessage("invalid username or password"))
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

	user, err := h.repo.GetUserByUsername(ctx.Request.Context(), username)
	if err != nil {
		switch {
		case errors.Is(err, authrepo.ErrRepositoryUnavailable):
			resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.Forbidden(ctx, resp.WithMessage("invalid username or password"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to authenticate"))
		}
		return
	}

	if user.Status != "0" {
		resp.Forbidden(ctx, resp.WithMessage("account disabled"))
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(password)); err != nil {
		resp.Forbidden(ctx, resp.WithMessage("invalid username or password"))
		return
	}

	token, err := h.jwtMaker.CreateToken(uint(user.UserID), h.secret, h.tokenDuration)
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to issue token"))
		return
	}
	maxAge := 0
	if h.tokenDuration > 0 {
		maxAge = int(h.tokenDuration / time.Second)
	}
	h.setTokenCookie(ctx, token, maxAge)
	resp.Success(ctx, true)
}

// Logout godoc
// @Summary 注销当前用户
// @Description 清除用户的认证 Cookie
// @Tags Auth
// @Produce json
// @Success 200 {object} resp.Response
// @Router /v1/auth/logout [post]
func (h *AuthHandler) Logout(ctx *gin.Context) {
	if h == nil {
		resp.Success(ctx, true)
		return
	}
	h.setTokenCookie(ctx, "", -1)
	resp.Success(ctx, true)
}

func (h *AuthHandler) setTokenCookie(ctx *gin.Context, value string, maxAge int) {
	if h == nil || ctx == nil || h.cookieName == "" {
		return
	}

	secure := h.cookieSecure
	if h.cookieSameSite == http.SameSiteNoneMode {
		secure = true
	}
	if !secure && requestUsesHTTPS(ctx.Request) {
		secure = true
	}

	ctx.SetSameSite(h.cookieSameSite)
	ctx.SetCookie(
		h.cookieName,
		value,
		maxAge,
		h.cookiePath,
		h.cookieDomain,
		secure,
		h.cookieHTTPOnly,
	)
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
	if h == nil || h.repo == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	user, err := h.repo.GetUserByID(ctx.Request.Context(), userID)
	if err != nil {
		switch {
		case errors.Is(err, authrepo.ErrRepositoryUnavailable):
			resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		case errors.Is(err, gorm.ErrRecordNotFound):
			resp.Unauthorized(ctx, resp.WithMessage("user not found"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to load user profile"))
		}
		return
	}

	roles, err := h.repo.GetRoles(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, authrepo.ErrRepositoryUnavailable) {
			resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		} else {
			resp.InternalServerError(ctx, resp.WithMessage("failed to load user roles"))
		}
		return
	}

	permissions, err := h.repo.LoadPermissions(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, authrepo.ErrRepositoryUnavailable) {
			resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		} else {
			resp.InternalServerError(ctx, resp.WithMessage("failed to load permissions"))
		}
		return
	}

	if len(roles) == 0 {
		roles = []string{"common"}
	}

	ctx.JSON(200, gin.H{
		"code": 200,
		"msg":  "操作成功",
		"data": gin.H{
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
	if h == nil || h.repo == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		return
	}

	userID, ok := middleware.GetUserID(ctx)
	if !ok {
		resp.Unauthorized(ctx, resp.WithMessage("invalid token"))
		return
	}

	menus, err := h.repo.GetMenus(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, authrepo.ErrRepositoryUnavailable) {
			resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		} else {
			resp.InternalServerError(ctx, resp.WithMessage("failed to load menus"))
		}
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

	type menuWrapper struct {
		menu model.SysMenu
		node *MenuNode
	}

	cache := make(map[int64]*menuWrapper, len(menus))
	ordered := make([]*menuWrapper, 0, len(menus))

	for _, menu := range menus {
		node := transformMenu(menu)
		wrapper := &menuWrapper{
			menu: menu,
			node: node,
		}
		cache[menu.MenuID] = wrapper
		ordered = append(ordered, wrapper)
	}

	roots := make([]*MenuNode, 0)
	for _, wrapper := range ordered {
		if wrapper == nil {
			continue
		}

		if wrapper.menu.ParentID == 0 {
			roots = append(roots, wrapper.node)
			continue
		}

		parent := cache[wrapper.menu.ParentID]
		if parent == nil {
			roots = append(roots, wrapper.node)
			continue
		}
		parent.node.Children = append(parent.node.Children, wrapper.node)
	}

	for _, wrapper := range ordered {
		if wrapper == nil {
			continue
		}
		if len(wrapper.node.Children) > 0 && strings.EqualFold(wrapper.menu.MenuType, "M") {
			wrapper.node.AlwaysShow = true
			if wrapper.node.Redirect == "" {
				wrapper.node.Redirect = "noRedirect"
			}
		}
	}

	return roots
}

func transformMenu(menu model.SysMenu) *MenuNode {
	path := formatMenuPath(menu)
	component := resolveMenuComponent(menu)
	hidden := strings.TrimSpace(menu.Visible) == "1"
	name := resolveRouteName(menu)
	isExternal := isExternalLink(menu)

	meta := MenuMeta{
		Title:   menu.MenuName,
		Icon:    strings.TrimSpace(menu.Icon),
		NoCache: menu.IsCache,
	}

	if isExternal {
		link := strings.TrimSpace(menu.Path)
		if link != "" {
			meta.Link = stringPtr(link)
		}
	}

	node := &MenuNode{
		Name:      name,
		Path:      path,
		Hidden:    hidden,
		Component: component,
		Meta:      meta,
	}

	return node
}

func resolveRouteName(menu model.SysMenu) string {
	name := strings.TrimSpace(menu.RouteName)
	if name != "" {
		return name
	}
	return strings.TrimSpace(menu.MenuName)
}

func formatMenuPath(menu model.SysMenu) string {
	raw := strings.TrimSpace(menu.Path)
	if isExternalLink(menu) {
		return raw
	}

	if menu.ParentID == 0 {
		if raw == "" {
			return "/"
		}
		if !strings.HasPrefix(raw, "/") {
			raw = "/" + raw
		}
		return cleanPath(raw)
	}

	return cleanPath(strings.TrimPrefix(raw, "/"))
}

func resolveMenuComponent(menu model.SysMenu) string {
	if isExternalLink(menu) {
		if menu.ParentID == 0 {
			return "Layout"
		}
		return "InnerLink"
	}

	if menu.Component != nil {
		if component := strings.TrimSpace(*menu.Component); component != "" {
			return component
		}
	}

	if strings.EqualFold(menu.MenuType, "M") {
		if menu.ParentID == 0 {
			return "Layout"
		}
		return "ParentView"
	}

	return "ParentView"
}

func cleanPath(path string) string {
	path = strings.TrimSpace(path)
	path = strings.ReplaceAll(path, "//", "/")
	path = strings.TrimSuffix(path, "/")
	if path == "" {
		return ""
	}
	if !strings.HasPrefix(path, "/") {
		return strings.TrimPrefix(path, "/")
	}
	return path
}

func isExternalLink(menu model.SysMenu) bool {
	if menu.IsFrame {
		return true
	}
	path := strings.TrimSpace(menu.Path)
	if path == "" {
		return false
	}
	lower := strings.ToLower(path)
	return strings.HasPrefix(lower, "http://") || strings.HasPrefix(lower, "https://")
}

func stringPtr(value string) *string {
	if value == "" {
		return nil
	}
	cp := value
	return &cp
}

func requestUsesHTTPS(req *http.Request) bool {
	if req == nil {
		return false
	}
	if req.TLS != nil {
		return true
	}
	if req.URL != nil && strings.EqualFold(req.URL.Scheme, "https") {
		return true
	}
	proto := strings.TrimSpace(req.Header.Get("X-Forwarded-Proto"))
	return strings.EqualFold(proto, "https")
}

func sanitizeCookieDomain(domain string) string {
	domain = strings.TrimSpace(domain)
	if domain == "" {
		return ""
	}
	domain = strings.TrimPrefix(domain, "http://")
	domain = strings.TrimPrefix(domain, "https://")
	domain = strings.TrimPrefix(domain, "//")

	if strings.HasPrefix(domain, "[") {
		return ""
	}

	if strings.Contains(domain, ":") {
		if host, _, err := net.SplitHostPort(domain); err == nil {
			domain = host
		}
	}

	if strings.EqualFold(domain, "localhost") {
		return ""
	}

	return domain
}

func parseSameSiteOption(value string) http.SameSite {
	switch strings.ToLower(strings.TrimSpace(value)) {
	case "strict":
		return http.SameSiteStrictMode
	case "none":
		return http.SameSiteNoneMode
	default:
		return http.SameSiteLaxMode
	}
}
