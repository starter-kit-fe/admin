package auth

import (
	"errors"
	"net"
	"net/http"
	"strings"
	"time"
	"unicode"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"github.com/starter-kit-fe/admin/constant"
	"github.com/starter-kit-fe/admin/internal/model"
	"github.com/starter-kit-fe/admin/internal/system/captcha"
	"github.com/starter-kit-fe/admin/internal/system/online"
	"github.com/starter-kit-fe/admin/middleware"
	jwtpkg "github.com/starter-kit-fe/admin/pkg/jwt"
	"github.com/starter-kit-fe/admin/pkg/netutil"
	"github.com/starter-kit-fe/admin/pkg/resp"
	"github.com/starter-kit-fe/admin/pkg/security"
)

type Handler struct {
	repo            *Repository
	captchaService  *captcha.Service
	jwtMaker        *jwtpkg.JWTMaker
	secret          string
	tokenDuration   time.Duration
	refreshDuration time.Duration
	sessionUpdate   time.Duration
	cookieName      string
	refreshCookie   string
	cookieDomain    string
	cookiePath      string
	cookieSecure    bool
	cookieHTTPOnly  bool
	cookieSameSite  http.SameSite
	onlineService   *online.Service
	sessions        *SessionStore
}

type AuthOptions struct {
	Secret          string
	TokenDuration   time.Duration
	RefreshDuration time.Duration
	SessionUpdate   time.Duration
	CookieName      string
	RefreshCookie   string
	CookieDomain    string
	CookiePath      string
	CookieSecure    bool
	CookieHTTPOnly  bool
	CookieSameSite  string
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

type RefreshRequest struct {
	SessionID    string `json:"session_id" example:"7d1b6ad7"`
	RefreshToken string `json:"refresh_token" example:"<refresh-token>"`
}

// LoginResponse 描述登录接口响应体
type LoginResponse struct {
	Code         int    `json:"code" example:"200"`
	Msg          string `json:"msg" example:"操作成功"`
	AccessToken  string `json:"access_token,omitempty" example:"<jwt-token>"`
	RefreshToken string `json:"refresh_token,omitempty" example:"<refresh-token>"`
	SessionID    string `json:"session_id,omitempty" example:"d4f3c3a0"`
	ExpiresAt    int64  `json:"expires_at" example:"1700000000"`
}

// UserInfo 描述用户信息
type UserInfo struct {
	UserID      int64   `json:"userId" example:"1"`
	DeptID      *int64  `json:"deptId" example:"103"`
	UserName    string  `json:"userName" example:"admin"`
	NickName    string  `json:"nickName" example:"admin"`
	Email       string  `json:"email" example:"admin@admin.com"`
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

func NewHandler(repo *Repository, captcha *captcha.Service, opts AuthOptions, onlineSvc *online.Service, sessions *SessionStore) *Handler {
	opts.Secret = strings.TrimSpace(opts.Secret)
	if repo == nil || sessions == nil || opts.Secret == "" {
		return nil
	}

	duration := opts.TokenDuration
	if duration <= 0 {
		duration = constant.JWT_EXP
	}
	refreshDuration := opts.RefreshDuration
	if refreshDuration <= 0 {
		refreshDuration = 30 * 24 * time.Hour
	}
	sessionUpdate := opts.SessionUpdate
	if sessionUpdate <= 0 {
		sessionUpdate = time.Minute
	}

	cookieName := strings.TrimSpace(opts.CookieName)
	if cookieName == "" {
		cookieName = "token"
	}
	refreshCookie := strings.TrimSpace(opts.RefreshCookie)
	if refreshCookie == "" {
		refreshCookie = "refresh_token"
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

	return &Handler{
		repo:            repo,
		captchaService:  captcha,
		jwtMaker:        jwtpkg.NewJWTMaker(),
		secret:          opts.Secret,
		tokenDuration:   duration,
		refreshDuration: refreshDuration,
		sessionUpdate:   sessionUpdate,
		cookieName:      cookieName,
		refreshCookie:   refreshCookie,
		cookieDomain:    cookieDomain,
		cookiePath:      cookiePath,
		cookieSecure:    opts.CookieSecure,
		cookieHTTPOnly:  cookieHTTPOnly,
		cookieSameSite:  cookieSameSite,
		onlineService:   onlineSvc,
		sessions:        sessions,
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
func (h *Handler) Login(ctx *gin.Context) {
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
		case errors.Is(err, ErrRepositoryUnavailable):
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

	session, refreshToken, err := h.sessions.Create(ctx.Request.Context(), uint(user.ID))
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to create session"))
		return
	}
	accessToken, expiresAt, err := h.issueAccessToken(uint(user.ID), session.SessionID)
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to issue token"))
		return
	}
	h.recordOnlineSession(ctx, accessToken, user, session.SessionID)
	h.respondWithTokens(ctx, session.SessionID, accessToken, refreshToken, expiresAt)
}

// Refresh godoc
// @Summary 刷新访问令牌
// @Description 使用长期 Refresh Token 续签 Access Token
// @Tags Auth
// @Accept json
// @Produce json
// @Success 200 {object} LoginResponse
// @Failure 400 {object} resp.Response
// @Failure 401 {object} resp.Response
// @Failure 402 {object} resp.Response
// @Failure 500 {object} resp.Response
// @Router /v1/auth/refresh [post]
func (h *Handler) Refresh(ctx *gin.Context) {
	if h == nil || h.sessions == nil {
		resp.ServiceUnavailable(ctx, resp.WithMessage("session service unavailable"))
		return
	}
	var payload RefreshRequest
	_ = ctx.ShouldBindJSON(&payload)
	sessionID := strings.TrimSpace(payload.SessionID)
	refreshToken := strings.TrimSpace(payload.RefreshToken)
	if sessionID == "" {
		sessionID = strings.TrimSpace(ctx.Query("session_id"))
	}
	if sessionID == "" {
		sessionID = strings.TrimSpace(ctx.PostForm("session_id"))
	}
	if refreshToken == "" {
		refreshToken = strings.TrimSpace(ctx.GetHeader("X-Refresh-Token"))
	}
	if refreshToken == "" {
		refreshToken = strings.TrimSpace(ctx.PostForm("refresh_token"))
	}
	if refreshToken == "" {
		if cookie, err := ctx.Cookie(h.refreshCookie); err == nil {
			refreshToken = strings.TrimSpace(cookie)
		}
	}
	if refreshToken == "" {
		resp.BadRequest(ctx, resp.WithMessage("refresh token required"))
		return
	}
	session, err := h.sessions.ValidateRefresh(ctx.Request.Context(), sessionID, refreshToken)
	if err != nil {
		switch {
		case errors.Is(err, ErrSessionNotFound),
			errors.Is(err, ErrSessionRevoked),
			errors.Is(err, ErrRefreshTokenMissing),
			errors.Is(err, ErrRefreshTokenMismatch),
			errors.Is(err, ErrInvalidRefreshToken):
			resp.PaymentRequired(ctx, resp.WithMessage("refresh token expired"))
		default:
			resp.InternalServerError(ctx, resp.WithMessage("failed to validate refresh token"))
		}
		return
	}
	accessToken, expiresAt, err := h.issueAccessToken(session.UserID, session.SessionID)
	if err != nil {
		resp.InternalServerError(ctx, resp.WithMessage("failed to issue token"))
		return
	}
	session.LastSeen = time.Now()
	_ = h.sessions.UpdateLastSeen(ctx.Request.Context(), session)
	if h.repo != nil {
		if user, err := h.repo.GetUserByID(ctx.Request.Context(), session.UserID); err == nil {
			h.recordOnlineSession(ctx, accessToken, user, session.SessionID)
		}
	}
	h.respondWithTokens(ctx, session.SessionID, accessToken, refreshToken, expiresAt)
}

// Logout godoc
// @Summary 注销当前用户
// @Description 清除用户的认证 Cookie
// @Tags Auth
// @Produce json
// @Success 200 {object} resp.Response
// @Router /v1/auth/logout [post]
func (h *Handler) Logout(ctx *gin.Context) {
	if h == nil {
		resp.Success(ctx, true)
		return
	}
	if sessionID, ok := middleware.GetSessionID(ctx); ok && sessionID != "" && h.sessions != nil {
		if session, err := h.sessions.Get(ctx.Request.Context(), sessionID); err == nil {
			_ = h.sessions.Revoke(ctx.Request.Context(), session)
		}
	}
	h.removeOnlineSession(ctx)
	h.clearAuthCookies(ctx)
	resp.Success(ctx, true)
}

func (h *Handler) setCookie(ctx *gin.Context, name, value string, maxAge int) {
	if h == nil || ctx == nil || strings.TrimSpace(name) == "" {
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
		name,
		value,
		maxAge,
		h.cookiePath,
		h.cookieDomain,
		secure,
		h.cookieHTTPOnly,
	)
}

func (h *Handler) clearAuthCookies(ctx *gin.Context) {
	if h == nil {
		return
	}
	h.setCookie(ctx, h.cookieName, "", -1)
	h.setCookie(ctx, h.refreshCookie, "", -1)
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
func (h *Handler) GetInfo(ctx *gin.Context) {
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
		case errors.Is(err, ErrRepositoryUnavailable):
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
		if errors.Is(err, ErrRepositoryUnavailable) {
			resp.ServiceUnavailable(ctx, resp.WithMessage("authentication service unavailable"))
		} else {
			resp.InternalServerError(ctx, resp.WithMessage("failed to load user roles"))
		}
		return
	}

	permissions, err := h.repo.LoadPermissions(ctx.Request.Context(), userID)
	if err != nil {
		if errors.Is(err, ErrRepositoryUnavailable) {
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
				"userId":      int64(user.ID),
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
func (h *Handler) GetMenus(ctx *gin.Context) {
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
		if errors.Is(err, ErrRepositoryUnavailable) {
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
		cache[int64(menu.ID)] = wrapper
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
	base := strings.TrimSpace(menu.MenuName)
	if base == "" {
		base = strings.TrimSpace(menu.Path)
	}
	slug := slugifyRouteName(base)
	if slug == "" {
		return "menu"
	}
	return slug
}

func slugifyRouteName(value string) string {
	if value == "" {
		return ""
	}
	var builder strings.Builder
	lastDash := false
	for _, r := range value {
		if unicode.IsLetter(r) || unicode.IsDigit(r) {
			builder.WriteRune(unicode.ToLower(r))
			lastDash = false
			continue
		}
		if !lastDash {
			builder.WriteRune('-')
			lastDash = true
		}
	}
	return strings.Trim(builder.String(), "-")
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

	if strings.EqualFold(menu.MenuType, "M") {
		if menu.ParentID == 0 {
			return "Layout"
		}
		return "ParentView"
	}

	if menu.ParentID == 0 {
		return "Layout"
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

func (h *Handler) issueAccessToken(userID uint, sessionID string) (string, time.Time, error) {
	if h == nil || h.jwtMaker == nil {
		return "", time.Time{}, errors.New("jwt maker unavailable")
	}
	dur := h.tokenDuration
	if dur <= 0 {
		dur = constant.JWT_EXP
	}
	token, err := h.jwtMaker.CreateToken(userID, sessionID, h.secret, dur)
	if err != nil {
		return "", time.Time{}, err
	}
	return token, time.Now().Add(dur), nil
}

func (h *Handler) respondWithTokens(ctx *gin.Context, sessionID, accessToken, refreshToken string, expiresAt time.Time) {
	if netutil.IsBrowserRequest(ctx.Request) {
		h.setCookie(ctx, h.cookieName, accessToken, h.cookieMaxAge(h.tokenDuration))
		h.setCookie(ctx, h.refreshCookie, refreshToken, h.cookieMaxAge(h.refreshDuration))
		resp.Success(ctx, gin.H{
			"expires_at": expiresAt.Unix(),
		})
		return
	}
	resp.Success(ctx, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"session_id":    sessionID,
		"expires_at":    expiresAt.Unix(),
	})
}

func (h *Handler) cookieMaxAge(dur time.Duration) int {
	if dur <= 0 {
		return 0
	}
	return int(dur / time.Second)
}

func (h *Handler) recordOnlineSession(ctx *gin.Context, token string, user *model.SysUser, sessionID string) {
	if h == nil || h.onlineService == nil || user == nil {
		return
	}
	tokenHash := security.SHA256Hex(token)
	if tokenHash == "" {
		return
	}

	now := time.Now()
	expiresAt := now.Add(h.tokenDuration)
	if expiresAt.Before(now) {
		expiresAt = now.Add(constant.JWT_EXP)
	}

	ua := ""
	if ctx.Request != nil {
		ua = ctx.Request.UserAgent()
	}
	browser, os := parseUserAgent(ua)

	session := online.Session{
		SessionID:      sessionID,
		TokenHash:      tokenHash,
		UserID:         int64(user.ID),
		UserName:       user.UserName,
		NickName:       user.NickName,
		IPAddr:         clientIP(ctx),
		Browser:        browser,
		OS:             os,
		Status:         "0",
		Msg:            "登录成功",
		LoginTime:      now,
		LastAccessTime: now,
		ExpiresAt:      expiresAt,
	}

	_ = h.onlineService.RecordSession(ctx.Request.Context(), session)
}

func (h *Handler) removeOnlineSession(ctx *gin.Context) {
	if h == nil || h.onlineService == nil {
		return
	}

	token := h.extractToken(ctx)
	tokenHash := security.SHA256Hex(token)
	if tokenHash == "" {
		return
	}
	_ = h.onlineService.RemoveSessionByTokenHash(ctx.Request.Context(), tokenHash)
}

func (h *Handler) extractToken(ctx *gin.Context) string {
	if ctx == nil {
		return ""
	}

	if ctx.Request != nil {
		if header := strings.TrimSpace(ctx.GetHeader("Authorization")); header != "" {
			if token := parseBearerToken(header); token != "" {
				return token
			}
		}
	}

	if token := strings.TrimSpace(ctx.Query("token")); token != "" {
		return token
	}

	if h.cookieName != "" {
		if token, err := ctx.Cookie(h.cookieName); err == nil {
			if trimmed := strings.TrimSpace(token); trimmed != "" {
				return trimmed
			}
		}
	}

	return ""
}

func clientIP(ctx *gin.Context) string {
	if ctx == nil {
		return ""
	}
	return netutil.RealIPFromContext(ctx)
}

func parseUserAgent(ua string) (string, string) {
	ua = strings.TrimSpace(ua)
	if ua == "" {
		return "", ""
	}

	lower := strings.ToLower(ua)

	var browser string
	switch {
	case strings.Contains(lower, "chrome"):
		browser = "Chrome"
	case strings.Contains(lower, "firefox"):
		browser = "Firefox"
	case strings.Contains(lower, "safari") && !strings.Contains(lower, "chrome"):
		browser = "Safari"
	case strings.Contains(lower, "edge"):
		browser = "Edge"
	case strings.Contains(lower, "msie"), strings.Contains(lower, "trident"):
		browser = "Internet Explorer"
	default:
		browser = ua
	}

	var os string
	switch {
	case strings.Contains(lower, "windows"):
		os = "Windows"
	case strings.Contains(lower, "mac os x"):
		os = "macOS"
	case strings.Contains(lower, "android"):
		os = "Android"
	case strings.Contains(lower, "iphone"), strings.Contains(lower, "ipad"), strings.Contains(lower, "ios"):
		os = "iOS"
	case strings.Contains(lower, "linux"):
		os = "Linux"
	default:
		os = ""
	}

	return browser, os
}

func parseBearerToken(header string) string {
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 {
		return ""
	}
	if !strings.EqualFold(parts[0], "Bearer") {
		return ""
	}
	return strings.TrimSpace(parts[1])
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
